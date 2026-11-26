import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmEmail } from "@/lib/email/resend";
import { checkRateLimit } from "@/lib/rate-limit";

const NEUTRAL_RESEND_MESSAGE =
  "หากอีเมลนี้อยู่ระหว่างรอยืนยัน ระบบได้ส่งลิงก์ยืนยันใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องจดหมาย";

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email("กรุณากรอกรูปแบบอีเมลให้ถูกต้อง"),
});

export async function POST(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    return NextResponse.json(
      { error: "ระบบยังไม่ได้ตั้งค่า NEXT_PUBLIC_SITE_URL" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "อีเมลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // จำกัดความถี่ในการส่งซ้ำ (สูงสุด 2 ครั้ง / 5 นาที ต่ออีเมล)
  const rateLimit = await checkRateLimit(`resend:${email}`, 2, 5 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "ส่งอีเมลซ้ำบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const adminClient = createAdminClient();
  const { data: customer } = await adminClient
    .from("customers")
    .select("id, full_name, status, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  if (!customer || customer.status !== "pending") {
    return NextResponse.json({ ok: true, message: NEUTRAL_RESEND_MESSAGE });
  }

  const confirmToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await adminClient
    .from("customers")
    .update({
      confirm_token: confirmToken,
      confirm_token_expires_at: expiresAt,
    })
    .eq("id", customer.id);

  if (updateError) {
    return NextResponse.json(
      { error: "ไม่สามารถสร้างลิงก์ยืนยันใหม่ได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  const confirmUrl = `${siteUrl}/confirm?token=${confirmToken}`;
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${customer.unsubscribe_token}`;

  const sendResult = await sendConfirmEmail({
    to: email,
    customerName: customer.full_name,
    confirmUrl,
    unsubscribeUrl,
    expiresInHours: 24,
  });

  if (!sendResult.ok) {
    return NextResponse.json(
      { error: "ไม่สามารถส่งอีเมลยืนยันได้ในขณะนี้" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, message: NEUTRAL_RESEND_MESSAGE });
}
