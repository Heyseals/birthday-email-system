import Link from "next/link";
import { Cake, Home, Sparkles } from "lucide-react";
import { TopBuntingBar } from "@/components/public-shell";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFDF9] text-[#3B2A26]">
      <TopBuntingBar />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-full space-y-6 rounded-2xl border border-[#E8D9C8] bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF8EE] text-[#D97724]">
            <Cake size={32} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#D97724]">
              404 — ไม่พบหน้าที่ต้องการ
            </p>
            <h1 className="text-2xl font-bold text-[#3B2A26]">
              ขออภัย ไม่พบหน้านี้ในระบบ
            </h1>
            <p className="text-sm leading-relaxed text-[#7A635D]">
              ลิงก์อาจถูกย้าย ลบออก หรือการ์ดที่คุณเปิดอาจถูกตั้งค่าเป็นส่วนตัวแล้ว
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#D97724] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B85E16]"
            >
              <Home size={16} />
              <span>กลับหน้าหลัก</span>
            </Link>
            <Link
              href="/create"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E8D9C8] bg-[#FFF8EE] px-5 py-2.5 text-sm font-medium text-[#3B2A26] transition-colors hover:bg-[#F5E9D9]"
            >
              <Sparkles size={16} />
              <span>สร้างการ์ดอวยพร</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
