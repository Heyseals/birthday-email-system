import type { Metadata } from "next";
import Link from "next/link";
import { Cake, ChevronDown } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

const TITLE = "รับคำอวยพรวันเกิดทางอีเมล | ระบบอวยพรวันเกิดอัตโนมัติ";
const DESCRIPTION =
  "ลงทะเบียนรับอีเมลอวยพรในเช้าวันเกิดของคุณ เวลา 08:00 น. เก็บเฉพาะชื่อ อีเมล และวัน/เดือนเกิด ไม่เก็บปีเกิด";

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

const STEPS = [
  {
    num: "01",
    text: "กรอกชื่อที่อยากให้เรียก อีเมล และวัน/เดือนเกิด (ไม่เก็บปีเกิด)",
  },
  {
    num: "02",
    text: "ยืนยันอีเมลผ่านลิงก์ที่ส่งไปให้ เพื่อป้องกันการแอบอ้าง",
  },
  {
    num: "03",
    text: "รับอีเมลอวยพรทุกเช้าวันเกิด เวลา 08:00 น.",
  },
];

const FAQS = [
  {
    q: "ต้องให้ข้อมูลอะไรบ้าง",
    a: "ใช้เพียงชื่อที่อยากให้เรียก อีเมล และวัน/เดือนเกิดเท่านั้น ระบบไม่เก็บปีเกิด",
  },
  {
    q: "ทำไมต้องยืนยันอีเมล",
    a: "เพื่อให้แน่ใจว่าคุณเป็นเจ้าของอีเมลจริง และป้องกันไม่ให้ผู้อื่นนำอีเมลของคุณมาสมัครแทน",
  },
  {
    q: "ไม่ได้รับอีเมลยืนยัน ต้องทำอย่างไร",
    a: "กรุณาตรวจสอบในโฟลเดอร์สแปมหรือจดหมายขยะ รอสักครู่ แล้วลองสมัครใหม่อีกครั้ง",
  },
  {
    q: "ยกเลิกรับอีเมลได้อย่างไร",
    a: "สามารถกดลิงก์ยกเลิกการรับอีเมลที่อยู่ท้ายอีเมลอวยพรทุกฉบับได้ทันที",
  },
  {
    q: "แก้ไขหรือลบข้อมูลได้ไหม",
    a: "ได้ครับ ในระหว่างที่หน้าจัดการข้อมูลด้วยตนเองกำลังพัฒนา สามารถติดต่อผู้ดูแลระบบเพื่อขอแก้ไขหรือลบข้อมูลได้",
  },
];

