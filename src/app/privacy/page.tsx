import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function PrivacyPage() {
  return (
    <PublicShell maxWidth="reading">
      <article className="space-y-6 rounded-2xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-6 shadow-sm sm:p-8">
        <header className="space-y-2 border-b border-[var(--birthday-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--birthday-text)]">
            นโยบายความเป็นส่วนตัว (PDPA)
          </h1>
          <p className="text-sm text-[var(--birthday-muted)]">
            อัปเดตล่าสุด: พฤศจิกายน 2026
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            1. ข้อมูลส่วนบุคคลที่เราจัดเก็บ
          </h2>
          <p className="text-sm leading-relaxed text-[var(--birthday-muted)]">
            ระบบจัดเก็บเฉพาะข้อมูลที่จำเป็นต่อการจัดส่งคำอวยพรวันเกิดเท่านั้น ได้แก่:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--birthday-muted)]">
            <li>ชื่อที่อยากให้เรียก (Full Name / Display Name)</li>
            <li>อีเมล (Email Address)</li>
            <li>
              <strong>วันและเดือนเกิด</strong> (ระบบ<strong>ไม่เก็บปีเกิด</strong>เพื่อลดความเสี่ยงด้านข้อมูลส่วนบุคคล)
            </li>
            <li>LINE User ID (เฉพาะกรณีที่ผู้ใช้กรอกเพิ่มเติมเพื่อรับการแจ้งเตือนผ่าน LINE)</li>
            <li>การ์ดอวยพรและข้อความอวยพรที่ผู้ใช้ออกแบบหรือระบุไว้</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            2. วัตถุประสงค์ของการใช้ข้อมูล
          </h2>
          <p className="text-sm leading-relaxed text-[var(--birthday-muted)]">
            ข้อมูลของคุณจะถูกใช้เพื่อส่งอีเมลยืนยันความยินยอม (Double Opt-in),
            ส่งคำอวยพรวันเกิดในวันเกิดของคุณ, แจ้งเตือนผู้ส่งล่วงหน้า 3 วัน (เฉพาะรายการที่ผูกบัญชี),
            และส่งข้อความผ่าน LINE ตามที่คุณเลือกเท่านั้น เราไม่มีการนำข้อมูลไปขายหรือส่งต่อให้บุคคลที่สามเพื่อการตลาด
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            3. ระยะเวลาเก็บรักษาข้อมูล
          </h2>
          <p className="text-sm leading-relaxed text-[var(--birthday-muted)]">
            ระบบจะเก็บรักษาข้อมูลของคุณไว้ตราบเท่าที่บัญชีหรือรายการอวยพรยังเปิดใช้งานอยู่
            และจะลบข้อมูลทันทีเมื่อคุณใช้สิทธิ์ขอลบข้อมูลทั้งหมด
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            4. สิทธิ์ของเจ้าของข้อมูล (PDPA Rights)
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--birthday-muted)]">
            <li>
              <strong>สิทธิ์ในการยกเลิกความยินยอม:</strong> คุณสามารถกดลิงก์ยกเลิกการรับอีเมล (
              <code>/unsubscribe</code>) ท้ายอีเมลทุกฉบับได้ทันที
            </li>
            <li>
              <strong>สิทธิ์ในการเข้าถึงและขอรับสำเนาข้อมูล:</strong> สามารถดาวน์โหลดข้อมูลทั้งหมดของคุณเป็นไฟล์ JSON ได้ที่หน้า{" "}
              <Link href="/dashboard" className="text-[var(--birthday-primary)] underline">
                แดชบอร์ด (/dashboard)
              </Link>
            </li>
            <li>
              <strong>สิทธิ์ในการลบข้อมูลถาวร:</strong> สามารถกดปุ่ม &ldquo;ลบข้อมูลทั้งหมดของฉัน&rdquo; ในหน้า{" "}
              <Link href="/dashboard" className="text-[var(--birthday-primary)] underline">
                แดชบอร์ด (/dashboard)
              </Link>{" "}
              เพื่อลบข้อมูลลูกค้า การ์ด รูปภาพ และบัญชีผู้ใช้ออกจากระบบอย่างถาวร
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--birthday-text)]">
            5. ช่องทางติดต่อ
          </h2>
          <p className="text-sm leading-relaxed text-[var(--birthday-muted)]">
            หากมีข้อสงสัยเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล สามารถติดต่อผู้ดูแลระบบผ่านอีเมลผู้ส่งที่ปรากฏในอีเมลยืนยันของคุณได้ตลอดเวลา
          </p>
        </section>
      </article>
    </PublicShell>
  );
}
