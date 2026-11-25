import getStroke from "perfect-freehand";
import type { StrokeTool } from "@/types/card-editor";

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}

export function buildStrokePathData(
  points: number[][],
  width: number,
  tool: StrokeTool
): string {
  const options =
    tool === "pencil"
      ? { size: width, thinning: 0.2, smoothing: 0.4, streamline: 0.3 }
      : tool === "brush"
        ? { size: width * 1.3, thinning: 0.7, smoothing: 0.6, streamline: 0.5 }
        : tool === "highlighter"
          ? { size: width * 1.6, thinning: 0, smoothing: 0.5, streamline: 0.5 }
          : { size: width, thinning: 0.4, smoothing: 0.5, streamline: 0.5 };

  const outlinePoints = getStroke(points, options);
  return getSvgPathFromStroke(outlinePoints);
}
