import { NextRequest, NextResponse } from "next/server";
import { metric } from "@vercel/functions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBirthdayEmail } from "@/lib/email/resend";

// ----------------------------------------------------------------
// ตรวจสอบว่าปีนั้นเป็นปีอธิกสุรทิน (Leap Year) หรือไม่
// ----------------------------------------------------------------
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
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

  // --- 2. หาวันปัจจุบัน (เวลาไทย GMT+7) ---
  const bangkokNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  const todayYear = bangkokNow.getFullYear();
  const todayMonth = bangkokNow.getMonth() + 1; // 1-12
  const todayDay = bangkokNow.getDate();

  // --- 3. รองรับ 29 ก.พ.: ถ้าปีนี้ไม่ใช่ Leap Year และวันนี้ = 28 ก.พ.
  //       ให้รวมลูกค้าที่เกิดวันที่ 29 ก.พ. ด้วย
  const includeFeb29 =
    todayMonth === 2 && todayDay === 28 && !isLeapYear(todayYear);

  // --- 4. Query ลูกค้าที่ตรงวันเกิดวันนี้ ---
  const supabase = createAdminClient();

  // สร้าง query หลัก: consent=true, unsubscribed=false, เดือน+วันตรง
  const query = supabase
    .from("customers")
    .select("id, name, email, birth_month, birth_day, unsubscribe_token")
    .eq("consent_given", true)
    .eq("unsubscribed", false)
    .eq("birth_month", todayMonth)
    .eq("birth_day", todayDay);

  const { data: mainCustomers, error: mainErr } = await query;

  if (mainErr) {
    console.error("[cron/birthday] query error:", mainErr.message);
    return NextResponse.json({ error: mainErr.message }, { status: 500 });
  }

  // ถ้าต้องรวม 29 ก.พ. ด้วย (ปีที่ไม่มี 29 ก.พ.)
  let feb29Customers: typeof mainCustomers = [];
  if (includeFeb29) {
    const { data: feb29Data } = await supabase
      .from("customers")
      .select("id, name, email, birth_month, birth_day, unsubscribe_token")
      .eq("consent_given", true)
      .eq("unsubscribed", false)
      .eq("birth_month", 2)
      .eq("birth_day", 29);
    feb29Customers = feb29Data ?? [];
  }

  const allEligible = [...(mainCustomers ?? []), ...feb29Customers];

  // --- 5. ส่งอีเมลให้แต่ละคน (ป้องกันส่งซ้ำด้วย email_log) ---
  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const results: Array<{
    customerId: string;
    email: string;
    status: "sent" | "skipped" | "failed";
    reason?: string;
  }> = [];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${request.headers.get("host") ?? "localhost:3000"}`;

  for (const customer of allEligible) {
    // ตรวจสอบว่าส่งจริงแล้วในปีนี้หรือยัง
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
      results.push({
        customerId: customer.id,
        email: customer.email,
        status: "skipped",
        reason: "already sent this year",
      });
      continue;
    }

    // ส่งอีเมล
    let emailStatus: "sent" | "failed" = "sent";
    let errorMsg: string | undefined;

    const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${customer.unsubscribe_token}`;
    const sendResult = await sendBirthdayEmail({
      to: customer.email,
      customerName: customer.name,
      isTest: false,
      unsubscribeUrl,
    });

    if (sendResult.ok) {
      sentCount++;
    } else {
      emailStatus = "failed";
      errorMsg = sendResult.errorMessage;
      failedCount++;
      console.error(
        `[cron/birthday] failed to send to ${customer.email}:`,
        errorMsg
      );
    }

    // บันทึก email_log
    const { error: logErr } = await supabase.from("email_log").insert({
      customer_id: customer.id,
      status: emailStatus,
      is_test: false,
      sent_year: todayYear,
      error_message: errorMsg ?? null,
    });

    if (logErr) {
      console.error("[cron/birthday] log insert error:", logErr.message);
    }

    results.push({
      customerId: customer.id,
      email: customer.email,
      status: emailStatus === "sent" ? "sent" : "failed",
      reason: errorMsg,
    });
  }

  // --- 6. Metrics ---
  const durationMs = Date.now() - jobStart;
  metric("birthday.email.sent", sentCount);
  metric("birthday.email.skipped", skippedCount);
  metric("birthday.email.failed", failedCount);
  metric("birthday.job.duration_ms", durationMs);

  const summary = {
    date: `${todayYear}-${String(todayMonth).padStart(2, "0")}-${String(todayDay).padStart(2, "0")}`,
    includeFeb29,
    eligible: allEligible.length,
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    durationMs,
    results,
  };

  console.log("[cron/birthday] done:", JSON.stringify(summary));

  return NextResponse.json(summary);
}
