import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TopBuntingBar } from "@/components/public-shell";
import { DashboardClient } from "./dashboard-client";
import type { CardRecord, Customer, EmailLog } from "@/types/database";

async function DashboardContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: customersData }, { data: cardsData }, { data: logsData }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("cards")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("email_log")
        .select("*, customers(full_name)")
        .order("sent_at", { ascending: false })
        .limit(100),
    ]);

  return (
    <DashboardClient
      userEmail={user.email ?? "ผู้ใช้"}
      initialCustomers={(customersData as Customer[]) ?? []}
      initialCards={(cardsData as CardRecord[]) ?? []}
      initialLogs={(logsData as EmailLog[]) ?? []}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
    />
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#3B2A26]">
      <TopBuntingBar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#E8D9C8] bg-[#FFF8EE] p-8 text-center text-sm text-[#7A635D]">
              กำลังโหลดข้อมูลแดชบอร์ด...
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
