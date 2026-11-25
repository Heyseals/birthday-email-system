import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AlertCircle, ArrowUpRight, Cake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TopBuntingBar } from "@/components/public-shell";
import { AdminDashboard } from "./admin-dashboard";
import type { Customer, EmailLog } from "@/types/database";

function getBangkokTodayParts() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value ?? 2026);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 1);

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const isNonLeapFeb28 = !isLeap && month === 2 && day === 28;

  return { month, day, isNonLeapFeb28 };
}

async function AdminDashboardContent() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub || claims.is_anonymous === true) {
    redirect("/login");
  }

  const adminEmail =
    typeof claims.email === "string" ? claims.email : "แอดมิน";

  const [{ data: customersData, error: customersError }, { data: logsData, error: logsError }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("email_log")
        .select("*, customers(full_name)")
        .order("sent_at", { ascending: false })
        .limit(200),
    ]);

  const today = getBangkokTodayParts();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Cake
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0 text-[var(--birthday-primary)]"
            />
            <h1 className="text-2xl font-semibold text-[var(--birthday-text)]">
              หน้าจัดการแอดมิน
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--birthday-muted)]">
            เข้าสู่ระบบในชื่อ: <span className="font-medium text-[var(--birthday-text)]">{adminEmail}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/join"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--birthday-primary)] bg-[var(--birthday-soft)] px-4 py-2 text-sm font-medium text-[var(--birthday-primary)] transition-colors hover:bg-[var(--birthday-primary)] hover:text-[var(--birthday-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            <span>เปิดหน้าลงทะเบียน</span>
            <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="min-h-[44px] rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-4 py-2 text-sm font-medium text-[var(--birthday-text)] transition-colors hover:bg-[var(--birthday-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      {(customersError || logsError) && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-[var(--birthday-soft)] px-4 py-3 text-sm text-[var(--birthday-error)]"
        >
          <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
          <span>เกิดข้อผิดพลาดในการโหลดข้อมูลจาก Supabase กรุณารีเฟรชหน้าใหม่อีกครั้ง</span>
        </div>
      )}

      <AdminDashboard
        customers={(customersData as Customer[]) ?? []}
        emailLogs={(logsData as unknown as EmailLog[]) ?? []}
        todayMonth={today.month}
        todayDay={today.day}
        isNonLeapFeb28={today.isNonLeapFeb28}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--birthday-bg)] text-[var(--birthday-text)] font-[family-name:var(--font-ibm-plex-thai)]">
      <TopBuntingBar />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-6 text-sm text-[var(--birthday-muted)]">
              กำลังโหลดข้อมูลลูกค้าและประวัติการส่ง...
            </div>
          }
        >
          <AdminDashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