export default function HomePage() {
  return (
    <PublicShell maxWidth="reading">
      {/* 1.1 ส่วนหัว */}
      <section className="pb-10">
        {/* คอนเฟตติเรขาคณิตแบนๆ เฉพาะส่วนหัวหน้าแรก */}
        <svg
          aria-hidden="true"
          viewBox="0 0 560 36"
          className="mb-4 hidden h-9 w-full sm:block"
          fill="none"
        >
          <circle cx="16" cy="14" r="3.5" fill="var(--birthday-accent)" />
          <polygon points="72,6 79,17 65,17" fill="var(--birthday-primary)" />
          <line
            x1="138"
            y1="22"
            x2="152"
            y2="13"
            stroke="var(--birthday-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="220" cy="10" r="2.5" fill="var(--birthday-soft)" />
          <polygon points="292,26 300,16 306,27" fill="var(--birthday-accent)" />
          <line
            x1="364"
            y1="8"
            x2="375"
            y2="18"
            stroke="var(--birthday-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="436" cy="24" r="3" fill="var(--birthday-success)" />
          <polygon points="494,10 503,14 493,20" fill="var(--birthday-soft)" />
          <circle cx="542" cy="14" r="3" fill="var(--birthday-primary)" />
        </svg>

        <div className="mb-3 flex items-center gap-2.5">
          <Cake
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className="shrink-0 text-[var(--birthday-primary)]"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--birthday-text)] sm:text-3xl">
            รับคำอวยพรวันเกิดทางอีเมล
          </h1>
        </div>

        <p className="mb-6 max-w-[54ch] text-base leading-relaxed text-[var(--birthday-muted)]">
          ลงทะเบียนวันและเดือนเกิดไว้ แล้วรับอีเมลอวยพรอบอุ่นส่งตรงถึงกล่องจดหมายของคุณในเช้าวันเกิดเวลา 08:00 น.
        </p>

        <div className="space-y-2.5">
          <Link
            href="/join"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[var(--birthday-primary)] px-6 py-3 text-base font-medium text-[var(--birthday-on-primary)] transition-colors hover:bg-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            สมัครรับอีเมล
          </Link>
          <p className="text-sm text-[var(--birthday-muted)]">
            เก็บเฉพาะชื่อ อีเมล และวัน/เดือนเกิด (ไม่เก็บปี) ยกเลิกได้ทุกเมื่อ
          </p>
        </div>
      </section>

      {/* 1.2 วิธีการทำงาน 3 ขั้นตอน */}
      <section className="border-t border-[var(--birthday-border)] py-10">
        <h2 className="mb-6 text-lg font-semibold text-[var(--birthday-text)]">
          ขั้นตอนการใช้งาน
        </h2>
        <ol className="space-y-5">
          {STEPS.map((step) => (
            <li key={step.num} className="flex items-baseline gap-4">
              <span
                aria-hidden="true"
                className="w-8 shrink-0 text-xl font-semibold tabular-nums text-[var(--birthday-primary)]"
              >
                {step.num}
              </span>
              <span className="text-base leading-relaxed text-[var(--birthday-text)]">
                {step.text}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 1.3 ตัวอย่างอีเมลที่จะได้รับ */}
      <section className="border-t border-[var(--birthday-border)] py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            ตัวอย่างอีเมลที่จะได้รับ
          </h2>
          <span className="rounded bg-[var(--birthday-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-primary)]">
            ตัวอย่าง
          </span>
        </div>

        <div
          aria-label="ตัวอย่างเนื้อหาอีเมลอวยพรวันเกิด"
          className="overflow-hidden rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)]"
        >
          <div className="border-b border-[var(--birthday-border)] bg-[var(--birthday-bg)]/70 px-5 py-3 text-sm">
            <p className="text-[var(--birthday-muted)]">
              หัวข้อ:{" "}
              <span className="font-medium text-[var(--birthday-text)]">
                สุขสันต์วันเกิดคุณ สมชาย
              </span>
            </p>
          </div>
          <div className="space-y-3 px-5 py-5 text-sm leading-relaxed text-[var(--birthday-text)]">
            <p>
              สวัสดีคุณ <strong>สมชาย</strong>,
            </p>
            <p className="text-[var(--birthday-muted)]">
              เนื่องในโอกาสวันคล้ายวันเกิดของคุณ ขอส่งความปรารถนาดีให้คุณมีสุขภาพแข็งแรง มีความสุข สมหวังในทุกสิ่งที่ตั้งใจ และพบเจอแต่สิ่งดีๆ ตลอดทั้งปีครับ/ค่ะ
            </p>
            <p className="text-[var(--birthday-muted)]">
              ขอบคุณที่ไว้วางใจและอยู่เคียงข้างกันเสมอมา
            </p>
            <p className="pt-1 font-medium text-[var(--birthday-text)]">
              ด้วยความปรารถนาดี,
              <br />
              ทีมงานระบบอวยพรวันเกิดอัตโนมัติ
            </p>
          </div>
          <div className="border-t border-[var(--birthday-border)] bg-[var(--birthday-bg)]/50 px-5 py-3 text-xs text-[var(--birthday-muted)]">
            <p>คุณได้รับอีเมลนี้เนื่องจากได้ให้ความยินยอมรับข่าวสารและคำอวยพรวันเกิด</p>
            <p className="mt-1 underline">ยกเลิกการรับอีเมลอวยพร (Unsubscribe)</p>
          </div>
        </div>
      </section>

      {/* 1.4 คำถามที่พบบ่อย (FAQ) */}
      <section className="border-t border-[var(--birthday-border)] py-10">
        <h2 className="mb-5 text-lg font-semibold text-[var(--birthday-text)]">
          คำถามที่พบบ่อย
        </h2>
        <div className="divide-y divide-[var(--birthday-border)] border-y border-[var(--birthday-border)]">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-2.5 text-base font-medium text-[var(--birthday-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)] [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="shrink-0 text-[var(--birthday-muted)] transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="pb-3.5 text-sm leading-relaxed text-[var(--birthday-muted)]">
                {item.a}
              </p>
            </details>
          ))}

          <details className="group py-1">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 py-2.5 text-base font-medium text-[var(--birthday-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)] [&::-webkit-details-marker]:hidden">
              <span>ข้อมูลถูกใช้ทำอะไร</span>
              <ChevronDown
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
                className="shrink-0 text-[var(--birthday-muted)] transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pb-3.5 text-sm leading-relaxed text-[var(--birthday-muted)]">
              ใช้เพื่อส่งอีเมลยืนยันการสมัครและส่งอีเมลอวยพรวันเกิดเท่านั้น อ่านรายละเอียดเพิ่มเติมได้ที่{" "}
              <Link
                href="/privacy"
                className="font-medium text-[var(--birthday-primary)] underline underline-offset-4 hover:text-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </details>
        </div>
      </section>

      {/* 1.6 ส่วนท้ายซ้ำปุ่มสมัคร */}
      <section className="border-t border-[var(--birthday-border)] pt-10">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
              พร้อมรับคำอวยพรในวันเกิดของคุณหรือยัง
            </h2>
            <p className="mt-1 text-sm text-[var(--birthday-muted)]">
              ใช้เวลาลงทะเบียนไม่ถึงหนึ่งนาที
            </p>
          </div>
          <Link
            href="/join"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-lg bg-[var(--birthday-primary)] px-6 py-3 text-base font-medium text-[var(--birthday-on-primary)] transition-colors hover:bg-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            สมัครรับอีเมล
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
