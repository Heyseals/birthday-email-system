import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

const TITLE = "นโยบายความเป็นส่วนตัว | ระบบอวยพรวันเกิดอัตโนมัติ";
const DESCRIPTION =
  "รายละเอียดการจัดเก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลสำหรับบริการส่งอีเมลอวยพรวันเกิดอัตโนมัติ";

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

const SECTIONS = [
  { id: "controller", label: "1. ผู้ให้บริการและผู้ควบคุมข้อมูล" },
  { id: "data-collected", label: "2. ข้อมูลส่วนบุคคลที่จัดเก็บ" },
  { id: "purpose", label: "3. วัตถุประสงค์ในการใช้ข้อมูล" },
  { id: "legal-basis", label: "4. ฐานทางกฎหมายและความยินยอม" },
  { id: "processors", label: "5. ผู้ประมวลผลข้อมูลที่เกี่ยวข้อง" },
  { id: "retention", label: "6. ระยะเวลาการจัดเก็บข้อมูล" },
  { id: "rights", label: "7. สิทธิของเจ้าของข้อมูล" },
  { id: "security", label: "8. การรักษาความปลอดภัย" },
  { id: "changes", label: "9. การเปลี่ยนแปลงนโยบาย" },
];

export default function PrivacyPage() {
  return (
    <PublicShell maxWidth="reading">
      <article className="max-w-[65ch] space-y-8">
        <header className="space-y-3 border-b border-[var(--birthday-border)] pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--birthday-text)] sm:text-3xl">
            นโยบายความเป็นส่วนตัว
          </h1>
          <p className="text-sm text-[var(--birthday-muted)]">
            อัปเดตล่าสุด: 25 พฤศจิกายน 2569
          </p>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            เอกสารนี้จัดทำขึ้นเพื่ออธิบายอย่างตรงไปตรงมาว่าระบบอวยพรวันเกิดอัตโนมัติเก็บข้อมูลอะไรบ้าง ใช้เพื่ออะไร และคุณมีสิทธิจัดการข้อมูลของคุณอย่างไร
          </p>
        </header>

        {/* สารบัญลิงก์ยึดแบบข้อความธรรมดา */}
        <nav
          aria-label="สารบัญนโยบายความเป็นส่วนตัว"
          className="border-b border-[var(--birthday-border)] pb-6"
        >
          <p className="mb-2.5 text-sm font-semibold text-[var(--birthday-text)]">
            หัวข้อในหน้านี้
          </p>
          <ul className="space-y-1.5 text-sm">
            {SECTIONS.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className="inline-flex min-h-[32px] items-center text-[var(--birthday-primary)] underline-offset-4 hover:text-[var(--birthday-primary-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
                >
                  {sec.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section id="controller" className="space-y-2 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            1. ผู้ให้บริการและผู้ควบคุมข้อมูล
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            บริการนี้ดูแลโดย{" "}
            <span className="font-medium text-[var(--birthday-text)]">
              [ต้องกรอก: ชื่อผู้ดูแลหรือองค์กรผู้ให้บริการ]
            </span>
          </p>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            ช่องทางติดต่อสำหรับสอบถามหรือใช้สิทธิด้านข้อมูลส่วนบุคคล:{" "}
            <span className="font-medium text-[var(--birthday-text)]">
              [ต้องกรอก: อีเมลติดต่อผู้ดูแล]
            </span>
          </p>
        </section>

        <section id="data-collected" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            2. ข้อมูลส่วนบุคคลที่จัดเก็บ
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            ระบบจัดเก็บเฉพาะข้อมูลที่จำเป็นต่อการส่งคำอวยพรวันเกิด ได้แก่:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-[var(--birthday-muted)]">
            <li>ชื่อที่อยากให้เรียก</li>
            <li>ที่อยู่อีเมล</li>
            <li>เดือนและวันที่เกิด (ไม่จัดเก็บปีเกิด)</li>
            <li>
              สถานะความยินยอมและเวลาที่ให้ความยินยอม รวมถึงสถานะการยืนยันอีเมล
              (pending / confirmed) และสถานะการยกเลิกรับอีเมล
            </li>
            <li>
              โทเคนแบบสุ่มสำหรับยืนยันอีเมล (มีอายุ 24 ชั่วโมง) โทเคนสำหรับยกเลิกรับอีเมล
              และโทเคนสำหรับจัดการข้อมูล
            </li>
            <li>
              ประวัติการส่งอีเมล (อีเมลปลายทาง ปีที่ส่ง วันเวลาที่ส่ง สถานะการส่ง
              และรหัสอ้างอิงจากผู้ให้บริการส่งอีเมล)
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-[var(--birthday-muted)]">
            ข้อมูลทางเทคนิคชั่วคราว: เมื่อมีการส่งฟอร์มสมัคร ระบบจะอ่านหมายเลข IP
            จากคำขอเพื่อจำกัดความถี่ในการส่งคำขอป้องกันสแปม (สูงสุด 5 ครั้งต่อ 15 นาที)
            โดยเก็บไว้ในหน่วยความจำชั่วคราวของเซิร์ฟเวอร์เท่านั้น ไม่ได้บันทึกลงฐานข้อมูล
            และข้อมูลดังกล่าวจะหมดอายุภายใน 15 นาที
          </p>
        </section>

        <section id="purpose" className="space-y-2 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            3. วัตถุประสงค์ในการใช้ข้อมูล
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            เราใช้ข้อมูลของคุณเพื่อส่งอีเมลยืนยันตัวตนเมื่อสมัครใช้งาน และส่งอีเมลอวยพรวันเกิดปีละ 1 ครั้งเท่านั้น
            ไม่มีการนำข้อมูลไปขาย แลกเปลี่ยน หรือส่งต่อเพื่อวัตถุประสงค์ทางการตลาดอื่น
          </p>
        </section>

        <section id="legal-basis" className="space-y-2 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            4. ฐานทางกฎหมายและความยินยอม
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            ระบบประมวลผลข้อมูลโดยอาศัยความยินยอมที่คุณกดเลือกด้วยตนเองผ่านช่องทำเครื่องหมายยินยอมในหน้าสมัครสมาชิก
            (ไม่ได้ติ๊กไว้ล่วงหน้า) พร้อมการยืนยันอีเมลซ้ำ (Double Opt-in)
            คุณสามารถถอนความยินยอมได้ทุกเมื่อ
          </p>
        </section>

        <section id="processors" className="space-y-3 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            5. ผู้ประมวลผลข้อมูลที่เกี่ยวข้อง
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            บริการนี้ใช้โครงสร้างพื้นฐานจากผู้ให้บริการภายนอกเท่าที่จำเป็น ดังนี้:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-[var(--birthday-muted)]">
            <li>
              <strong className="font-medium text-[var(--birthday-text)]">Supabase</strong>{" "}
              — ใช้จัดเก็บฐานข้อมูลรายชื่อและประวัติการส่งอีเมล
            </li>
            <li>
              <strong className="font-medium text-[var(--birthday-text)]">Resend</strong>{" "}
              — ใช้สำหรับส่งอีเมลยืนยันตัวตนและอีเมลอวยพรวันเกิด
            </li>
            <li>
              <strong className="font-medium text-[var(--birthday-text)]">Vercel</strong>{" "}
              — ใช้โฮสต์หน้าเว็บและรันงานส่งอีเมลอัตโนมัติรายวัน
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-[var(--birthday-muted)]">
            ที่ตั้งเซิร์ฟเวอร์และการโอนข้อมูลข้ามประเทศ:{" "}
            <span className="font-medium text-[var(--birthday-text)]">
              [ต้องกรอก: ระบุภูมิภาคเซิร์ฟเวอร์ที่เลือกใช้งานจริง เช่น สิงคโปร์ / ซิดนีย์ / สหรัฐอเมริกา]
            </span>
          </p>
        </section>

        <section id="retention" className="space-y-2 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            6. ระยะเวลาการจัดเก็บข้อมูล
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            <span className="font-medium text-[var(--birthday-text)]">
              [ต้องกรอก: ระยะเวลาการจัดเก็บข้อมูลที่ชัดเจน]
            </span>{" "}
            ทั้งนี้ ปัจจุบันเมื่อผู้ใช้กดลิงก์ยกเลิกรับอีเมล ระบบจะบันทึกสถานะเป็นยกเลิกเพื่อหยุดส่งอีเมล
            แต่ยังไม่ได้ลบแถวข้อมูลออกจากฐานข้อมูลโดยอัตโนมัติ หากต้องการให้ลบข้อมูลถาวรสามารถแจ้งผู้ดูแลระบบได้
          </p>
        </section>

        <section id="rights" className="space-y-2 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            7. สิทธิของเจ้าของข้อมูล
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            คุณมีสิทธิขอเข้าถึง ขอแก้ไข ขอลบ ถอนความยินยอม หรือคัดค้านการประมวลผลข้อมูลส่วนบุคคลของคุณได้
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-base leading-relaxed text-[var(--birthday-muted)]">
            <li>
              ถอนความยินยอม / ยกเลิกการรับอีเมล: กดลิงก์ยกเลิกท้ายอีเมลอวยพรได้ทันที
            </li>
            <li>
              ขอเข้าถึง แก้ไข หรือลบข้อมูล: ในระหว่างที่หน้าจัดการข้อมูลด้วยตนเองกำลังพัฒนา
              กรุณาติดต่อผู้ดูแลระบบผ่านช่องทางในข้อ 1
            </li>
          </ul>
        </section>

        <section id="security" className="space-y-2 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            8. การรักษาความปลอดภัย
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            ข้อมูลทั้งหมดถูกจัดเก็บในฐานข้อมูลที่เปิดใช้การจำกัดสิทธิ์การเข้าถึงระดับแถว (Row Level Security)
            ไม่อนุญาตให้ผู้ใช้ทั่วไปอ่านหรือเขียนตารางข้อมูลโดยตรง
            การบันทึกข้อมูลดำเนินการผ่านฝั่งเซิร์ฟเวอร์เท่านั้น และลิงก์ยืนยันอีเมลมีวันหมดอายุภายใน 24 ชั่วโมง
          </p>
        </section>

        <section id="changes" className="space-y-2 scroll-mt-6">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            9. การเปลี่ยนแปลงนโยบาย
          </h2>
          <p className="text-base leading-relaxed text-[var(--birthday-muted)]">
            หากมีการปรับปรุงนโยบายนี้จะแสดงวันที่อัปเดตล่าสุดไว้ที่ด้านบนของหน้านี้
          </p>
        </section>

        <div className="border-t border-[var(--birthday-border)] pt-6 text-sm text-[var(--birthday-muted)]">
          <p>นโยบายนี้ใช้กับบริการนี้เท่านั้น</p>
          <p className="mt-3">
            <Link
              href="/join"
              className="font-medium text-[var(--birthday-primary)] underline underline-offset-4 hover:text-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              กลับไปหน้าลงทะเบียนรับอีเมล
            </Link>
          </p>
        </div>
      </article>
    </PublicShell>
  );
}
