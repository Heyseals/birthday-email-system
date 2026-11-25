"use client";

import { useEffect, useState } from "react";
import { Pipette } from "lucide-react";

const RECENT_COLORS_KEY = "birthday-card-recent-colors-v1";

const PALETTES = [
  {
    name: "ธีมเว็บ",
    colors: ["#3B2A26", "#C8421F", "#1F7A6D", "#F2B632", "#FBE3DC", "#FFF8EE"],
  },
  {
    name: "วันเกิดสดใส",
    colors: ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93", "#FFFFFF"],
  },
  {
    name: "พาสเทล",
    colors: ["#FFB5A7", "#FCD5CE", "#F8EDEB", "#B5E48C", "#A9DEF9", "#E4C1F9"],
  },
  {
    name: "ขาวดำ",
    colors: ["#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF"],
  },
];

export function ColorPickerPanel({
  color,
  onChange,
  label = "เลือกสี",
}: {
  color: string;
  onChange: (nextColor: string) => void;
  label?: string;
}) {
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(RECENT_COLORS_KEY);
        if (saved) return JSON.parse(saved) as string[];
      } catch {
        // ignore
      }
    }
    return ["#C8421F", "#3B2A26", "#1F7A6D", "#F2B632"];
  });
  const [hexInput, setHexInput] = useState(color);
  const [eyeDropperError, setEyeDropperError] = useState<string | null>(null);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  const selectColor = (next: string) => {
    onChange(next);
    setRecentColors((prev) => {
      const updated = [next, ...prev.filter((c) => c.toLowerCase() !== next.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleEyeDropper = async () => {
    setEyeDropperError(null);
    const EyeDropperCtor = (
      window as unknown as {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
      }
    ).EyeDropper;

    if (!EyeDropperCtor) {
      setEyeDropperError("เบราว์เซอร์นี้ไม่รองรับเครื่องมือดูดสีจากหน้าจอ");
      return;
    }

    try {
      const result = await new EyeDropperCtor().open();
      selectColor(result.sRGBHex);
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--birthday-text)]">
          {label}
        </span>
        <button
          type="button"
          onClick={handleEyeDropper}
          aria-label="ดูดสีจากหน้าจอ"
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[var(--birthday-border)] px-2.5 text-xs text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
        >
          <Pipette size={14} strokeWidth={1.5} />
          <span>ดูดสี</span>
        </button>
      </div>

      {eyeDropperError && (
        <p className="text-[11px] text-[var(--birthday-error)]">
          {eyeDropperError}
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#3B2A26"}
          onChange={(e) => selectColor(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--birthday-border)] p-1"
        />
        <input
          type="text"
          aria-label="รหัสสี HEX"
          value={hexInput}
          onChange={(e) => {
            const val = e.target.value;
            setHexInput(val);
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              selectColor(val);
            }
          }}
          placeholder="#C8421F"
          className="min-h-[44px] flex-1 rounded-lg border border-[var(--birthday-border)] px-3 text-xs font-mono text-[var(--birthday-text)]"
        />
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-[var(--birthday-muted)]">
          สีล่าสุด
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recentColors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`เลือกสี ${c}`}
              onClick={() => selectColor(c)}
              className="h-7 w-7 rounded-full border border-[var(--birthday-border)]"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {PALETTES.map((pal) => (
          <div key={pal.name}>
            <p className="mb-1 text-[11px] text-[var(--birthday-muted)]">
              {pal.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pal.colors.map((c) => (
                <button
                  key={`${pal.name}-${c}`}
                  type="button"
                  aria-label={`เลือกสี ${c}`}
                  onClick={() => selectColor(c)}
                  className="h-7 w-7 rounded-full border border-[var(--birthday-border)]"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
