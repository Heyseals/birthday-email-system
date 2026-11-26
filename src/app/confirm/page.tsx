import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { AlertCircle, Cake, CircleCheck, Info } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { isConfirmTokenExpired } from "@/lib/birthday";

interface ConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

async function ConfirmContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    return (
      <StatusCard
        type="error"
        title="ลิงก์ยืนยันไม่ถูกต้อง"
        message="ไม่พบรหัสยืนยันในลิงก์ กรุณาตรวจสอบลิงก์จากอีเมลของคุณอีกครั้ง"
      />
    );
  }

  const supabase = createAdminClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, full_name, email, status, confirm_token_expires_at")
    .eq("confirm_token", token)
    .maybeSingle();

  if (error || !customer) {
    return (
      <StatusCard
        type="error"
        title="ไม่พบข้อมูลการยืนยัน"
        message="ลิงก์นี้อาจถูกใช้งานไปแล้วหรือหมดอายุ กรุณาลงทะเบียนใหม่อีกครั้ง"
      />
    );
  }

  if (customer.status === "confirmed") {
    return (
      <StatusCard
        type="already"
        title="ยืนยันอีเมลเรียบร้อยแล้ว"
        message={`อีเมล ${customer.email} ได้รับการยืนยันแล้ว คุณจะได้รับคำอวยพรในวันเกิดของคุณ`}
      />
    );
  }

  if (isConfirmTokenExpired(customer.confirm_token_expires_at)) {
    return (
      <StatusCard
        type="error"
        title="ลิงก์ยืนยันหมดอายุแล้ว"
        message="ลิงก์ยืนยันมีอายุ 24 ชั่วโมง กรุณากลับไปที่หน้าลงทะเบียนเพื่อส่งลิงก์ยืนยันใหม่อีกครั้ง"
      />
    );
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      status: "confirmed",
      confirm_token: null,
      confirm_token_expires_at: null,
    })
    .eq("id", customer.id);

  if (updateError) {
    console.error("[confirm] update error:", updateError.message);
    return (
      <StatusCard
        type="error"
        title="เกิดข้อผิดพลาด"
        message="ไม่สามารถยืนยันอีเมลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
      />
    );
  }

  return (
    <StatusCard
      type="success"
      title="ยืนยันอีเมลสำเร็จ!"
      message={`ยินดีต้อนรับคุณ ${customer.full_name} ระบบจะส่งการ์ดอวยพรวันเกิดให้คุณทางอีเมล ${customer.email}`}
    />
  );
}

function StatusCard({
  type,
  title,
  message,
}: {
  type: "success" | "already" | "error";
  title: string;
  message: string;
}) {
  const styles = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: <CircleCheck size={28} className="mx-auto text-emerald-600" />,
      titleColor: "text-emerald-900",
    },
    already: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: <Info size={28} className="mx-auto text-amber-600" />,
      titleColor: "text-amber-900",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <AlertCircle size={28} className="mx-auto text-red-600" />,
      titleColor: "text-red-900",
    },
  }[type];

  return (
    <div className={`rounded-2xl border p-8 text-center ${styles.bg} ${styles.border}`}>
      <div className="mb-3">{styles.icon}</div>
      <h1 className={`mb-2 text-xl font-bold ${styles.titleColor}`}>{title}</h1>
      <p className="mb-6 text-sm leading-relaxed text-[#5C443E]">{message}</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-[#C8421F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A93517]"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
}

export default function ConfirmPage({ searchParams }: ConfirmPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF8EE] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-[#C8421F]">
          <Cake size={24} />
          <span className="text-lg font-bold">ระบบอวยพรวันเกิดอัตโนมัติ</span>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#E8D9C8] bg-white p-8 text-center text-sm text-[#6B5750]">
              กำลังตรวจสอบลิงก์ยืนยัน...
            </div>
          }
        >
          <ConfirmContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
