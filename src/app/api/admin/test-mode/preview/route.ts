import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMaxDaysInMonth } from "@/types/database";

function getBangkokDateParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((p) => p.type === "year")?.value ?? 2026),
    month: Number(parts.find((p) => p.type === "month")?.value ?? 1),
    day: Number(parts.find((p) => p.type === "day")?.value ?? 1),
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub || claims.is_anonymous === true) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bangkok = getBangkokDateParts();
  const monthParam = request.nextUrl.searchParams.get("month");
  const dayParam = request.nextUrl.searchParams.get("day");

  const month = monthParam ? Number(monthParam) : bangkok.month;
  const day = dayParam ? Number(dayParam) : bangkok.day;

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > getMaxDaysInMonth(month)
  ) {
    return NextResponse.json(
      { error: "วันที่จำลองไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const isLeap =
    (bangkok.year % 4 === 0 && bangkok.year % 100 !== 0) ||
    bangkok.year % 400 === 0;
  const includeFeb29 = !isLeap && month === 2 && day === 28;

  let query = supabase
    .from("customers")
    .select("id, full_name, email, birth_month, birth_day")
    .eq("consent_given", true)
    .eq("unsubscribed", false)
    .eq("birth_month", month);

  if (includeFeb29) {
    query = query.in("birth_day", [28, 29]);
  } else {
    query = query.eq("birth_day", day);
  }

  const [{ data: candidates, error: custError }, { data: sentLogs, error: logError }] =
    await Promise.all([
      query.order("full_name"),
      supabase
        .from("email_log")
        .select("customer_id")
        .eq("sent_year", bangkok.year)
        .eq("status", "sent")
        .eq("is_test", false),
    ]);

  if (custError || logError) {
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูล Preview ได้" },
      { status: 500 }
    );
  }

  const sentSet = new Set((sentLogs ?? []).map((row) => row.customer_id));
  const eligible = (candidates ?? []).filter((c) => !sentSet.has(c.id));
  const skippedAlreadySentCount = (candidates ?? []).length - eligible.length;

  return NextResponse.json({
    targetDate: { year: bangkok.year, month, day, includeFeb29 },
    eligible,
    skippedAlreadySentCount,
  });
}
