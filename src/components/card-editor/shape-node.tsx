"use client";

import {
  Circle,
  Ellipse,
  Line,
  Path,
  Rect,
  RegularPolygon,
  Ring,
  Star,
} from "react-konva";
import type Konva from "konva";
import type { ShapeElement } from "@/types/card-editor";

const SVG_PATHS: Record<string, string> = {
  heart:
    "M60 105 C60 105 10 72 10 38 C10 18 26 8 42 8 C52 8 58 15 60 20 C62 15 68 8 78 8 C94 8 110 18 110 38 C110 72 60 105 60 105 Z",
  "arrow-right":
    "M10 42 H72 V20 L112 60 L72 100 V78 H10 Z",
  "arrow-left":
    "M110 42 H48 V20 L8 60 L48 100 V78 H110 Z",
  "arrow-up":
    "M42 110 V48 H20 L60 8 L100 48 H78 V110 Z",
  "arrow-down":
    "M42 10 V72 H20 L60 112 L100 72 H78 V10 Z",
  "speech-bubble":
    "M15 20 H105 A10 10 0 0 1 115 30 V78 A10 10 0 0 1 105 88 H50 L25 110 V88 H15 A10 10 0 0 1 5 78 V30 A10 10 0 0 1 15 20 Z",
  cloud:
    "M30 92 H92 A20 20 0 0 0 96 53 A26 26 0 0 0 46 38 A22 22 0 0 0 24 58 A18 18 0 0 0 30 92 Z",
  lightning:
    "M68 8 L24 64 H56 L46 112 L96 52 H62 Z",
  moon:
    "M78 14 A46 46 0 1 0 106 90 A36 36 0 1 1 78 14 Z",
  flower:
    "M60 20 C72 8 88 20 78 36 C96 36 96 58 78 60 C92 74 74 92 60 78 C46 92 28 74 42 60 C24 58 24 36 42 36 C32 20 48 8 60 20 Z",
  balloon:
    "M60 10 C34 10 20 30 20 52 C20 76 42 92 56 96 L52 106 H68 L64 96 C78 92 100 76 100 52 C100 30 86 10 60 10 Z",
  ribbon:
    "M12 30 H108 L94 56 L108 82 H12 L26 56 Z",
  plus:
    "M46 12 H74 V46 H108 V74 H74 V108 H46 V74 H12 V46 H46 Z",
  cross:
    "M24 12 L60 48 L96 12 L108 24 L72 60 L108 96 L96 108 L60 72 L24 108 L12 96 L48 60 L12 24 Z",
  tag:
    "M14 28 H76 L108 60 L76 92 H14 Z",
  banner:
    "M10 28 H110 V88 L60 72 L10 88 Z",
  diamond:
    "M60 8 L112 60 L60 112 L8 60 Z",
  "right-triangle":
    "M14 14 V106 H106 Z",
};

export function ShapeNode({
  el,
  isDrawingMode,
  onSelect,
  onDragMoveSnap,
  onChange,
}: {
  el: ShapeElement;
  isDrawingMode: boolean;
  onSelect: () => void;
  onDragMoveSnap: (node: Konva.Node) => void;
  onChange: (attrs: Partial<ShapeElement>) => void;
}) {
  const common = {
    id: el.id,
    x: el.x,
    y: el.y,
    fill: el.fill,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth ?? 0,
    dash: el.dash,
    opacity: el.opacity ?? 1,
    rotation: el.rotation,
    scaleX: el.scaleX,
    scaleY: el.scaleY,
    draggable: !isDrawingMode && !el.locked,
    onClick: () => !isDrawingMode && onSelect(),
    onTap: () => !isDrawingMode && onSelect(),
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) =>
      onDragMoveSnap(e.target),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
      onChange({ x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
    },
  };

  if (el.shape === "circle") {
    return <Circle {...common} radius={el.width / 2} />;
  }
  if (el.shape === "oval") {
    return (
      <Ellipse
        {...common}
        radiusX={el.width / 2}
        radiusY={el.height / 3}
      />
    );
  }
  if (el.shape === "triangle") {
    return <RegularPolygon {...common} sides={3} radius={el.width / 2} />;
  }
  if (el.shape === "pentagon") {
    return <RegularPolygon {...common} sides={5} radius={el.width / 2} />;
  }
  if (el.shape === "hexagon") {
    return <RegularPolygon {...common} sides={6} radius={el.width / 2} />;
  }
  if (el.shape === "star-4" || el.shape === "star-5" || el.shape === "star-6") {
    const numPoints = el.shape === "star-4" ? 4 : el.shape === "star-6" ? 6 : 5;
    return (
      <Star
        {...common}
        numPoints={numPoints}
        innerRadius={el.width / 4}
        outerRadius={el.width / 2}
      />
    );
  }
  if (el.shape === "ring") {
    return (
      <Ring
        {...common}
        innerRadius={el.width / 4}
        outerRadius={el.width / 2}
      />
    );
  }
  if (el.shape === "line") {
    return (
      <Line
        {...common}
        points={[0, 0, el.width, 0]}
        stroke={el.stroke || el.fill}
        strokeWidth={el.strokeWidth || 6}
      />
    );
  }
  if (SVG_PATHS[el.shape]) {
    return <Path {...common} data={SVG_PATHS[el.shape]} />;
  }

  return (
    <Rect
      {...common}
      width={el.width}
      height={el.height}
      cornerRadius={el.shape === "rounded-rect" ? el.cornerRadius ?? 18 : 0}
    />
  );
}
