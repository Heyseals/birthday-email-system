import { NextRequest, NextResponse } from "next/server";
import { metric } from "@vercel/functions";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBirthdayEmail } from "@/lib/email/resend";
import { sendLineBirthdayMessage } from "@/lib/line/messaging";
import { getBangkokDateOffset, getBangkokToday, isLeapYear } from "@/lib/birthday";

const BATCH_SIZE = 10;
const MAX_RETRIES = 2;

async function sendWithRetry(
  params: Parameters<typeof sendBirthdayEmail>[0]
) {
  let lastResult = await sendBirthdayEmail(params);
  for (let attempt = 1; attempt <= MAX_RETRIES && !lastResult.ok; attempt++) {
    lastResult = await sendBirthdayEmail(params);
  }
  return lastResult;
}

// ----------------------------------------------------------------
// GET /api/cron/birthday
// Vercel Schedules จะ call GET ทุกวัน 01:00 UTC (08:00 Bangkok)
// ----------------------------------------------------------------
export async function GET(request: NextRequest) {
  const jobStart = Date.now();

  // --- 1. ตรวจสอบ CRON_SECRET ---
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    return NextResponse.json(
      { error: "ระบบยังไม่ได้ตั้งค่า NEXT_PUBLIC_SITE_URL" },
      { status: 500 }
    );
  }

  // --- 2. หาวันปัจจุบันตามเวลา Asia/Bangkok ---
  const { year: todayYear, month: todayMonth, day: todayDay } =
    getBangkokToday();

  // --- 3. รองรับ 29 ก.พ.: ถ้าปีนี้ไม่ใช่ Leap Year และวันนี้ = 28 ก.พ. ---
  const includeFeb29 =
    todayMonth === 2 && todayDay === 28 && !isLeapYear(todayYear);

  const supabase = createAdminClient();

  // ลบแถว rate_limits ที่หมดอายุแล้ว
  await supabase
    .from("rate_limits")
    .delete()
    .lte("reset_at", new Date().toISOString());

  // --- 4. Query ลูกค้าที่ตรงวันเกิดวันนี้ (status = 'confirmed' และไม่ unsubscribed) ---
  const { data: mainCustomers, error: mainErr } = await supabase
    .from("customers")
    .select(
      "id, full_name, email, birth_month, birth_day, unsubscribe_token, card_id, custom_message, sender_name, personalized_card_path, line_user_id, notify_line"
    )
    .eq("status", "confirmed")
    .eq("consent_given", true)
    .eq("unsubscribed", false)
    .eq("birth_month", todayMonth)
    .eq("birth_day", todayDay);

  if (mainErr) {
    console.error("[cron/birthday] query error:", mainErr.message);
    return NextResponse.json({ error: mainErr.message }, { status: 500 });
  }

  let feb29Customers: typeof mainCustomers = [];
  if (includeFeb29) {
    const { data: feb29Data } = await supabase
      .from("customers")
      .select(
        "id, full_name, email, birth_month, birth_day, unsubscribe_token, card_id, custom_message, sender_name, personalized_card_path, line_user_id, notify_line"
      )
      .eq("status", "confirmed")
      .eq("consent_given", true)
      .eq("unsubscribed", false)
      .eq("birth_month", 2)
      .eq("birth_day", 29);
    feb29Customers = feb29Data ?? [];
  }

  const allEligible = [...(mainCustomers ?? []), ...feb29Customers];

  // ดึง image_path ของการ์ดที่เกี่ยวข้อง (ถ้ามี)
  const cardIds = Array.from(
    new Set(
      allEligible
        .map((c) => c.card_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const cardImageMap = new Map<string, string>();
  if (cardIds.length > 0) {
    const { data: cardsData } = await supabase
      .from("cards")
      .select("id, image_path")
      .in("id", cardIds);
    for (const card of cardsData ?? []) {
      if (card.image_path) {
        cardImageMap.set(card.id, card.image_path);
      }
    }
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "") ?? "";

  // --- 5. ส่งอีเมลเป็น batch (ป้องกันส่งซ้ำด้วย email_log + retry เมื่อล้มเหลว) ---
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const results: Array<{
    customerId: string;
    email: string;
    status: "sent" | "skipped" | "failed";
    reason?: string;
  }> = [];

  for (let i = 0; i < allEligible.length; i += BATCH_SIZE) {
    const batch = allEligible.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (customer) => {
        const { data: existingLog } = await supabase
          .from("email_log")
          .select("id")
          .eq("customer_id", customer.id)
          .eq("sent_year", todayYear)
          .eq("status", "sent")
          .eq("is_test", false)
          .maybeSingle();

        if (existingLog) {
          skippedCount++;
          return {
            customerId: customer.id,
            email: customer.email,
            status: "skipped" as const,
            reason: "already sent this year",
          };
        }

        const storagePath =
          customer.personalized_card_path ||
          (customer.card_id ? cardImageMap.get(customer.card_id) : null) ||
          null;
        const cardImageUrl =
          storagePath && supabaseUrl
            ? `${supabaseUrl}/storage/v1/object/public/cards/${storagePath}`
            : null;

        const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${customer.unsubscribe_token}`;
        const sendResult = await sendWithRetry({
          to: customer.email,
          customerName: customer.full_name,
          isTest: false,
          unsubscribeUrl,
          cardImageUrl,
          customMessage: customer.custom_message,
          senderName: customer.sender_name,
        });

        const emailStatus: "sent" | "failed" = sendResult.ok
          ? "sent"
          : "failed";
        const errorMsg = sendResult.ok ? undefined : sendResult.errorMessage;

        if (sendResult.ok) {
          sentCount++;
          if (customer.notify_line && customer.line_user_id) {
            await sendLineBirthdayMessage({
              lineUserId: customer.line_user_id,
              fullName: customer.full_name,
              customMessage: customer.custom_message,
              senderName: customer.sender_name,
              cardImageUrl,
            });
          }
        } else {
          failedCount++;
          console.error(
            `[cron/birthday] failed to send to ${customer.email}:`,
            errorMsg
          );
        }

        const { error: logErr } = await supabase.from("email_log").insert({
          customer_id: customer.id,
          recipient_email: customer.email,
          status: emailStatus,
          is_test: false,
          sent_year: todayYear,
          error_message: errorMsg ?? null,
        });

        if (logErr) {
          console.error("[cron/birthday] log insert error:", logErr.message);
        }

        return {
          customerId: customer.id,
          email: customer.email,
          status: emailStatus,
          reason: errorMsg,
        };
      })
    );

    results.push(...batchResults);
  }

  // --- 6. แจ้งเตือนเจ้าของล่วงหน้า 3 วัน (Atomic update กันส่งซ้ำ) ---
  let advanceRemindedCount = 0;
  const target = getBangkokDateOffset(3);
  const includeTargetFeb29 =
    target.month === 2 && target.day === 28 && !isLeapYear(target.year);

  const { data: advanceMain } = await supabase
    .from("customers")
    .select("id, owner_id, full_name, email, birth_month, birth_day")
    .eq("status", "confirmed")
    .not("owner_id", "is", null)
    .eq("birth_month", target.month)
    .eq("birth_day", target.day);

  let advanceFeb29: typeof advanceMain = [];
  if (includeTargetFeb29) {
    const { data: feb29Adv } = await supabase
      .from("customers")
      .select("id, owner_id, full_name, email, birth_month, birth_day")
      .eq("status", "confirmed")
      .not("owner_id", "is", null)
      .eq("birth_month", 2)
      .eq("birth_day", 29);
    advanceFeb29 = feb29Adv ?? [];
  }

  const advanceCandidates = [...(advanceMain ?? []), ...(advanceFeb29 ?? [])];
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (advanceCandidates.length > 0 && resendKey && emailFrom) {
    const resend = new Resend(resendKey);
    for (const item of advanceCandidates) {
      if (!item.owner_id) continue;

      const { data: claimed } = await supabase
        .from("customers")
        .update({ advance_reminded_year: target.year })
        .eq("id", item.id)
        .or(`advance_reminded_year.is.null,advance_reminded_year.lt.${target.year}`)
        .select("id")
        .maybeSingle();

      if (!claimed) continue;

      const { data: ownerData } = await supabase.auth.admin.getUserById(
        item.owner_id
      );
      const ownerEmail = ownerData?.user?.email?.trim().toLowerCase();
      if (!ownerEmail || ownerEmail === item.email.trim().toLowerCase()) {
        continue;
      }

      try {
        await resend.emails.send({
          from: emailFrom,
          to: [ownerEmail],
          subject: `แจ้งเตือน: อีก 3 วันจะถึงวันเกิดของ ${item.full_name} แล้ว`,
          html: `<p>สวัสดีครับ/ค่ะ</p><p>อีก 3 วัน (${item.birth_day}/${item.birth_month}) จะถึงวันเกิดของ <strong>${item.full_name}</strong> แล้ว</p><p>สามารถเข้าไปตรวจสอบหรือแก้ไขการ์ดและข้อความอวยพรได้ที่ <a href="${siteUrl}/dashboard">${siteUrl}/dashboard</a></p>`,
        });
        advanceRemindedCount++;
      } catch (err) {
        console.error("[cron/birthday] advance reminder error:", err);
      }
    }
  }

  const durationMs = Date.now() - jobStart;
  metric("birthday.email.sent", sentCount);
  metric("birthday.email.skipped", skippedCount);
  metric("birthday.email.failed", failedCount);

  return NextResponse.json({
    ok: true,
    date: `${todayYear}-${String(todayMonth).padStart(2, "0")}-${String(todayDay).padStart(2, "0")}`,
    eligible: allEligible.length,
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    advanceReminded: advanceRemindedCount,
    durationMs,
    results,
  });
}
