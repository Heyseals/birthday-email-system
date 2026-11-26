"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle, Star, Text, Image as KonvaImage, Transformer, Line, Path, Group } from "react-konva";
import type Konva from "konva";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eraser,
  Film,
  ImagePlus,
  Pause,
  PenTool,
  Play,
  Redo2,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { GifCanvasNode } from "./gif-canvas-node";
import { ColorPickerPanel } from "./color-picker-panel";
import { LayersPanel } from "./layers-panel";
import { PaintRibbon } from "./paint-ribbon";
import { ShapeNode } from "./shape-node";
import { buildStrokePathData } from "./stroke-utils";
import {
  CARD_TEMPLATES,
  THAI_FONTS,
  type CardDesign,
  type CardElement,
  type CardRatio,
  type ShapeKind,
  type StrokeTool,
  type TextElement,
} from "@/types/card-editor";

const STORAGE_KEY = "birthday-card-draft-v1";
const MAX_ELEMENTS = 50;
const CANVAS_WIDTH = 800;

function MaskedElementWrapper({
  id,
  x,
  y,
  eraserMask,
  children,
}: {
  id: string;
  x: number;
  y: number;
  eraserMask?: Array<{ points: number[][]; width: number }>;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    if (eraserMask && eraserMask.length > 0) {
      node.cache({ pixelRatio: 2 });
    } else {
      node.clearCache();
    }
  }, [eraserMask, children]);

  if (!eraserMask || eraserMask.length === 0) {
    return <>{children}</>;
  }

  const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
    <Group ref={groupRef} id={`mask-${id}`}>
      {children}
      {eraserMask.map((mask, idx) => (
        <Path
          key={idx}
          x={x}
          y={y}
          data={buildStrokePathData(mask.points, mask.width, "eraser")}
          fill="#000000"
          globalCompositeOperation="destination-out"
          listening={false}
        />
      ))}
    </Group>
  );
}

function getCanvasHeight(ratio: CardRatio): number {
  return ratio === "4:5" ? 1000 : 800;
}

function URLImage({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragMoveSnap,
  onDragEndSnap,
}: {
  element: Extract<CardElement, { type: "image" }>;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CardElement>) => void;
  onDragMoveSnap: (node: Konva.Node) => void;
  onDragEndSnap: () => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = element.src;
    image.onload = () => setImg(image);
  }, [element.src]);

  if (!img) return null;

  const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
    <KonvaImage
      id={element.id}
      image={img}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      draggable
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

