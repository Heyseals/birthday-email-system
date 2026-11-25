import { Suspense } from "react";
import { connection } from "next/server";
import { AlertCircle, Cake, CircleCheck, Info } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

// ----------------------------------------------------------------
// ประเภทของ searchParams ใน Next.js 16
// ----------------------------------------------------------------
interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

// ----------------------------------------------------------------
// Content Component (async Server Component)
// ต้องรับ searchParams Promise แล้ว await ใน Suspense boundary นี้เอง
// เพื่อให้ Next.js 16 cacheComponents ไม่บล็อก prerender
// ----------------------------------------------------------------
async function UnsubscribeContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // บังคับให้ dynamic render — ต้อง await connection() ก่อน dynamic access
  await connection();
  const params = await searchParams;
  const token = params.token;

  // ไม่มี token
  if (!token) {
    return <ErrorCard message="ลิงก์ยกเลิกสมัครรับข้อมูลไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง" />;
  }

  const supabase = createAdminClient();

  // ค้นหาลูกค้าด้วย token
  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, email, unsubscribed, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .single();

  if (error || !customer) {
    return <ErrorCard message="ไม่พบข้อมูลหรือลิงก์หมดอายุแล้ว กรุณาติดต่อผู้ดูแลระบบ" />;
  }

  // ยกเลิกสมัครรับข้อมูลแล้ว
  if (customer.unsubscribed) {
    const unsubDate = customer.unsubscribed_at
      ? new Date(customer.unsubscribed_at).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "ไม่ทราบวันที่";

    return (
      <StatusCard
        type="already"
        title="ยกเลิกรับอีเมลแล้ว"
        message={`อีเมล ${customer.email} ได้รับการยกเลิกสมัครรับข้อมูลแล้วตั้งแต่วันที่ ${unsubDate}`}
      />
    );
  }

  // ยังไม่ได้ยกเลิก → ดำเนินการยกเลิก
  const { error: updateError } = await supabase
    .from("customers")
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", customer.id);

  if (updateError) {
    console.error("[unsubscribe] update error:", updateError.message);
    return (
      <ErrorCard message="เกิดข้อผิดพลาดในการยกเลิก กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ" />
    );
  }

  return (
    <StatusCard
      type="success"
      title="ยกเลิกสมัครรับข้อมูลเรียบร้อย"
      message={`อีเมล ${customer.email} จะไม่ได้รับอีเมลอวยพรวันเกิดจากเราอีกต่อไป`}
    />
  );
}

// ----------------------------------------------------------------
// UI Sub-components
// ----------------------------------------------------------------
function StatusCard({
  type,
  title,
  message,
}: {
  type: "success" | "already" | "error";
  title: string;
  message: string;
}) {
  const colors = {
    success: {
      bg: "bg-green-900/30",
      border: "border-green-700",
      icon: <CircleCheck size={20} strokeWidth={1.5} aria-hidden="true" className="mx-auto text-green-400" />,
      titleColor: "text-green-400",
    },
    already: {
      bg: "bg-yellow-900/30",
      border: "border-yellow-700",
      icon: <Info size={20} strokeWidth={1.5} aria-hidden="true" className="mx-auto text-yellow-400" />,
      titleColor: "text-yellow-400",
    },
    error: {
      bg: "bg-red-900/30",
      border: "border-red-700",
      icon: <AlertCircle size={20} strokeWidth={1.5} aria-hidden="true" className="mx-auto text-red-400" />,
      titleColor: "text-red-400",
    },
  };

  const c = colors[type];

  return (
    <div
      className={`rounded-lg border ${c.border} ${c.bg} p-8 text-center shadow-lg max-w-md w-full`}
    >
      <div className="mb-4 flex justify-center">{c.icon}</div>
      <h2 className={`text-xl font-bold mb-3 ${c.titleColor}`}>{title}</h2>
      <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
      {type === "success" && (
        <p className="text-gray-500 text-xs mt-4">
          หากต้องการสมัครรับข้อมูลอีกครั้ง กรุณาติดต่อผู้ดูแลระบบ
        </p>
      )}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return <StatusCard type="error" title="เกิดข้อผิดพลาด" message={message} />;
}

function LoadingSkeleton() {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-8 text-center shadow-lg max-w-md w-full animate-pulse">
      <div className="h-12 w-12 bg-gray-700 rounded-full mx-auto mb-4" />
      <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto mb-3" />
      <div className="h-4 bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-700 rounded w-5/6 mx-auto" />
    </div>
  );
}

// ----------------------------------------------------------------
// Page Component
// ----------------------------------------------------------------
export default function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex justify-center">
          <Cake size={20} strokeWidth={1.5} aria-hidden="true" className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-white">ระบบส่งอีเมลอวยพรวันเกิด</h1>
        <p className="text-gray-400 text-sm mt-1">ยกเลิกสมัครรับข้อมูล</p>
      </div>

      {/* Content — searchParams Promise ส่งเข้า Suspense boundary เพื่อ dynamic render */}
      <Suspense fallback={<LoadingSkeleton />}>
        <UnsubscribeContent searchParams={searchParams} />
      </Suspense>

      {/* Footer — ใช้ hardcode year เพื่อหลีกเลี่ยง Date.now() warning */}
      <footer className="mt-8 text-gray-600 text-xs text-center">
        <p>© 2567 Birthday Email System · โปรเจกต์การศึกษา</p>
      </footer>
    </main>
  );
}
