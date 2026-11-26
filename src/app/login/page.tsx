import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

async function LoginCardContent() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated =
    Boolean(data?.claims?.sub) && data?.claims?.is_anonymous !== true;

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6">
        <h1
          id="login-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          เข้าสู่ระบบ
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          ระบบส่งอีเมลอวยพรวันเกิดอัตโนมัติ
        </p>
      </div>
      <LoginForm />
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <Suspense
        fallback={
          <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            กำลังโหลดหน้าเข้าสู่ระบบ...
          </section>
        }
      >
        <LoginCardContent />
      </Suspense>
    </main>
  );
}
