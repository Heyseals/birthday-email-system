"use client";

import dynamic from "next/dynamic";

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

export function CardEditorLoader() {
  return <CardEditorClient />;
}
