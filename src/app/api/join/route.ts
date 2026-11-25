import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { metric } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmEmail } from "@/lib/email/resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { getMaxDaysInMonth } from "@/types/database";

const NEUTRAL_SUCCESS_MESSAGE =
  "หากอีเมลนี้ยังไม่เคยลงทะเบียนหรือยังรอการยืนยัน ระบบได้ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงโฟลเดอร์สแปม)";

const CONFIRM_EXPIRES_HOURS = 24;

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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  // 1. ตรวจ Honeypot: หากบอทกรอกช่องลับ ให้ตอบสำเร็จแบบกลางๆ โดยไม่บันทึกข้อมูล
  const honeypot = String(body.website ?? "").trim();
  if (honeypot) {
    metric("join.submit", 1, { outcome: "honeypot" });
    return NextResponse.json({ ok: true, message: NEUTRAL_SUCCESS_MESSAGE });
  }

  // 2. จำกัดจำนวนครั้งต่อ IP (สูงสุด 5 ครั้ง / 15 นาที)
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`join:${clientIp}`, 5, 15 * 60 * 1000);
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

  // 3. ตรวจสอบ Input ฝั่งเซิร์ฟเวอร์
  const fullName = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const birthMonth = Number(body.birth_month);
  const birthDay = Number(body.birth_day);
  const consentGiven = body.consent_given === true;

  if (!fullName || fullName.length > 100) {
    return NextResponse.json(
      { error: "กรุณากรอกชื่อที่อยากให้เรียก (ไม่เกิน 100 ตัวอักษร)" },
      { status: 400 }
    );
  }

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json(
      { error: "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    return NextResponse.json(
      { error: "กรุณาเลือกเดือนเกิดให้ถูกต้อง (1–12)" },
      { status: 400 }
    );
  }

  const maxDays = getMaxDaysInMonth(birthMonth);
  if (!Number.isInteger(birthDay) || birthDay < 1 || birthDay > maxDays) {
    return NextResponse.json(
      { error: `กรุณาเลือกวันเกิดให้ถูกต้อง (1–${maxDays})` },
      { status: 400 }
    );
  }

  if (!consentGiven) {
    return NextResponse.json(
      { error: "กรุณาติ๊กยินยอมตามเงื่อนไข PDPA ก่อนลงทะเบียน" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // 4. กันอีเมลซ้ำ: ตอบข้อความกลางๆ ไม่เปิดเผยว่ามีอีเมลอยู่ในระบบแล้ว
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

  // 5. สร้าง confirm_token และบันทึกเป็นสถานะ pending ด้วย Secret Key ฝั่งเซิร์ฟเวอร์
  const confirmToken = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + CONFIRM_EXPIRES_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: inserted, error: insertError } = await adminClient
    .from("customers")
    .insert({
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
    })
    .select("id")
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

  // 6. ส่งอีเมลยืนยัน (Double Opt-in)
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin;
  const confirmUrl = `${baseUrl}/confirm?token=${confirmToken}`;

  const emailResult = await sendConfirmEmail({
    to: email,
    customerName: fullName,
    confirmUrl,
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
