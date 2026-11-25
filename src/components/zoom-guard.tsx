"use client";

import { useEffect } from "react";

export function useZoomGuard() {
  useEffect(() => {
    const isDesktop =
      window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    if (!isDesktop) return;

    const baseline = window.devicePixelRatio || 1;
    const root = document.documentElement;

    const updateZoom = () => {
      const current = window.devicePixelRatio || 1;
      const zoomLevel = current / baseline;

      if (zoomLevel > 0 && zoomLevel < 0.9) {
        const factor = Math.min(0.9 / zoomLevel, 3);
        root.style.setProperty("--zoom-comp", factor.toFixed(4));
        root.dataset.zoomCompActive = "true";
      } else {
        root.style.setProperty("--zoom-comp", "1");
        delete root.dataset.zoomCompActive;
      }
    };

    updateZoom();
    window.addEventListener("resize", updateZoom, { passive: true });
    return () => {
      window.removeEventListener("resize", updateZoom);
      root.style.removeProperty("--zoom-comp");
      delete root.dataset.zoomCompActive;
    };
  }, []);
}

export function ZoomGuard() {
  useZoomGuard();
  return null;
}
