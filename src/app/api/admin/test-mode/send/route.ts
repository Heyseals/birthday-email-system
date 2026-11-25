import { NextResponse, type NextRequest } from "next/server";
import { metric } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBirthdayEmail } from "@/lib/email/resend";

function getBangkokYear(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(new Date());

  return Number(parts.find((p) => p.type === "year")?.value ?? 2026);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub || claims.is_anonymous === true) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          "ยังไม่ได้ตั้งค่า SUPABASE_SECRET_KEY ใน .env.local จึงยังไม่สามารถบันทึกผลลง email_log ได้",
      },
      { status: 500 }
    );
  }

  let body: { customerId?: string; testRecipientEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลคำขอไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const customerId = String(body.customerId ?? "").trim();
  const testRecipientEmail = String(body.testRecipientEmail ?? "")
    .trim()
    .toLowerCase();

  if (!customerId) {
    return NextResponse.json(
      { error: "กรุณาเลือกลูกค้าจำลองที่จะใช้ทดสอบ" },
      { status: 400 }
    );
  }

  if (
    !testRecipientEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipientEmail)
  ) {
    return NextResponse.json(
      { error: "กรุณากรอกอีเมลผู้รับทดสอบให้ถูกต้อง" },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const { data: customer, error: customerError } = await adminClient
    .from("customers")
    .select("id, full_name, unsubscribe_token")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    return NextResponse.json(
      { error: "ไม่พบข้อมูลลูกค้าจำลองที่เลือก" },
      { status: 404 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin;
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${customer.unsubscribe_token}`;
  const sentYear = getBangkokYear();

  const sendResult = await sendBirthdayEmail({
    to: testRecipientEmail,
    customerName: customer.full_name,
    unsubscribeUrl,
    isTest: true,
  });

  if (!sendResult.ok) {
    await adminClient.from("email_log").insert({
      customer_id: customer.id,
      recipient_email: testRecipientEmail,
      sent_year: sentYear,
      status: "failed",
      is_test: true,
      error_message: sendResult.errorMessage,
    });

    metric("admin.test_send", 1, { outcome: "error" });
    return NextResponse.json(
      {
        error: `ส่งทดสอบไม่สำเร็จ: ${sendResult.errorMessage} (หมายเหตุ: หากใช้ Resend โหมดฟรีที่ยังไม่ผูกโดเมน จะส่งได้เฉพาะอีเมลที่ใช้สมัคร Resend เท่านั้น)`,
      },
      { status: 502 }
    );
  }

  const { error: logError } = await adminClient.from("email_log").insert({
    customer_id: customer.id,
    recipient_email: testRecipientEmail,
    sent_year: sentYear,
    status: "test",
    is_test: true,
    provider_message_id: sendResult.messageId,
  });

  if (logError) {
    metric("admin.test_send", 1, { outcome: "log_error" });
    return NextResponse.json(
      {
        error:
          "ส่งอีเมลทดสอบสำเร็จแล้ว แต่บันทึกประวัติลง email_log ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }

  metric("admin.test_send", 1, { outcome: "success" });
  return NextResponse.json({
    ok: true,
    messageId: sendResult.messageId,
    customerName: customer.full_name,
    recipientEmail: testRecipientEmail,
  });
}
