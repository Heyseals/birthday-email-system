"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  Eraser,
  Film,
  ImagePlus,
  Layers,
  MousePointer,
  PenTool,
  Shapes,
  Type,
} from "lucide-react";
import type { ShapeKind } from "@/types/card-editor";

export const SHAPE_GALLERY: Array<{ kind: ShapeKind; label: string }> = [
  { kind: "rect", label: "สี่เหลี่ยม" },
  { kind: "rounded-rect", label: "สี่เหลี่ยมมุมมน" },
  { kind: "circle", label: "วงกลม" },
  { kind: "oval", label: "วงรี" },
  { kind: "triangle", label: "สามเหลี่ยม" },
  { kind: "right-triangle", label: "สามเหลี่ยมมุมฉาก" },
  { kind: "diamond", label: "ข้าวหลามตัด" },
  { kind: "pentagon", label: "ห้าเหลี่ยม" },
  { kind: "hexagon", label: "หกเหลี่ยม" },
  { kind: "star-4", label: "ดาว 4 แฉก" },
  { kind: "star-5", label: "ดาว 5 แฉก" },
  { kind: "star-6", label: "ดาว 6 แฉก" },
  { kind: "heart", label: "หัวใจ" },
  { kind: "arrow-right", label: "ลูกศรขวา" },
  { kind: "arrow-left", label: "ลูกศรซ้าย" },
  { kind: "arrow-up", label: "ลูกศรขึ้น" },
  { kind: "arrow-down", label: "ลูกศรลง" },
  { kind: "speech-bubble", label: "ฟองคำพูด" },
  { kind: "cloud", label: "ก้อนเมฆ" },
  { kind: "lightning", label: "สายฟ้า" },
  { kind: "moon", label: "พระจันทร์" },
  { kind: "flower", label: "ดอกไม้" },
  { kind: "balloon", label: "ลูกโป่ง" },
  { kind: "ribbon", label: "ริบบิ้น" },
  { kind: "line", label: "เส้นตรง" },
  { kind: "plus", label: "เครื่องหมายบวก" },
  { kind: "cross", label: "กากบาท" },
  { kind: "ring", label: "วงแหวน" },
  { kind: "tag", label: "ป้ายแท็ก" },
  { kind: "banner", label: "แบนเนอร์" },
];

const QUICK_COLORS = [
  "#3B2A26",
  "#C8421F",
  "#1F7A6D",
  "#F2B632",
  "#FBE3DC",
  "#FFFFFF",
  "#FF595E",
  "#1982C4",
];

