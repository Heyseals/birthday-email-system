"use client";

import { useEffect, useRef, useState } from "react";
import { Pipette } from "lucide-react";

const RECENT_COLORS_KEY = "birthday-card-recent-colors-v1";

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const col = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * col)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function ColorWheel({
  onSelectColor,
}: {
  onSelectColor: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState(14);
  const [sat, setSat] = useState(75);
  const [lightness, setLightness] = useState(50);
  const [marker, setMarker] = useState<{ x: number; y: number }>({
    x: 135,
    y: 80,
  });
  const isDraggingRef = useRef(false);
  const size = 180;
  const radius = size / 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;

        if (dist <= radius) {
          const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
          const s = (dist / radius) * 100;
          const hex = hslToHex(angle, s, lightness);
          data[idx] = parseInt(hex.slice(1, 3), 16);
          data[idx + 1] = parseInt(hex.slice(3, 5), 16);
          data[idx + 2] = parseInt(hex.slice(5, 7), 16);
          data[idx + 3] = 255;
        } else {
          data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [lightness, radius]);

  const pickAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * size;
    const y = ((clientY - rect.top) / rect.height) * size;
    const dx = x - radius;
    const dy = y - radius;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), radius);
    const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const s = (dist / radius) * 100;

    const clampedX = radius + (dist * dx) / (Math.sqrt(dx * dx + dy * dy) || 1);
    const clampedY = radius + (dist * dy) / (Math.sqrt(dx * dx + dy * dy) || 1);

    setHue(angle);
    setSat(s);
    setMarker({ x: clampedX, y: clampedY });
    onSelectColor(hslToHex(angle, s, lightness));
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        className="relative select-none"
        style={{ width: size, height: size, touchAction: "none" }}
        onPointerDown={(e) => {
          isDraggingRef.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          pickAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!isDraggingRef.current) return;
          pickAt(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          isDraggingRef.current = false;
        }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="block h-full w-full cursor-crosshair rounded-full"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: marker.x, top: marker.y }}
        />
      </div>

      <div className="w-full">
        <label
          htmlFor="wheel-lightness"
          className="mb-1 flex justify-between text-[11px] text-[var(--birthday-muted)]"
        >
          <span>ความสว่าง</span>
          <span>{lightness}%</span>
        </label>
        <input
          id="wheel-lightness"
          type="range"
          min={10}
          max={90}
          value={lightness}
          onChange={(e) => {
            const nextL = Number(e.target.value);
            setLightness(nextL);
            onSelectColor(hslToHex(hue, sat, nextL));
          }}
          className="w-full accent-[var(--birthday-primary)]"
        />
      </div>
    </div>
  );
}

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

      <ColorWheel onSelectColor={selectColor} />

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
