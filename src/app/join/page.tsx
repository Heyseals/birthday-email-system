import type { Metadata } from "next";
import { Cake } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { JoinForm } from "./join-form";

const TITLE = "ลงทะเบียนวันเกิด | ระบบอวยพรวันเกิดอัตโนมัติ";
const DESCRIPTION =
  "ลงทะเบียนชื่อ อีเมล และวันเดือนเกิด เพื่อรับคำอวยพรในวันเกิดของคุณ";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "th_TH",
    type: "website",
  },
};

export default function JoinPage() {
  return (
    <PublicShell maxWidth="narrow" showJoinLinkInHeader={false}>
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
    </PublicShell>
  );
}
