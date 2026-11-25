"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-[#FFF8EE] text-[#3B2A26] antialiased">
        <div
          aria-hidden="true"
          className="h-1.5 w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #C8421F 0 24px, #F2B632 24px 48px, #FBE3DC 48px 72px, #1F7A6D 72px 96px)",
          }}
        />
        <main className="mx-auto max-w-[640px] px-5 py-16 sm:px-6">
          <div className="mb-4 flex items-center gap-2.5">
            <AlertTriangle
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0 text-[#B42318]"
            />
            <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาดบางอย่าง</h1>
          </div>
          <p className="mb-8 text-base leading-relaxed text-[#6B5750]">
            เกิดข้อผิดพลาดบางอย่าง ลองอีกครั้งในอีกสักครู่
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#C8421F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#A93517]"
            >
              ลองใหม่
            </button>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8D9C8] bg-white px-5 py-2.5 text-sm font-medium text-[#3B2A26] hover:bg-[#FBE3DC]"
            >
              กลับหน้าแรก
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
