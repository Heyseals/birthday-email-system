import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        <h2 className="text-base font-semibold">
          ระบบยืนยันตัวตนแอดมินพร้อมใช้งาน (ขั้นที่ 4)
        </h2>
        <p className="mt-1 text-sm opacity-90">
          หน้านี้ถูกป้องกันด้วย Next.js Proxy และตรวจสอบสิทธิ์ฝั่ง Server แล้ว
          (ตารางลูกค้าและประวัติส่งอีเมลจะเพิ่มในขั้นที่ 5)
        </p>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="flex-1 bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            กำลังตรวจสอบสิทธิ์แอดมิน...
          </div>
        }
      >
        <AdminDashboardContent />
      </Suspense>
    </main>
  );
}
