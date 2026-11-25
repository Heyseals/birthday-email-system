import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            หน้าจัดการแอดมิน (Admin Dashboard)
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            เข้าสู่ระบบในชื่อ: <span className="font-medium">{adminEmail}</span>
          </p>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="min-h-11 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            ออกจากระบบ
          </button>
        </form>
      </header>

      {(customersError || logsError) && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
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
    <main className="flex-1 bg-zinc-50 px-4 py-8 dark:bg-zinc-950 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            กำลังโหลดข้อมูลลูกค้าและประวัติการส่ง...
          </div>
        }
      >
        <AdminDashboardContent />
      </Suspense>
    </main>
  );
}
