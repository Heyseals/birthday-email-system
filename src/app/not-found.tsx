import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "ไม่พบหน้าที่ต้องการ | ระบบอวยพรวันเกิดอัตโนมัติ",
  description: "ไม่พบหน้าที่คุณกำลังค้นหา กรุณากลับไปยังหน้าแรก",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <PublicShell maxWidth="reading">
      <section className="py-8">
        <div className="mb-4 flex items-center gap-2.5">
          <SearchX
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className="shrink-0 text-[var(--birthday-primary)]"
          />
          <h1 className="text-2xl font-semibold text-[var(--birthday-text)]">
            ไม่พบหน้าที่ต้องการ
          </h1>
        </div>

        <p className="mb-8 text-base leading-relaxed text-[var(--birthday-muted)]">
          ลิงก์นี้อาจถูกย้าย ลบออก หรือพิมพ์ไม่ถูกต้อง
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--birthday-primary)] px-5 py-2.5 text-sm font-medium text-[var(--birthday-on-primary)] transition-colors hover:bg-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            กลับหน้าแรก
          </Link>
          <Link
            href="/join"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-5 py-2.5 text-sm font-medium text-[var(--birthday-text)] transition-colors hover:bg-[var(--birthday-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            สมัครรับอีเมล
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
