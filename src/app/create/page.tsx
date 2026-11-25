import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { CardEditorLoader } from "@/components/card-editor/card-editor-loader";

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
      <CardEditorLoader />
    </PublicShell>
  );
}
