import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { PublicShell } from "@/components/public-shell";

const CardEditorClient = dynamic(
  () =>
    import("@/components/card-editor/card-editor-client").then(
      (mod) => mod.CardEditorClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-8 text-center text-sm text-[var(--birthday-muted)]">
        กำลังโหลดตัวแก้ไขการ์ดอวยพร...
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "สร้างการ์ดอวยพรวันเกิด | ระบบอวยพรวันเกิดอัตโนมัติ",
  description:
    "ออกแบบการ์ดอวยพรวันเกิดด้วยตัวเอง เพิ่มข้อความ รูปภาพ และสีพื้นหลัง",
};

export default function CreateCardPage() {
  return (
    <PublicShell maxWidth="wide">
      <div className="mb-6">
        <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold text-[var(--birthday-text)]">
          สร้างการ์ดอวยพรวันเกิด
        </h1>
        <p className="mt-1 text-sm text-[var(--birthday-muted)]">
          เลือกเทมเพลตหรือออกแบบใหม่ตามต้องการ ระบบจะบันทึกฉบับร่างให้อัตโนมัติ
        </p>
      </div>
      <CardEditorClient />
    </PublicShell>
  );
}