export function PaintRibbon({
  isDrawingMode,
  isEraser,
  primaryColor,
  secondaryColor,
  onSelectMode,
  onAddText,
  onUploadImage,
  onToggleGif,
  onAddShape,
  onSwapColors,
  onChangePrimaryColor,
  onOpenLayers,
}: {
  isDrawingMode: boolean;
  isEraser: boolean;
  primaryColor: string;
  secondaryColor: string;
  onSelectMode: (mode: "select" | "draw" | "eraser") => void;
  onAddText: () => void;
  onUploadImage: () => void;
  onToggleGif: () => void;
  onAddShape: (kind: ShapeKind) => void;
  onSwapColors: () => void;
  onChangePrimaryColor: (color: string) => void;
  onOpenLayers: () => void;
}) {
  const [showShapes, setShowShapes] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-2.5">
      <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
        {/* กลุ่ม: เครื่องมือ (Tools) */}
        <div className="flex shrink-0 flex-col justify-between border-r border-[var(--birthday-border)] pr-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectMode("select")}
              aria-label="เลือกและย้าย"
              title="เลือกและย้าย"
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${
                !isDrawingMode
                  ? "border-[var(--birthday-primary)] bg-[var(--birthday-soft)] text-[var(--birthday-primary)]"
                  : "border-[var(--birthday-border)] text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
              }`}
            >
              <MousePointer size={16} strokeWidth={1.5} />
              <span>เลือก</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode("draw")}
              aria-label="วาด (B)"
              title="วาด (B)"
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${
                isDrawingMode && !isEraser
                  ? "border-[var(--birthday-primary)] bg-[var(--birthday-primary)] text-[var(--birthday-on-primary)]"
                  : "border-[var(--birthday-border)] text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
              }`}
            >
              <PenTool size={16} strokeWidth={1.5} />
              <span>วาด</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode("eraser")}
              aria-label="ยางลบ (E)"
              title="ยางลบ (E)"
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium ${
                isDrawingMode && isEraser
                  ? "border-[var(--birthday-error)] bg-[var(--birthday-soft)] text-[var(--birthday-error)]"
                  : "border-[var(--birthday-border)] text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
              }`}
            >
              <Eraser size={16} strokeWidth={1.5} />
              <span>ยางลบ</span>
            </button>
            <button
              type="button"
              onClick={onAddText}
              aria-label="เพิ่มข้อความ"
              title="เพิ่มข้อความ"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-2.5 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <Type size={16} strokeWidth={1.5} />
              <span>ข้อความ</span>
            </button>
            <button
              type="button"
              onClick={onUploadImage}
              aria-label="เพิ่มรูปภาพ"
              title="เพิ่มรูปภาพ"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-2.5 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <ImagePlus size={16} strokeWidth={1.5} />
              <span>รูปภาพ</span>
            </button>
            <button
              type="button"
              onClick={onToggleGif}
              aria-label="เพิ่ม GIF"
              title="เพิ่ม GIF"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-2.5 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <Film size={16} strokeWidth={1.5} />
              <span>GIF</span>
            </button>
          </div>
          <span className="mt-1 text-center text-[10px] font-medium text-[var(--birthday-muted)]">
            เครื่องมือ (Tools)
          </span>
        </div>

        {/* กลุ่ม: รูปทรง (Shapes) */}
        <div className="flex shrink-0 flex-col justify-between border-r border-[var(--birthday-border)] pr-3">
          <button
            type="button"
            onClick={() => setShowShapes((v) => !v)}
            aria-expanded={showShapes}
            aria-label="แกลเลอรีรูปทรง 30 แบบ"
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 text-xs font-medium ${
              showShapes
                ? "border-[var(--birthday-primary)] bg-[var(--birthday-soft)] text-[var(--birthday-primary)]"
                : "border-[var(--birthday-border)] text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            }`}
          >
            <Shapes size={16} strokeWidth={1.5} />
            <span>รูปทรง (30)</span>
          </button>
          <span className="mt-1 text-center text-[10px] font-medium text-[var(--birthday-muted)]">
            รูปทรง (Shapes)
          </span>
        </div>

        {/* กลุ่ม: สี (Colors) */}
        <div className="flex shrink-0 flex-col justify-between border-r border-[var(--birthday-border)] pr-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span
                title={`สีหลัก: ${primaryColor}`}
                className="h-7 w-7 rounded-md border border-[var(--birthday-border)]"
                style={{ backgroundColor: primaryColor }}
              />
              <button
                type="button"
                onClick={onSwapColors}
                aria-label="สลับสีหลักและสีรอง"
                title="สลับสีหลักและสีรอง"
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--birthday-border)] text-[var(--birthday-muted)] hover:bg-[var(--birthday-bg)]"
              >
                <ArrowLeftRight size={12} />
              </button>
              <span
                title={`สีรอง: ${secondaryColor}`}
                className="h-7 w-7 rounded-md border border-[var(--birthday-border)]"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
            <div className="flex items-center gap-1">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`เลือกสี ${c}`}
                  onClick={() => onChangePrimaryColor(c)}
                  className="h-6 w-6 rounded-full border border-[var(--birthday-border)]"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <span className="mt-1 text-center text-[10px] font-medium text-[var(--birthday-muted)]">
            สี (Colors)
          </span>
        </div>

        {/* กลุ่ม: เลเยอร์ (Layers) */}
        <div className="flex shrink-0 flex-col justify-between">
          <button
            type="button"
            onClick={onOpenLayers}
            aria-label="เปิดแผงเลเยอร์"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
          >
            <Layers size={16} strokeWidth={1.5} />
            <span>เลเยอร์</span>
          </button>
          <span className="mt-1 text-center text-[10px] font-medium text-[var(--birthday-muted)]">
            เลเยอร์ (Layers)
          </span>
        </div>
      </div>

      {/* แกลเลอรีรูปทรง 30 แบบ */}
      {showShapes && (
        <div className="mt-2.5 border-t border-[var(--birthday-border)] pt-2.5">
          <div className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-6 lg:grid-cols-10">
            {SHAPE_GALLERY.map((item) => (
              <button
                key={item.kind}
                type="button"
                onClick={() => {
                  onAddShape(item.kind);
                  setShowShapes(false);
                }}
                className="min-h-[40px] rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-bg)]/60 px-2 py-1.5 text-center text-[11px] font-medium text-[var(--birthday-text)] hover:border-[var(--birthday-primary)] hover:bg-[var(--birthday-soft)]"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