export function CardEditorClient() {
  const [design, setDesign] = useState<CardDesign>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as CardDesign;
      } catch {
        // ignore invalid draft
      }
    }
    return CARD_TEMPLATES[1].design;
  });

  const [history, setHistory] = useState<CardDesign[]>([]);
  const [future, setFuture] = useState<CardDesign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(0.5);
  const [previewNameMode, setPreviewNameMode] = useState(false);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [cardTitle, setCardTitle] = useState("การ์ดอวยพรวันเกิด");
  const [isPublicCard, setIsPublicCard] = useState(true);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [saveSuccessUrl, setSaveSuccessUrl] = useState<string | null>(null);
  const [isGifPlaying, setIsGifPlaying] = useState(() => {
    if (typeof window !== "undefined") {
      return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return true;
  });
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState("birthday");
  const [gifResults, setGifResults] = useState<
    Array<{ id: string; title: string; previewUrl: string; url: string }>
  >([]);
  const [isSearchingGif, setIsSearchingGif] = useState(false);

  // Drawing Mode State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawTool, setDrawTool] = useState<StrokeTool>("pen");
  const [drawColor, setDrawColor] = useState("#C8421F");
  const [secondaryColor, setSecondaryColor] = useState("#F2B632");
  const [drawWidth, setDrawWidth] = useState(8);
  const [drawOpacity, setDrawOpacity] = useState(1);
  const [activePoints, setActivePoints] = useState<number[][] | null>(null);
  const [eraserCursor, setEraserCursor] = useState<{ x: number; y: number } | null>(null);
  const [rightTab, setRightTab] = useState<"props" | "layers">("props");

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

  const canvasHeight = getCanvasHeight(design.ratio);

  // โหลด Google Fonts สำหรับแคนวาส
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Itim&family=Kanit:wght@400;600&family=Mali:wght@400;600&family=Prompt:wght@400;600&family=Sarabun:wght@400;600&display=swap";
    document.head.appendChild(link);
    const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Autosave
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
    } catch {
      // ignore storage quota errors
    }
  }, [design]);

  // Responsive canvas scaling
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth - 24;
      const scale = Math.min(availableWidth / CANVAS_WIDTH, 0.65);
      setStageScale(Math.max(0.28, scale));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Attach Transformer
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    if (!selectedId) {
      trRef.current.nodes([]);
      return;
    }
    const node = stageRef.current.findOne(`#${selectedId}`);
    if (node) {
      trRef.current.nodes([node]);
      trRef.current.getLayer()?.batchDraw();
    } else {
      trRef.current.nodes([]);
    }
  }, [selectedId, design.elements]);

  const commitDesign = useCallback(
    (next: CardDesign) => {
      setHistory((prev) => [...prev.slice(-29), design]);
      setFuture([]);
      setDesign(next);
    },
    [design]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [design, ...f]);
    setDesign(prev);
    setSelectedId(null);
  }, [design, history]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, design]);
    setDesign(next);
    setSelectedId(null);
  }, [design, future]);

  const updateElement = useCallback(
    (id: string, attrs: Partial<CardElement>) => {
      commitDesign({
        ...design,
        elements: design.elements.map((el) =>
          el.id === id ? ({ ...el, ...attrs } as CardElement) : el
        ),
      });
    },
    [commitDesign, design]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    commitDesign({
      ...design,
      elements: design.elements.filter((el) => el.id !== selectedId),
    });
    setSelectedId(null);
  }, [commitDesign, design, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId || design.elements.length >= MAX_ELEMENTS) return;
    const target = design.elements.find((el) => el.id === selectedId);
    if (!target) return;
    const copy = {
      ...target,
      id: `el-${Date.now()}`,
      x: target.x + 24,
      y: target.y + 24,
    };
    commitDesign({
      ...design,
      elements: [...design.elements, copy],
    });
    setSelectedId(copy.id);
  }, [commitDesign, design, selectedId]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (
        selectedId &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const el = design.elements.find((item) => item.id === selectedId);
        if (!el) return;
        const step = e.shiftKey ? 10 : 2;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        updateElement(selectedId, { x: el.x + dx, y: el.y + dy });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    deleteSelected,
    design.elements,
    duplicateSelected,
    handleRedo,
    handleUndo,
    selectedId,
    updateElement,
  ]);

  const addElement = (el: CardElement) => {
    if (design.elements.length >= MAX_ELEMENTS) {
      setStatusMsg(`เพิ่มองค์ประกอบได้สูงสุด ${MAX_ELEMENTS} ชิ้นต่อการ์ด`);
      return;
    }
    setStatusMsg(null);
    commitDesign({ ...design, elements: [...design.elements, el] });
    setSelectedId(el.id);
  };

  const handleAddText = () => {
    addElement({
      id: `txt-${Date.now()}`,
      type: "text",
      text: "พิมพ์ข้อความอวยพร",
      x: 150,
      y: canvasHeight / 2 - 40,
      width: 500,
      fontSize: 40,
      fontFamily: "Prompt, sans-serif",
      fill: "#3B2A26",
      fontStyle: "normal",
      align: "center",
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    });
  };

  const handleAddShape = (shape: ShapeKind) => {
    addElement({
      id: `shp-${Date.now()}`,
      type: "shape",
      shape,
      x: CANVAS_WIDTH / 2 - 60,
      y: canvasHeight / 2 - 60,
      width: 120,
      height: 120,
      fill: drawColor,
      stroke: secondaryColor,
      strokeWidth: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    });
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatusMsg("รองรับเฉพาะไฟล์ JPG, PNG และ WebP เท่านั้น");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      addElement({
        id: `img-${Date.now()}`,
        type: "image",
        src: reader.result,
        x: 200,
        y: 200,
        width: 320,
        height: 240,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUploadGif = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/gif") {
      setStatusMsg("รองรับเฉพาะไฟล์ .gif เท่านั้น");
      return;
    }
    const gifCount = design.elements.filter((el) => el.type === "gif").length;
    if (gifCount >= 3) {
      setStatusMsg("เพิ่ม GIF ได้สูงสุด 3 ชิ้นต่อการ์ด");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      addElement({
        id: `gif-${Date.now()}`,
        type: "gif",
        src: reader.result,
        alt: "ภาพเคลื่อนไหวอวยพรวันเกิด",
        x: 220,
        y: 220,
        width: 240,
        height: 240,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      });
      setShowGifPicker(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const searchGiphy = async (query: string) => {
    setIsSearchingGif(true);
    setStatusMsg(null);
    try {
      const res = await fetch(
        `/api/gif/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error ?? "ไม่สามารถค้นหา GIF ได้");
      } else {
        setGifResults(data.items ?? []);
      }
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดในการเชื่อมต่อคลัง GIF");
    } finally {
      setIsSearchingGif(false);
    }
  };

  const reorderElement = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...design.elements];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    commitDesign({ ...design, elements: next });
  };

  const moveLayer = (direction: "up" | "down") => {
    if (!selectedId) return;
    const idx = design.elements.findIndex((el) => el.id === selectedId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= design.elements.length) return;
    const next = [...design.elements];
    const [item] = next.splice(idx, 1);
    next.splice(targetIdx, 0, item);
    commitDesign({ ...design, elements: next });
  };

  const handleDragMoveSnap = (node: Konva.Node) => {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = canvasHeight / 2;
    const box = node.getClientRect({ relativeTo: node.getParent() ?? undefined });
    const nodeCenterX = box.x + box.width / 2;
    const nodeCenterY = box.y + box.height / 2;

    const nextSnap: { x?: number; y?: number } = {};
    if (Math.abs(nodeCenterX - centerX) < 12) {
      node.x(node.x() + (centerX - nodeCenterX));
      nextSnap.x = centerX;
    }
    if (Math.abs(nodeCenterY - centerY) < 12) {
      node.y(node.y() + (centerY - nodeCenterY));
      nextSnap.y = centerY;
    }
    setSnapLines(nextSnap);
  };

  const selectedElement = design.elements.find((el) => el.id === selectedId) ?? null;

  const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label="เลิกทำ"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)] disabled:opacity-40"
          >
            <Undo2 size={18} strokeWidth={1.5} />
            <span className="hidden sm:inline">เลิกทำ</span>
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={future.length === 0}
            aria-label="ทำซ้ำ"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)] disabled:opacity-40"
          >
            <Redo2 size={18} strokeWidth={1.5} />
            <span className="hidden sm:inline">ทำซ้ำ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGifPlaying((p) => !p)}
            aria-label={isGifPlaying ? "หยุด GIF ชั่วคราว" : "เล่น GIF"}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
          >
            {isGifPlaying ? (
              <Pause size={16} strokeWidth={1.5} />
            ) : (
              <Play size={16} strokeWidth={1.5} />
            )}
            <span className="hidden sm:inline">
              {isGifPlaying ? "หยุด GIF" : "เล่น GIF"}
            </span>
          </button>
          <label htmlFor="card-ratio" className="text-sm text-[var(--birthday-muted)]">
            สัดส่วน:
          </label>
          <select
            id="card-ratio"
            value={design.ratio}
            onChange={(e) =>
              commitDesign({ ...design, ratio: e.target.value as CardRatio })
            }
            className="min-h-[44px] rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)]"
          >
            <option value="4:5">แนวตั้ง (4:5)</option>
            <option value="1:1">จัตุรัส (1:1)</option>
          </select>
          <button
            type="button"
            onClick={() => setPreviewNameMode((prev) => !prev)}
            className={`min-h-[44px] rounded-lg border px-3 text-sm font-medium transition ${
              previewNameMode
                ? "border-[var(--birthday-primary)] bg-[var(--birthday-soft)] text-[var(--birthday-primary)]"
                : "border-[var(--birthday-border)] bg-[var(--birthday-surface)] text-[var(--birthday-text)]"
            }`}
          >
            {previewNameMode ? "กำลังดูตัวอย่าง: คุณสมชาย" : "ดูตัวอย่าง {ชื่อ}"}
          </button>
          <input
            type="text"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            placeholder="ชื่อการ์ด"
            aria-label="ชื่อการ์ด"
            className="min-h-[44px] w-40 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)]"
          />
          <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm text-[var(--birthday-text)]">
            <input
              type="checkbox"
              checked={isPublicCard}
              onChange={(e) => setIsPublicCard(e.target.checked)}
              className="h-4 w-4 accent-[var(--birthday-primary)]"
            />
            สาธารณะ
          </label>
          <button
            type="button"
            onClick={handleSaveCard}
            disabled={isSavingCard}
            className="min-h-[44px] rounded-lg bg-[var(--birthday-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--birthday-primary-hover)] disabled:opacity-60"
          >
            {isSavingCard ? "กำลังบันทึก..." : savedCardId ? "อัปเดตการ์ด" : "บันทึกการ์ด"}
          </button>
        </div>
      </div>

      {saveSuccessUrl && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <span>บันทึกการ์ดเรียบร้อยแล้ว!</span>
          <a
            href={saveSuccessUrl}
            className="inline-flex items-center rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            ใช้การ์ดนี้ส่งอวยพร →
          </a>
        </div>
      )}

      {statusMsg && (
        <div
          role="status"
          className="rounded-lg bg-[var(--birthday-soft)] px-4 py-2.5 text-sm text-[var(--birthday-error)]"
        >
          {statusMsg}
        </div>
      )}

      {/* Paint-style Ribbon */}
      <PaintRibbon
        isDrawingMode={isDrawingMode}
        isEraser={drawTool === "eraser"}
        primaryColor={drawColor}
        secondaryColor={secondaryColor}
        onSelectMode={(mode) => {
          if (mode === "select") {
            setIsDrawingMode(false);
          } else if (mode === "draw") {
            setIsDrawingMode(true);
            if (drawTool === "eraser") setDrawTool("pen");
            setSelectedId(null);
          } else {
            setIsDrawingMode(true);
            setDrawTool("eraser");
            setSelectedId(null);
          }
        }}
        onAddText={handleAddText}
        onUploadImage={() => fileInputRef.current?.click()}
        onToggleGif={() => setShowGifPicker((v) => !v)}
        onAddShape={handleAddShape}
        onSwapColors={() => {
          const prev = drawColor;
          setDrawColor(secondaryColor);
          setSecondaryColor(prev);
        }}
        onChangePrimaryColor={(c) => {
          setDrawColor(c);
          if (selectedElement && (selectedElement.type === "shape" || selectedElement.type === "text")) {
            updateElement(selectedElement.id, { fill: c });
          }
        }}
        onOpenLayers={() => {
          setIsDrawingMode(false);
          setRightTab("layers");
        }}
      />

      {/* Main Editor Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Toolbar (Desktop) / Bottom Toolbar (Mobile) */}
        <aside className="order-2 rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-4 lg:order-1 lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-[var(--birthday-text)]">
            เพิ่มองค์ประกอบ
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={handleAddText}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <Type size={18} strokeWidth={1.5} />
              <span>ข้อความ</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <ImagePlus size={18} strokeWidth={1.5} />
              <span>รูปภาพ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDrawingMode((v) => !v);
                setSelectedId(null);
              }}
              aria-pressed={isDrawingMode}
              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${
                isDrawingMode
                  ? "border-[var(--birthday-primary)] bg-[var(--birthday-primary)] text-[var(--birthday-on-primary)]"
                  : "border-[var(--birthday-border)] text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
              }`}
            >
              <PenTool size={18} strokeWidth={1.5} />
              <span>{isDrawingMode ? "กำลังวาด" : "วาด"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGifPicker((v) => !v)}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <Film size={18} strokeWidth={1.5} />
              <span>GIF</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShape("rect")}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <Shapes size={18} strokeWidth={1.5} />
              <span>สี่เหลี่ยม</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShape("circle")}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--birthday-border)] px-3 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              <Sparkles size={18} strokeWidth={1.5} />
              <span>วงกลม</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUploadImage}
            className="hidden"
          />
          <input
            ref={gifInputRef}
            type="file"
            accept="image/gif"
            onChange={handleUploadGif}
            className="hidden"
          />

          {showGifPicker && (
            <div className="mt-4 space-y-3 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-bg)] p-3">
              <button
                type="button"
                onClick={() => gifInputRef.current?.click()}
                className="min-h-[44px] w-full rounded-lg bg-[var(--birthday-primary)] px-3 text-xs font-medium text-[var(--birthday-on-primary)] hover:bg-[var(--birthday-primary-hover)]"
              >
                อัปโหลดไฟล์ .gif จากเครื่อง
              </button>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={gifQuery}
                  onChange={(e) => setGifQuery(e.target.value)}
                  placeholder="ค้นหา GIF..."
                  className="min-h-[40px] flex-1 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-2.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => searchGiphy(gifQuery)}
                  disabled={isSearchingGif}
                  className="min-h-[40px] rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-xs font-medium"
                >
                  ค้นหา
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {["วันเกิด", "เค้ก", "ลูกโป่ง", "ปาร์ตี้"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setGifQuery(tag);
                      searchGiphy(tag);
                    }}
                    className="rounded bg-[var(--birthday-surface)] px-2 py-1 text-[11px] text-[var(--birthday-muted)] hover:text-[var(--birthday-primary)]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {gifResults.length > 0 && (
                <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto">
                  {gifResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const gifCount = design.elements.filter(
                          (el) => el.type === "gif"
                        ).length;
                        if (gifCount >= 3) {
                          setStatusMsg("เพิ่ม GIF ได้สูงสุด 3 ชิ้นต่อการ์ด");
                          return;
                        }
                        addElement({
                          id: `gif-${Date.now()}`,
                          type: "gif",
                          src: item.url,
                          alt: item.title,
                          x: 220,
                          y: 220,
                          width: 240,
                          height: 240,
                          rotation: 0,
                          scaleX: 1,
                          scaleY: 1,
                        });
                        setShowGifPicker(false);
                      }}
                      className="overflow-hidden rounded border border-[var(--birthday-border)]"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.title}
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[var(--birthday-muted)]">
                Powered by GIPHY
              </p>
            </div>
          )}

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold text-[var(--birthday-text)]">
              เทมเพลตเริ่มต้น
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CARD_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    commitDesign(tpl.design);
                    setSelectedId(null);
                  }}
                  className="min-h-[44px] rounded-lg border border-[var(--birthday-border)] px-2.5 py-2 text-left text-xs font-medium text-[var(--birthday-text)] hover:border-[var(--birthday-primary)] hover:bg-[var(--birthday-bg)]"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-[var(--birthday-border)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--birthday-text)]">
              พื้นหลังการ์ด (เลือกสีอิสระ)
            </h3>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  commitDesign({
                    ...design,
                    background: {
                      type: "solid",
                      color:
                        design.background.type === "solid"
                          ? design.background.color
                          : design.background.from,
                    },
                  })
                }
                className={`min-h-[38px] flex-1 rounded-lg border text-xs font-medium ${
                  design.background.type === "solid"
                    ? "border-[var(--birthday-primary)] bg-[var(--birthday-soft)] text-[var(--birthday-primary)]"
                    : "border-[var(--birthday-border)] text-[var(--birthday-text)]"
                }`}
              >
                สีพื้น
              </button>
              <button
                type="button"
                onClick={() =>
                  commitDesign({
                    ...design,
                    background: {
                      type: "gradient",
                      from:
                        design.background.type === "solid"
                          ? design.background.color
                          : design.background.from,
                      to:
                        design.background.type === "gradient"
                          ? design.background.to
                          : "#FBE3DC",
                    },
                  })
                }
                className={`min-h-[38px] flex-1 rounded-lg border text-xs font-medium ${
                  design.background.type === "gradient"
                    ? "border-[var(--birthday-primary)] bg-[var(--birthday-soft)] text-[var(--birthday-primary)]"
                    : "border-[var(--birthday-border)] text-[var(--birthday-text)]"
                }`}
              >
                ไล่เฉด
              </button>
            </div>

            {design.background.type === "solid" ? (
              <ColorPickerPanel
                color={design.background.color}
                onChange={(nextColor) =>
                  commitDesign({
                    ...design,
                    background: { type: "solid", color: nextColor },
                  })
                }
                label="สีพื้นหลัง"
              />
            ) : (
              <div className="space-y-3">
                <ColorPickerPanel
                  color={design.background.from}
                  onChange={(nextColor) =>
                    commitDesign({
                      ...design,
                      background: {
                        type: "gradient",
                        from: nextColor,
                        to:
                          design.background.type === "gradient"
                            ? design.background.to
                            : "#FBE3DC",
                      },
                    })
                  }
                  label="สีเริ่มต้น (ด้านบน)"
                />
                <div className="border-t border-[var(--birthday-border)] pt-3">
                  <label
                    htmlFor="bg-grad-to"
                    className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                  >
                    สีปลายทาง (ด้านล่าง)
                  </label>
                  <input
                    id="bg-grad-to"
                    type="color"
                    value={design.background.to}
                    onChange={(e) =>
                      commitDesign({
                        ...design,
                        background: {
                          type: "gradient",
                          from:
                            design.background.type === "gradient"
                              ? design.background.from
                              : "#FFF8EE",
                          to: e.target.value,
                        },
                      })
                    }
                    className="h-11 w-full cursor-pointer rounded-lg border border-[var(--birthday-border)] p-1"
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center Canvas */}
        <div
          ref={containerRef}
          className="order-1 flex items-center justify-center rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-bg)]/60 p-3 lg:order-2 lg:col-span-6"
        >
          <div
            className="overflow-hidden rounded-lg border border-[var(--birthday-border)] shadow-sm"
            style={{
              width: CANVAS_WIDTH * stageScale,
              height: canvasHeight * stageScale,
              touchAction: isDrawingMode ? "none" : "auto",
            }}
          >
            <Stage
              ref={stageRef}
              width={CANVAS_WIDTH * stageScale}
              height={canvasHeight * stageScale}
              scaleX={stageScale}
              scaleY={stageScale}
              onPointerDown={(e) => {
                if (!isDrawingMode) {
                  if (e.target === e.target.getStage()) setSelectedId(null);
                  return;
                }
                const pos = e.target.getStage()?.getPointerPosition();
                if (!pos) return;
                const x = pos.x / stageScale;
                const y = pos.y / stageScale;
                if (drawTool === "eraser") setEraserCursor({ x, y });
                const pressure =
                  (e.evt as PointerEvent).pressure && (e.evt as PointerEvent).pressure > 0
                    ? (e.evt as PointerEvent).pressure
                    : 0.5;
                setActivePoints([[x, y, pressure]]);
              }}
              onPointerMove={(e) => {
                if (!isDrawingMode) return;
                const pos = e.target.getStage()?.getPointerPosition();
                if (!pos) return;
                const x = pos.x / stageScale;
                const y = pos.y / stageScale;
                if (drawTool === "eraser") setEraserCursor({ x, y });
                if (!activePoints) return;
                const pressure =
                  (e.evt as PointerEvent).pressure && (e.evt as PointerEvent).pressure > 0
                    ? (e.evt as PointerEvent).pressure
                    : 0.5;
                setActivePoints((prev) =>
                  prev ? [...prev, [x, y, pressure]] : null
                );
              }}
              onPointerLeave={() => setEraserCursor(null)}
              onPointerUp={() => {
                if (!isDrawingMode || !activePoints) return;
                if (activePoints.length > 1) {
                  if (drawTool === "eraser") {
                    // ลบทั้งเส้นวาด (stroke layer) และสร้าง eraserMask บน Text/Shape/Image ที่ลากผ่าน
                    const xs = activePoints.map((p) => p[0]);
                    const ys = activePoints.map((p) => p[1]);
                    const minX = Math.min(...xs) - drawWidth / 2;
                    const maxX = Math.max(...xs) + drawWidth / 2;
                    const minY = Math.min(...ys) - drawWidth / 2;
                    const maxY = Math.max(...ys) + drawWidth / 2;

                    const nextElements = design.elements.map((el) => {
                      if (
                        el.type === "stroke" ||
                        el.locked ||
                        el.visible === false
                      ) {
                        return el;
                      }
                      const w =
                        "width" in el ? el.width * Math.abs(el.scaleX) : 120;
                      const h =
                        "height" in el
                          ? el.height * Math.abs(el.scaleY)
                          : el.type === "text"
                            ? el.fontSize * 2.5
                            : 120;
                      const intersects =
                        el.x <= maxX &&
                        el.x + w >= minX &&
                        el.y <= maxY &&
                        el.y + h >= minY;
                      if (!intersects) return el;

                      const localPoints = activePoints.map(([px, py, pr]) => [
                        (px - el.x) / (el.scaleX || 1),
                        (py - el.y) / (el.scaleY || 1),
                        pr,
                      ]);
                      const prevMask = el.eraserMask ?? [];
                      return {
                        ...el,
                        eraserMask: [
                          ...prevMask.slice(-29),
                          { points: localPoints, width: drawWidth },
                        ],
                      };
                    });

                    const strokeCount = nextElements.filter(
                      (el) => el.type === "stroke"
                    ).length;
                    if (strokeCount < 200) {
                      nextElements.push({
                        id: `str-${Date.now()}`,
                        type: "stroke",
                        tool: "eraser",
                        points: activePoints,
                        color: "#000000",
                        width: drawWidth,
                        opacity: 1,
                        x: 0,
                        y: 0,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                      });
                    }
                    commitDesign({ ...design, elements: nextElements });
                    setSelectedId(null);
                  } else {
                    const strokeCount = design.elements.filter(
                      (el) => el.type === "stroke"
                    ).length;
                    if (strokeCount >= 200) {
                      setStatusMsg("วาดได้สูงสุด 200 เส้นต่อการ์ด");
                    } else {
                      const effectiveOpacity =
                        drawTool === "highlighter"
                          ? Math.min(drawOpacity, 0.45)
                          : drawTool === "pencil"
                            ? Math.min(drawOpacity, 0.85)
                            : drawOpacity;
                      addElement({
                        id: `str-${Date.now()}`,
                        type: "stroke",
                        tool: drawTool,
                        points: activePoints,
                        color: drawColor,
                        width: drawWidth,
                        opacity: effectiveOpacity,
                        x: 0,
                        y: 0,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                      });
                      setSelectedId(null);
                    }
                  }
                }
                setActivePoints(null);
              }}
            >
              <Layer>
                {/* Background */}
                {design.background.type === "solid" ? (
                  <Rect
                    x={0}
                    y={0}
                    width={CANVAS_WIDTH}
                    height={canvasHeight}
                    fill={design.background.color}
                    listening={false}
                  />
                ) : (
                  <Rect
                    x={0}
                    y={0}
                    width={CANVAS_WIDTH}
                    height={canvasHeight}
                    fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                    fillLinearGradientEndPoint={{ x: 0, y: canvasHeight }}
                    fillLinearGradientColorStops={[
                      0,
                      design.background.from,
                      1,
                      design.background.to,
                    ]}
                    listening={false}
                  />
                )}

                {/* Elements */}
                {design.elements.map((el) => {
                  if (el.visible === false) return null;
                  if (el.type === "text") {
                    const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
                      <MaskedElementWrapper
                        key={el.id}
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        eraserMask={el.eraserMask}
                      >
                        <Text
                          id={el.id}
                          text={el.text}
                          x={el.x}
                          y={el.y}
                          width={el.width}
                          fontSize={el.fontSize}
                          fontFamily={el.fontFamily}
                          fill={el.fill}
                          fontStyle={el.fontStyle}
                          align={el.align}
                          rotation={el.rotation}
                          scaleX={el.scaleX}
                          scaleY={el.scaleY}
                          draggable={!isDrawingMode && !el.locked}
                          onClick={() => !isDrawingMode && setSelectedId(el.id)}
                          onTap={() => !isDrawingMode && setSelectedId(el.id)}
                          onDragMove={(e) => handleDragMoveSnap(e.target)}
                          onDragEnd={(e) => {
                            setSnapLines({});
                            updateElement(el.id, {
                              x: e.target.x(),
                              y: e.target.y(),
                            });
                          }}
                          onTransformEnd={(e) => {
                            const node = e.target;
                            updateElement(el.id, {
                              x: node.x(),
                              y: node.y(),
                              rotation: node.rotation(),
                              scaleX: node.scaleX(),
                              scaleY: node.scaleY(),
                            });
                          }}
                        />
                      </MaskedElementWrapper>
                    );
                  }
                  if (el.type === "shape") {
                    const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
                      <MaskedElementWrapper
                        key={el.id}
                        id={el.id}
                        x={el.x}
                        y={el.y}
                        eraserMask={el.eraserMask}
                      >
                        <ShapeNode
                          el={el}
                          isDrawingMode={isDrawingMode}
                          onSelect={() => setSelectedId(el.id)}
                          onDragMoveSnap={handleDragMoveSnap}
                          onChange={(attrs) => updateElement(el.id, attrs)}
                        />
                      </MaskedElementWrapper>
                    );
                  }
                  if (el.type === "image") {
                    const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
                      <URLImage
                        key={el.id}
                        element={el}
                        isSelected={selectedId === el.id}
                        onSelect={() => setSelectedId(el.id)}
                        onChange={(attrs) => updateElement(el.id, attrs)}
                        onDragMoveSnap={handleDragMoveSnap}
                        onDragEndSnap={() => setSnapLines({})}
                      />
                    );
                  }
                  if (el.type === "gif") {
                    const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
                      <GifCanvasNode
                        key={el.id}
                        element={el}
                        isSelected={selectedId === el.id}
                        isPlaying={isGifPlaying}
                        onSelect={() => setSelectedId(el.id)}
                        onChange={(attrs) => updateElement(el.id, attrs)}
                        onDragMoveSnap={handleDragMoveSnap}
                        onDragEndSnap={() => setSnapLines({})}
                      />
                    );
                  }
                  if (el.type === "stroke") {
                    return null;
                  }
                  return null;
                })}

                <Transformer ref={trRef} rotateEnabled enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} />
              </Layer>

              {/* Layer แยกสำหรับเส้นวาดและยางลบ (destination-out) */}
              <Layer>
                {design.elements.map((el) => {
                  if (el.type !== "stroke") return null;
                  const pathData = buildStrokePathData(
                    el.points,
                    el.width,
                    el.tool
                  );
                  const handleSaveCard = async () => {
    if (!stageRef.current) return;
    setIsSavingCard(true);
    setStatusMsg(null);
    setSaveSuccessUrl(null);
    setSelectedId(null);

    try {
      const canvas = stageRef.current.toCanvas({ pixelRatio: 2 });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) {
        setStatusMsg("ไม่สามารถสร้างไฟล์รูปการ์ดได้");
        return;
      }

      const formData = new FormData();
      formData.append("title", cardTitle.trim() || "การ์ดอวยพรวันเกิด");
      formData.append("canvas_json", JSON.stringify(design));
      formData.append("is_public", String(isPublicCard));
      formData.append("image", blob, "card.png");

      const endpoint = savedCardId ? `/api/cards/${savedCardId}` : "/api/cards";
      const method = savedCardId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: formData });
      const data = (await res.json()) as {
        ok?: boolean;
        card?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.card?.id) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการ์ดได้");
        return;
      }

      setSavedCardId(data.card.id);
      setSaveSuccessUrl(`/join?cardId=${data.card.id}`);
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะบันทึกการ์ด");
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
                    <Path
                      key={el.id}
                      id={el.id}
                      data={pathData}
                      fill={el.color}
                      opacity={el.opacity}
                      globalCompositeOperation={
                        el.tool === "eraser" ? "destination-out" : "source-over"
                      }
                      x={el.x}
                      y={el.y}
                      rotation={el.rotation}
                      scaleX={el.scaleX}
                      scaleY={el.scaleY}
                      listening={!isDrawingMode && el.tool !== "eraser"}
                      draggable={!isDrawingMode && el.tool !== "eraser"}
                      onClick={() => {
                        if (!isDrawingMode && el.tool !== "eraser") {
                          setSelectedId(el.id);
                        }
                      }}
                      onTap={() => {
                        if (!isDrawingMode && el.tool !== "eraser") {
                          setSelectedId(el.id);
                        }
                      }}
                      onDragEnd={(e) => {
                        updateElement(el.id, {
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                    />
                  );
                })}

                {activePoints && (
                  <Path
                    data={buildStrokePathData(activePoints, drawWidth, drawTool)}
                    fill={drawTool === "eraser" ? "#000000" : drawColor}
                    opacity={
                      drawTool === "highlighter"
                        ? Math.min(drawOpacity, 0.45)
                        : drawTool === "pencil"
                          ? Math.min(drawOpacity, 0.85)
                          : drawTool === "eraser"
                            ? 1
                            : drawOpacity
                    }
                    globalCompositeOperation={
                      drawTool === "eraser" ? "destination-out" : "source-over"
                    }
                    listening={false}
                  />
                )}

                {isDrawingMode && drawTool === "eraser" && eraserCursor && (
                  <Circle
                    x={eraserCursor.x}
                    y={eraserCursor.y}
                    radius={drawWidth / 2}
                    stroke="#C8421F"
                    strokeWidth={1.5}
                    dash={[4, 3]}
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Right Properties & Layers Panel */}
        <aside className="order-3 rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-4 lg:col-span-3">
          {!isDrawingMode && (
            <div className="mb-3 flex gap-1 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-bg)] p-1">
              <button
                type="button"
                onClick={() => setRightTab("props")}
                className={`min-h-[38px] flex-1 rounded-md text-xs font-semibold transition-colors ${
                  rightTab === "props"
                    ? "bg-[var(--birthday-surface)] text-[var(--birthday-primary)] shadow-xs"
                    : "text-[var(--birthday-muted)]"
                }`}
              >
                คุณสมบัติ
              </button>
              <button
                type="button"
                onClick={() => setRightTab("layers")}
                className={`min-h-[38px] flex-1 rounded-md text-xs font-semibold transition-colors ${
                  rightTab === "layers"
                    ? "bg-[var(--birthday-surface)] text-[var(--birthday-primary)] shadow-xs"
                    : "text-[var(--birthday-muted)]"
                }`}
              >
                เลเยอร์ ({design.elements.length})
              </button>
            </div>
          )}

          {isDrawingMode && (
            <h2 className="mb-3 text-sm font-semibold text-[var(--birthday-text)]">
              เครื่องมือวาดรูป
            </h2>
          )}

          {!isDrawingMode && rightTab === "layers" ? (
            <LayersPanel
              elements={design.elements}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              onReorder={reorderElement}
              onUpdateElement={updateElement}
            />
          ) : isDrawingMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "pen", label: "ปากกา" },
                    { id: "pencil", label: "ดินสอ" },
                    { id: "brush", label: "พู่กัน" },
                    { id: "highlighter", label: "ไฮไลต์" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDrawTool(t.id)}
                    className={`min-h-[44px] rounded-lg border px-3 text-xs font-medium ${
                      drawTool === t.id
                        ? "border-[var(--birthday-primary)] bg-[var(--birthday-soft)] text-[var(--birthday-primary)]"
                        : "border-[var(--birthday-border)] text-[var(--birthday-text)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDrawTool("eraser")}
                  className={`col-span-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium ${
                    drawTool === "eraser"
                      ? "border-[var(--birthday-error)] bg-[var(--birthday-soft)] text-[var(--birthday-error)]"
                      : "border-[var(--birthday-border)] text-[var(--birthday-text)]"
                  }`}
                >
                  <Eraser size={16} strokeWidth={1.5} />
                  <span>ยางลบ (ลากเพื่อลบ)</span>
                </button>
              </div>

              <div>
                <label
                  htmlFor="draw-width"
                  className="mb-1 flex justify-between text-xs font-medium text-[var(--birthday-text)]"
                >
                  <span>ขนาดเส้น</span>
                  <span>{drawWidth} px</span>
                </label>
                <input
                  id="draw-width"
                  type="range"
                  min={1}
                  max={100}
                  value={drawWidth}
                  onChange={(e) => setDrawWidth(Number(e.target.value))}
                  className="w-full accent-[var(--birthday-primary)]"
                />
              </div>

              <div>
                <label
                  htmlFor="draw-opacity"
                  className="mb-1 flex justify-between text-xs font-medium text-[var(--birthday-text)]"
                >
                  <span>ความโปร่งใส</span>
                  <span>{Math.round(drawOpacity * 100)}%</span>
                </label>
                <input
                  id="draw-opacity"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={drawOpacity}
                  onChange={(e) => setDrawOpacity(Number(e.target.value))}
                  className="w-full accent-[var(--birthday-primary)]"
                />
              </div>

              <ColorPickerPanel
                color={drawColor}
                onChange={setDrawColor}
                label="สีเส้นวาด"
              />

              <button
                type="button"
                onClick={() => setIsDrawingMode(false)}
                className="min-h-[44px] w-full rounded-lg border border-[var(--birthday-border)] text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
              >
                ออกจากโหมดวาด
              </button>
            </div>
          ) : !selectedElement ? (
            <p className="text-sm text-[var(--birthday-muted)]">
              แตะหรือคลิกที่องค์ประกอบบนการ์ดเพื่อแก้ไข
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedElement.eraserMask &&
                  selectedElement.eraserMask.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selectedElement.id, { eraserMask: [] })
                      }
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--birthday-primary)] px-3 text-xs font-medium text-[var(--birthday-primary)] hover:bg-[var(--birthday-soft)]"
                    >
                      ล้างรอยยางลบ
                    </button>
                  )}
                <button
                  type="button"
                  onClick={duplicateSelected}
                  aria-label="ทำซ้ำ"
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--birthday-border)] px-3 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
                >
                  <Copy size={16} strokeWidth={1.5} />
                  <span>ทำซ้ำ</span>
                </button>
                <button
                  type="button"
                  onClick={() => moveLayer("up")}
                  aria-label="เลื่อนขึ้น"
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--birthday-border)] px-3 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
                >
                  <ArrowUp size={16} strokeWidth={1.5} />
                  <span>ขึ้น</span>
                </button>
                <button
                  type="button"
                  onClick={() => moveLayer("down")}
                  aria-label="เลื่อนลง"
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--birthday-border)] px-3 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
                >
                  <ArrowDown size={16} strokeWidth={1.5} />
                  <span>ลง</span>
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  aria-label="ลบองค์ประกอบ"
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--birthday-error)]/40 px-3 text-xs font-medium text-[var(--birthday-error)] hover:bg-[var(--birthday-soft)]"
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                  <span>ลบ</span>
                </button>
              </div>

              {selectedElement.type === "shape" && (
                <div className="space-y-3 border-t border-[var(--birthday-border)] pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="shape-fill"
                        className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                      >
                        สีเติม
                      </label>
                      <input
                        id="shape-fill"
                        type="color"
                        value={selectedElement.fill}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            fill: e.target.value,
                          })
                        }
                        className="min-h-[44px] w-full rounded-lg border border-[var(--birthday-border)] p-1"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="shape-stroke"
                        className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                      >
                        สีเส้นขอบ
                      </label>
                      <input
                        id="shape-stroke"
                        type="color"
                        value={selectedElement.stroke ?? "#3B2A26"}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            stroke: e.target.value,
                          })
                        }
                        className="min-h-[44px] w-full rounded-lg border border-[var(--birthday-border)] p-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="shape-stroke-w"
                      className="mb-1 flex justify-between text-xs font-medium text-[var(--birthday-text)]"
                    >
                      <span>ความหนาขอบ</span>
                      <span>{selectedElement.strokeWidth ?? 0} px</span>
                    </label>
                    <input
                      id="shape-stroke-w"
                      type="range"
                      min={0}
                      max={20}
                      value={selectedElement.strokeWidth ?? 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          strokeWidth: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[var(--birthday-primary)]"
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === "gif" && (
                <div className="space-y-3 border-t border-[var(--birthday-border)] pt-3">
                  <div>
                    <label
                      htmlFor="prop-gif-alt"
                      className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                    >
                      คำอธิบายภาพ (Alt text)
                    </label>
                    <input
                      id="prop-gif-alt"
                      type="text"
                      value={selectedElement.alt}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          alt: e.target.value,
                        })
                      }
                      className="min-h-[44px] w-full rounded-lg border border-[var(--birthday-border)] px-3 text-sm text-[var(--birthday-text)]"
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === "text" && (
                <div className="space-y-3 border-t border-[var(--birthday-border)] pt-3">
                  <div>
                    <label
                      htmlFor="prop-text"
                      className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                    >
                      ข้อความ
                    </label>
                    <textarea
                      id="prop-text"
                      rows={3}
                      value={selectedElement.text}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { text: e.target.value })
                      }
                      className="w-full rounded-lg border border-[var(--birthday-border)] px-3 py-2 text-sm text-[var(--birthday-text)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prop-font"
                      className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                    >
                      ฟอนต์ภาษาไทย
                    </label>
                    <select
                      id="prop-font"
                      value={selectedElement.fontFamily}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          fontFamily: e.target.value,
                        })
                      }
                      className="min-h-[44px] w-full rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)]"
                    >
                      {THAI_FONTS.map((f) => (
                        <option key={f.label} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="prop-size"
                        className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                      >
                        ขนาดตัวอักษร
                      </label>
                      <input
                        id="prop-size"
                        type="number"
                        min={14}
                        max={120}
                        value={selectedElement.fontSize}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            fontSize: Number(e.target.value) || 24,
                          })
                        }
                        className="min-h-[44px] w-full rounded-lg border border-[var(--birthday-border)] px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="prop-color"
                        className="mb-1 block text-xs font-medium text-[var(--birthday-text)]"
                      >
                        สีตัวอักษร
                      </label>
                      <input
                        id="prop-color"
                        type="color"
                        value={selectedElement.fill}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            fill: e.target.value,
                          })
                        }
                        className="min-h-[44px] w-full rounded-lg border border-[var(--birthday-border)] p-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          fontStyle:
                            selectedElement.fontStyle === "bold"
                              ? "normal"
                              : "bold",
                        } as Partial<TextElement>)
                      }
                      className="min-h-[44px] flex-1 rounded-lg border border-[var(--birthday-border)] text-xs font-semibold"
                    >
                      ตัวหนา
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          align:
                            selectedElement.align === "center"
                              ? "left"
                              : selectedElement.align === "left"
                                ? "right"
                                : "center",
                        })
                      }
                      className="min-h-[44px] flex-1 rounded-lg border border-[var(--birthday-border)] text-xs font-medium"
                    >
                      จัดแนว: {selectedElement.align}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
