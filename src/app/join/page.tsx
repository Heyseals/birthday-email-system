import type { Metadata } from "next";
import { Cake } from "lucide-react";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "รับคำอวยพรวันเกิดทางอีเมล",
  description:
    "ลงทะเบียนชื่อ อีเมล และวันเดือนเกิด เพื่อรับคำอวยพรในวันเกิดของคุณ",
};

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[var(--birthday-bg)] text-[var(--birthday-text)] font-[family-name:var(--font-ibm-plex-thai)]">
      {/* แถบธงราว 4 สีแบบแบนเรียบ สูง 6px ด้านบนสุด */}
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--birthday-primary) 0 24px, var(--birthday-accent) 24px 48px, var(--birthday-soft) 48px 72px, var(--birthday-success) 72px 96px)",
        }}
      />

      <main className="mx-auto w-full max-w-[460px] px-5 pt-10 pb-14 sm:px-6 sm:pt-14">
        <header className="relative mb-8">
          {/* คอนเฟตติเรขาคณิตแบนๆ แบบไม่สมมาตร เหนือหัวข้อ */}
          <svg
            aria-hidden="true"
            viewBox="0 0 420 36"
            className="mb-3 hidden h-9 w-full sm:block"
            fill="none"
          >
            <circle cx="18" cy="14" r="3.5" fill="var(--birthday-accent)" />
            <polygon points="62,6 68,16 56,16" fill="var(--birthday-primary)" />
            <line
              x1="108"
              y1="22"
              x2="120"
              y2="14"
              stroke="var(--birthday-success)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="168" cy="9" r="2.5" fill="var(--birthday-soft)" />
            <polygon points="222,26 229,17 234,27" fill="var(--birthday-accent)" />
            <line
              x1="276"
              y1="8"
              x2="286"
              y2="18"
              stroke="var(--birthday-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="326" cy="24" r="3" fill="var(--birthday-success)" />
            <polygon points="366,10 374,14 365,20" fill="var(--birthday-soft)" />
            <circle cx="404" cy="14" r="3" fill="var(--birthday-primary)" />
          </svg>

          <div className="mb-3 flex items-center gap-2.5">
            <Cake
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0 text-[var(--birthday-primary)]"
            />
            <h1
              id="join-heading"
              className="text-2xl font-semibold tracking-tight text-[var(--birthday-text)]"
            >
              รับคำอวยพรวันเกิดทางอีเมล
            </h1>
          </div>

          <p className="text-sm leading-relaxed text-[var(--birthday-muted)]">
            เราจะส่งคำอวยพรให้คุณในวันเกิด กรุณายืนยันอีเมลก่อนเริ่มรับ
          </p>
        </header>

        <JoinForm />

        <footer className="mt-10 border-t border-[var(--birthday-border)] pt-5 text-xs text-[var(--birthday-muted)]">
          <p>ข้อมูลของคุณใช้เพื่อส่งคำอวยพรวันเกิดเท่านั้น และยกเลิกได้ทุกเมื่อ</p>
        </footer>
      </main>
    </div>
  );
}
