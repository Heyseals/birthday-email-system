import { Resend } from "resend";
import { metric } from "@vercel/functions";
import { buildBirthdayEmail } from "./birthday-template";

export interface SendBirthdayEmailParams {
  to: string;
  customerName: string;
  unsubscribeUrl: string;
  isTest: boolean;
}

export type SendBirthdayEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; errorMessage: string };

export async function sendBirthdayEmail({
  to,
  customerName,
  unsubscribeUrl,
  isTest,
}: SendBirthdayEmailParams): Promise<SendBirthdayEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      errorMessage: "ยังไม่ได้ตั้งค่า RESEND_API_KEY ในไฟล์ .env.local",
    };
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "Birthday Wishes <onboarding@resend.dev>";
  const { subject, html, text } = buildBirthdayEmail({
    fullName: customerName,
    unsubscribeUrl,
    isTest,
  });

  const mode = isTest ? "test" : "production";
  const startedAt = performance.now();

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
    });

    if (error || !data?.id) {
      metric("email.send", 1, { outcome: "error", mode });
      return {
        ok: false,
        errorMessage: error?.message ?? "Resend ไม่สามารถส่งอีเมลได้",
      };
    }

    metric("email.send", 1, { outcome: "success", mode });
    return { ok: true, messageId: data.id };
  } catch (err) {
    metric("email.send", 1, { outcome: "error", mode });
    return {
      ok: false,
      errorMessage:
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดขณะเชื่อมต่อ Resend",
    };
  } finally {
    metric("email.send.duration_ms", performance.now() - startedAt, { mode });
  }
}
