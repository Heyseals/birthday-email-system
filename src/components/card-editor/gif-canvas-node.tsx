"use client";

import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { parseGIF, decompressFrames } from "gifuct-js";
import type { GifElement } from "@/types/card-editor";

interface DecodedFrame {
  canvas: HTMLCanvasElement;
  delay: number;
}

export function GifCanvasNode({
  element,
  isSelected,
  isPlaying,
  onSelect,
  onChange,
  onDragMoveSnap,
  onDragEndSnap,
}: {
  element: GifElement;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<GifElement>) => void;
  onDragMoveSnap: (node: Konva.Node) => void;
  onDragEndSnap: () => void;
}) {
  const imageRef = useRef<Konva.Image>(null);
  const [frames, setFrames] = useState<DecodedFrame[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadGif() {
      try {
        const res = await fetch(element.src);
        const buffer = await res.arrayBuffer();
        const gif = parseGIF(buffer);
        const rawFrames = decompressFrames(gif, true).slice(0, 100);
        if (cancelled || rawFrames.length === 0) return;

        const fullWidth = gif.lsd.width;
        const fullHeight = gif.lsd.height;
        const compCanvas = document.createElement("canvas");
        compCanvas.width = fullWidth;
        compCanvas.height = fullHeight;
        const compCtx = compCanvas.getContext("2d");
        if (!compCtx) return;

        const decoded: DecodedFrame[] = [];
        for (const frame of rawFrames) {
          const frameCanvas = document.createElement("canvas");
          frameCanvas.width = frame.dims.width;
          frameCanvas.height = frame.dims.height;
          const frameCtx = frameCanvas.getContext("2d");
          if (frameCtx) {
            const imageData = frameCtx.createImageData(
              frame.dims.width,
              frame.dims.height
            );
            imageData.data.set(frame.patch);
            frameCtx.putImageData(imageData, 0, 0);
            compCtx.drawImage(frameCanvas, frame.dims.left, frame.dims.top);
          }

          const snap = document.createElement("canvas");
          snap.width = fullWidth;
          snap.height = fullHeight;
          const snapCtx = snap.getContext("2d");
          snapCtx?.drawImage(compCanvas, 0, 0);

          decoded.push({
            canvas: snap,
            delay: Math.max(frame.delay || 100, 40),
          });
        }

        if (!cancelled) {
          setFrames(decoded);
          setCurrentCanvas(decoded[0]?.canvas ?? null);
        }
      } catch {
        // ignore decode error
      }
    }

    loadGif();
    return () => {
      cancelled = true;
    };
  }, [element.src]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    let frameIdx = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - lastTime;
      const delay = frames[frameIdx]?.delay ?? 100;
      if (elapsed >= delay) {
        frameIdx = (frameIdx + 1) % frames.length;
        setCurrentCanvas(frames[frameIdx].canvas);
        imageRef.current?.getLayer()?.batchDraw();
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [frames, isPlaying]);

  if (!currentCanvas) return null;

  return (
    <KonvaImage
      ref={imageRef}
      id={element.id}
      image={currentCanvas}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragMove={(e) => onDragMoveSnap(e.target)}
      onDragEnd={(e) => {
        onDragEndSnap();
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        });
      }}
      stroke={isSelected ? "#C8421F" : undefined}
      strokeWidth={isSelected ? 2 : 0}
    />
  );
}
