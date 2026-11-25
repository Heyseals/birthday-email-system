"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PublicShell maxWidth="reading">
      <section className="py-8">
        <div className="mb-4 flex items-center gap-2.5">
          <AlertTriangle
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className="shrink-0 text-[var(--birthday-error)]"
          />
          <h1 className="text-2xl font-semibold text-[var(--birthday-text)]">
            เกิดข้อผิดพลาดบางอย่าง
          </h1>
        </div>

        <p className="mb-8 text-base leading-relaxed text-[var(--birthday-muted)]">
          เกิดข้อผิดพลาดบางอย่าง ลองอีกครั้งในอีกสักครู่
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--birthday-primary)] px-5 py-2.5 text-sm font-medium text-[var(--birthday-on-primary)] transition-colors hover:bg-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            ลองใหม่
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-5 py-2.5 text-sm font-medium text-[var(--birthday-text)] transition-colors hover:bg-[var(--birthday-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
