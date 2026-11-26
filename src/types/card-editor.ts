export type CardRatio = "4:5" | "1:1";

export type CardBackground =
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string };

export type TextAlign = "left" | "center" | "right";

export interface BaseElement {
  id: string;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  align: TextAlign;
  width: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  width: number;
  height: number;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: "rect" | "circle" | "star";
  fill: string;
  width: number;
  height: number;
}

export interface StickerElement extends BaseElement {
  type: "sticker";
  label: string;
  emojiFallback?: never;
  symbol: "cake" | "gift" | "sparkles" | "heart" | "star";
  color: string;
  size: number;
}

export interface GifElement extends BaseElement {
  type: "gif";
  src: string;
  width: number;
  height: number;
  alt: string;
  locked?: boolean;
}

export type StrokeTool = "pen" | "pencil" | "brush" | "highlighter" | "eraser";

export interface StrokeElement extends BaseElement {
  type: "stroke";
  tool: StrokeTool;
  points: number[][];
  color: string;
  width: number;
  opacity: number;
}

export type CardElement =
  | TextElement
  | ImageElement
  | GifElement
  | ShapeElement
  | StickerElement
  | StrokeElement;

export interface CardDesign {
  version: 1;
  ratio: CardRatio;
  background: CardBackground;
  elements: CardElement[];
}

export const THAI_FONTS = [
  { label: "IBM Plex Sans Thai", value: "IBM Plex Sans Thai, sans-serif" },
  { label: "Prompt", value: "Prompt, sans-serif" },
  { label: "Kanit", value: "Kanit, sans-serif" },
  { label: "Sarabun", value: "Sarabun, sans-serif" },
  { label: "Mali", value: "Mali, cursive" },
  { label: "Itim", value: "Itim, cursive" },
] as const;

export interface CardTemplate {
  id: string;
  name: string;
  design: CardDesign;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "blank",
    name: "หน้าว่าง",
    design: {
      version: 1,
      ratio: "4:5",
      background: { type: "solid", color: "#FFF8EE" },
      elements: [],
    },
  },
  {
    id: "warm-classic",
    name: "อบอุ่นคลาสสิก",
    design: {
      version: 1,
      ratio: "4:5",
      background: { type: "solid", color: "#FFF8EE" },
      elements: [
        {
          id: "t1",
          type: "shape",
          shape: "rect",
          x: 40,
          y: 40,
          width: 720,
          height: 920,
          fill: "#FFFFFF",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "t2",
          type: "sticker",
          symbol: "cake",
          label: "เค้กวันเกิด",
          x: 360,
          y: 220,
          size: 80,
          color: "#C8421F",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "t3",
          type: "text",
          text: "สุขสันต์วันเกิด",
          x: 100,
          y: 350,
          width: 600,
          fontSize: 56,
          fontFamily: "Prompt, sans-serif",
          fill: "#3B2A26",
          fontStyle: "bold",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "t4",
          type: "text",
          text: "ขอให้มีความสุข สุขภาพแข็งแรง\nและสมหวังในทุกสิ่งที่ตั้งใจ",
          x: 100,
          y: 460,
          width: 600,
          fontSize: 28,
          fontFamily: "IBM Plex Sans Thai, sans-serif",
          fill: "#6B5750",
          fontStyle: "normal",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
      ],
    },
  },
  {
    id: "bright-celebration",
    name: "สนุกสนานสดใส",
    design: {
      version: 1,
      ratio: "4:5",
      background: { type: "gradient", from: "#FFF8EE", to: "#FBE3DC" },
      elements: [
        {
          id: "b1",
          type: "shape",
          shape: "circle",
          x: 400,
          y: 280,
          width: 220,
          height: 220,
          fill: "#F2B632",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "b2",
          type: "text",
          text: "Happy Birthday!",
          x: 80,
          y: 450,
          width: 640,
          fontSize: 54,
          fontFamily: "Mali, cursive",
          fill: "#C8421F",
          fontStyle: "bold",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "b3",
          type: "text",
          text: "ขอให้ปีนี้เต็มไปด้วยรอยยิ้มและความทรงจำดีๆ",
          x: 100,
          y: 550,
          width: 600,
          fontSize: 26,
          fontFamily: "Kanit, sans-serif",
          fill: "#3B2A26",
          fontStyle: "normal",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
      ],
    },
  },
  {
    id: "minimal-cream",
    name: "มินิมอลเรียบง่าย",
    design: {
      version: 1,
      ratio: "1:1",
      background: { type: "solid", color: "#FFFFFF" },
      elements: [
        {
          id: "m1",
          type: "text",
          text: "สุขสันต์วันคล้ายวันเกิด",
          x: 80,
          y: 300,
          width: 640,
          fontSize: 44,
          fontFamily: "Sarabun, sans-serif",
          fill: "#3B2A26",
          fontStyle: "bold",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "m2",
          type: "text",
          text: "ด้วยความปรารถนาดีเสมอมา",
          x: 80,
          y: 390,
          width: 640,
          fontSize: 24,
          fontFamily: "Sarabun, sans-serif",
          fill: "#6B5750",
          fontStyle: "normal",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
      ],
    },
  },
  {
    id: "pastel-soft",
    name: "น่ารักละมุน",
    design: {
      version: 1,
      ratio: "1:1",
      background: { type: "solid", color: "#FBE3DC" },
      elements: [
        {
          id: "p1",
          type: "sticker",
          symbol: "heart",
          label: "หัวใจ",
          x: 360,
          y: 220,
          size: 72,
          color: "#C8421F",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "p2",
          type: "text",
          text: "สุขสันต์วันเกิดนะ",
          x: 80,
          y: 340,
          width: 640,
          fontSize: 50,
          fontFamily: "Itim, cursive",
          fill: "#3B2A26",
          fontStyle: "normal",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
      ],
    },
  },
  {
    id: "emerald-formal",
    name: "ทางการสุภาพ",
    design: {
      version: 1,
      ratio: "4:5",
      background: { type: "solid", color: "#1F7A6D" },
      elements: [
        {
          id: "f1",
          type: "text",
          text: "เนื่องในโอกาสวันคล้ายวันเกิด",
          x: 80,
          y: 320,
          width: 640,
          fontSize: 38,
          fontFamily: "Sarabun, sans-serif",
          fill: "#FFF8EE",
          fontStyle: "bold",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
        {
          id: "f2",
          type: "text",
          text: "ขออวยพรให้ท่านประสบแต่ความสุข ความเจริญ\nและสุขภาพพลานามัยที่สมบูรณ์แข็งแรง",
          x: 80,
          y: 420,
          width: 640,
          fontSize: 26,
          fontFamily: "Sarabun, sans-serif",
          fill: "#FFF8EE",
          fontStyle: "normal",
          align: "center",
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        },
      ],
    },
  },
];
