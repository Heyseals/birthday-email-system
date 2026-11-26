"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Lock,
  PenTool,
  Shapes,
  Sparkles,
  Type,
  Unlock,
} from "lucide-react";
import type { CardElement } from "@/types/card-editor";

function getDefaultName(el: CardElement, index: number): string {
  if (el.name) return el.name;
  switch (el.type) {
    case "text":
      return el.text.slice(0, 18) || `ข้อความ ${index + 1}`;
    case "image":
      return `รูปภาพ ${index + 1}`;
    case "gif":
      return el.alt || `GIF ${index + 1}`;
    case "shape":
      return `รูปทรง ${index + 1}`;
    case "sticker":
      return el.label || `สติกเกอร์ ${index + 1}`;
    case "stroke":
      return el.tool === "eraser" ? `ยางลบ ${index + 1}` : `เส้นวาด ${index + 1}`;
  }
}

function LayerIcon({ type }: { type: CardElement["type"] }) {
  switch (type) {
    case "text":
      return <Type size={16} strokeWidth={1.5} aria-hidden="true" />;
    case "image":
      return <ImageIcon size={16} strokeWidth={1.5} aria-hidden="true" />;
    case "gif":
      return <Film size={16} strokeWidth={1.5} aria-hidden="true" />;
    case "shape":
      return <Shapes size={16} strokeWidth={1.5} aria-hidden="true" />;
    case "sticker":
      return <Sparkles size={16} strokeWidth={1.5} aria-hidden="true" />;
    case "stroke":
      return <PenTool size={16} strokeWidth={1.5} aria-hidden="true" />;
  }
}

export function LayersPanel({
  elements,
  selectedId,
  onSelect,
  onReorder,
  onUpdateElement,
}: {
  elements: CardElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdateElement: (id: string, attrs: Partial<CardElement>) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // แสดงจากบนสุด (ท้าย array) ลงล่างสุด (ต้น array)
  const reversed = elements.map((el, idx) => ({ el, idx })).reverse();

  const handleMove = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= elements.length) return;
    onReorder(idx, targetIdx);
    const name = getDefaultName(elements[idx], idx);
    setAnnouncement(
      `ย้าย '${name}' ไปชั้นที่ ${elements.length - targetIdx} จาก ${elements.length}`
    );
  };

  return (
    <div className="space-y-2">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {reversed.length === 0 ? (
        <p className="text-sm text-[var(--birthday-muted)]">
          ยังไม่มีองค์ประกอบในการ์ด
        </p>
      ) : (
        <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
          {reversed.map(({ el, idx }) => {
            const isSelected = el.id === selectedId;
            const isVisible = el.visible !== false;
            const isLocked = Boolean(el.locked);
            const displayName = getDefaultName(el, idx);

            return (
              <li
                key={el.id}
                draggable
                onDragStart={() => setDraggedIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null && draggedIndex !== idx) {
                    onReorder(draggedIndex, idx);
                  }
                  setDraggedIndex(null);
                }}
                className={`flex min-h-[44px] items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? "border-[var(--birthday-primary)] bg-[var(--birthday-soft)]"
                    : "border-[var(--birthday-border)] bg-[var(--birthday-surface)] hover:bg-[var(--birthday-bg)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(el.id)}
                  onDoubleClick={() => {
                    setEditingId(el.id);
                    setDraftName(displayName);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="shrink-0 text-[var(--birthday-muted)]">
                    <LayerIcon type={el.type} />
                  </span>
                  {editingId === el.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={() => {
                        onUpdateElement(el.id, {
                          name: draftName.trim() || displayName,
                        });
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onUpdateElement(el.id, {
                            name: draftName.trim() || displayName,
                          });
                          setEditingId(null);
                        }
                      }}
                      className="w-full rounded border border-[var(--birthday-primary)] bg-white px-1.5 py-0.5 text-xs"
                    />
                  ) : (
                    <span
                      className={`truncate font-medium ${
                        isVisible
                          ? "text-[var(--birthday-text)]"
                          : "text-[var(--birthday-muted)] line-through"
                      }`}
                    >
                      {displayName}
                    </span>
                  )}
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="ขยับขึ้นหนึ่งชั้น"
                    disabled={idx === elements.length - 1}
                    onClick={() => handleMove(idx, "up")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--birthday-muted)] hover:bg-[var(--birthday-bg)] disabled:opacity-30"
                  >
                    <ArrowUp size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="ขยับลงหนึ่งชั้น"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, "down")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--birthday-muted)] hover:bg-[var(--birthday-bg)] disabled:opacity-30"
                  >
                    <ArrowDown size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label={isVisible ? "ซ่อนเลเยอร์" : "แสดงเลเยอร์"}
                    onClick={() =>
                      onUpdateElement(el.id, { visible: !isVisible })
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--birthday-muted)] hover:bg-[var(--birthday-bg)]"
                  >
                    {isVisible ? (
                      <Eye size={14} strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={isLocked ? "ปลดล็อกเลเยอร์" : "ล็อกเลเยอร์"}
                    onClick={() =>
                      onUpdateElement(el.id, { locked: !isLocked })
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--birthday-muted)] hover:bg-[var(--birthday-bg)]"
                  >
                    {isLocked ? (
                      <Lock size={14} strokeWidth={1.5} />
                    ) : (
                      <Unlock size={14} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
