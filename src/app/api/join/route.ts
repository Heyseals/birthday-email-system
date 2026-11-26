import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { metric } from "@vercel/functions";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendConfirmEmail } from "@/lib/email/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMaxDaysInMonth } from "@/types/database";

const NEUTRAL_SUCCESS_MESSAGE =
  "หากอีเมลนี้ยังไม่เคยลงทะเบียนหรือยังรอการยืนยัน ระบบได้ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงโฟลเดอร์สแปม)";

const CONFIRM_EXPIRES_HOURS = 24;

const joinSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "กรุณากรอกชื่อที่อยากให้เรียก (ไม่เกิน 100 ตัวอักษร)")
      .max(100, "กรุณากรอกชื่อที่อยากให้เรียก (ไม่เกิน 100 ตัวอักษร)"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง")
      .email("กรุณากรอกรูปแบบอีเมลให้ถูกต้อง"),
    birth_month: z.coerce
      .number()
      .int()
      .min(1, "กรุณาเลือกเดือนเกิดให้ถูกต้อง (1–12)")
      .max(12, "กรุณาเลือกเดือนเกิดให้ถูกต้อง (1–12)"),
    birth_day: z.coerce.number().int().min(1, "กรุณาเลือกวันเกิดให้ถูกต้อง"),
    consent_given: z.literal(true, {
      message: "กรุณาติ๊กยินยอมตามเงื่อนไข PDPA ก่อนลงทะเบียน",
    }),
    website: z.string().optional(),
    turnstile_token: z.string().optional(),
    card_id: z.string().uuid().optional().nullable(),
    custom_message: z.string().trim().max(500, "ข้อความเพิ่มเติมต้องไม่เกิน 500 ตัวอักษร").optional().nullable(),
    sender_name: z.string().trim().max(100, "ชื่อผู้ส่งต้องไม่เกิน 100 ตัวอักษร").optional().nullable(),
    personalized_card_path: z.string().trim().max(300).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const maxDays = getMaxDaysInMonth(data.birth_month);
    if (data.birth_day < 1 || data.birth_day > maxDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birth_day"],
        message: `กรุณาเลือกวันเกิดให้ถูกต้อง (1–${maxDays})`,
      });
    }
  });

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json(
      { error: "ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูลฝั่งเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    return NextResponse.json(
      { error: "ระบบยังไม่ได้ตั้งค่า NEXT_PUBLIC_SITE_URL" },
      { status: 500 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  // 1. ตรวจ Honeypot: หากบอทกรอกช่องลับ ให้ตอบสำเร็จแบบกลางๆ โดยไม่บันทึกข้อมูล
  const honeypot =
    typeof rawBody === "object" &&
    rawBody !== null &&
    "website" in rawBody
      ? String((rawBody as Record<string, unknown>).website ?? "").trim()
      : "";
  if (honeypot) {
    metric("join.submit", 1, { outcome: "honeypot" });
    return NextResponse.json({ ok: true, message: NEUTRAL_SUCCESS_MESSAGE });
  }

  // 2. จุดเสียบ Cloudflare Turnstile (ข้ามได้หากยังไม่ได้ตั้ง TURNSTILE_SECRET_KEY)
  if (process.env.TURNSTILE_SECRET_KEY) {
    // TODO: ตรวจสอบ turnstile_token กับ https://challenges.cloudflare.com/turnstile/v0/siteverify
  }

  // 3. จำกัดจำนวนครั้งต่อ IP แบบ persistent บน Supabase (สูงสุด 5 ครั้ง / 15 นาที)
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`join:${clientIp}`, 5, 15 * 60);
  if (!rateLimit.allowed) {
    metric("join.submit", 1, { outcome: "rate_limited" });
    return NextResponse.json(
      { error: "มีการส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  // 4. ตรวจสอบ Input ด้วย Zod
  const parsed = joinSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const {
    full_name: fullName,
    email,
    birth_month: birthMonth,
    birth_day: birthDay,
    card_id: cardId,
    custom_message: customMessage,
    sender_name: senderName,
    personalized_card_path: personalizedCardPath,
  } = parsed.data;

  const authClient = await createClient();
  const { data: userData } = await authClient.auth.getUser();
  const ownerId = userData?.user?.id ?? null;

  const adminClient = createAdminClient();

  // 5. กันอีเมลซ้ำ: ตอบข้อความกลางๆ ไม่เปิดเผยว่ามีอีเมลอยู่ในระบบแล้ว
  const { data: existing, error: lookupError } = await adminClient
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("[join] lookup error:", lookupError.message);
    return NextResponse.json(
      { error: "ไม่สามารถตรวจสอบข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  if (existing) {
    metric("join.submit", 1, { outcome: "duplicate_neutral" });
    return NextResponse.json({ ok: true, message: NEUTRAL_SUCCESS_MESSAGE });
  }

  // 6. สร้าง confirm_token และบันทึกเป็นสถานะ pending
  const confirmToken = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + CONFIRM_EXPIRES_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: inserted, error: insertError } = await adminClient
    .from("customers")
    .insert({
      owner_id: ownerId,
      full_name: fullName,
      email,
      birth_month: birthMonth,
      birth_day: birthDay,
      consent_given: true,
      consent_at: now.toISOString(),
      unsubscribed: false,
      status: "pending",
      confirm_token: confirmToken,
      confirm_token_expires_at: expiresAt,
      card_id: cardId ?? null,
      custom_message: customMessage || null,
      sender_name: senderName || null,
      personalized_card_path: personalizedCardPath || null,
    })
    .select("id, unsubscribe_token")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      metric("join.submit", 1, { outcome: "duplicate_neutral" });
      return NextResponse.json({ ok: true, message: NEUTRAL_SUCCESS_MESSAGE });
    }
    console.error("[join] insert error:", insertError.message);
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  // 7. ส่งอีเมลยืนยัน (Double Opt-in)
  const confirmUrl = `${siteUrl}/confirm?token=${confirmToken}`;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${inserted.unsubscribe_token}`;

  const emailResult = await sendConfirmEmail({
    to: email,
    customerName: fullName,
    confirmUrl,
    unsubscribeUrl,
    senderName: senderName || null,
    expiresInHours: CONFIRM_EXPIRES_HOURS,
  });

  if (!emailResult.ok) {
    console.error("[join] confirm email error:", emailResult.errorMessage);
    await adminClient.from("customers").delete().eq("id", inserted.id);
    metric("join.submit", 1, { outcome: "email_failed" });
    return NextResponse.json(
      {
        error:
          "ไม่สามารถส่งอีเมลยืนยันได้ในขณะนี้ (หมายเหตุ: หาก Resend ยังไม่ผูกโดเมน จะทดสอบส่งได้เฉพาะอีเมลที่ใช้สมัคร Resend)",
      },
      { status: 502 }
    );
  }

  metric("join.submit", 1, { outcome: "created_pending" });
  return NextResponse.json({ ok: true, message: NEUTRAL_SUCCESS_MESSAGE });
}
