import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const saveCardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อการ์ด")
    .max(100, "ชื่อการ์ดต้องไม่เกิน 100 ตัวอักษร"),
  canvas_json: z.record(z.string(), z.unknown()),
  is_public: z.boolean().default(false),
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  const cardId = request.nextUrl.searchParams.get("id")?.trim();
  const supabase = createAdminClient();

  if (cardId) {
    const { data, error } = await supabase
      .from("cards")
      .select("id, title, canvas_json, image_path, is_public, created_at, updated_at")
      .eq("id", cardId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "ไม่พบการ์ดที่ต้องการ" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, card: data });
  }

  const { data, error } = await supabase
    .from("cards")
    .select("id, title, canvas_json, image_path, is_public, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json(
      { error: "ไม่สามารถโหลดรายการการ์ดได้" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, cards: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`cards:create:${ip}`, 10, 15 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "สร้างการ์ดบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง" },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const rawTitle = String(formData.get("title") ?? "");
  const rawCanvasJson = String(formData.get("canvas_json") ?? "{}");
  const rawIsPublic = formData.get("is_public") === "true";
  const imageFile = formData.get("image");

  let parsedCanvas: Record<string, unknown>;
  try {
    parsedCanvas = JSON.parse(rawCanvasJson) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "ข้อมูล canvas_json ไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const parsed = saveCardSchema.safeParse({
    title: rawTitle,
    canvas_json: parsedCanvas,
    is_public: rawIsPublic,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลการ์ดไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  let imagePath: string | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "ไฟล์รูปการ์ดต้องมีขนาดไม่เกิน 5 MB" },
        { status: 400 }
      );
    }

    const filePath = `templates/${randomUUID()}.png`;
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("cards")
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[cards] upload error:", uploadError.message);
      return NextResponse.json(
        { error: "ไม่สามารถอัปโหลดรูปการ์ดได้" },
        { status: 502 }
      );
    }
    imagePath = filePath;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("cards")
    .insert({
      title: parsed.data.title,
      canvas_json: parsed.data.canvas_json,
      image_path: imagePath,
      is_public: parsed.data.is_public,
    })
    .select("id, title, image_path, is_public, created_at")
    .single();

  if (insertError) {
    console.error("[cards] insert error:", insertError.message);
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกการ์ดได้" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, card: inserted });
}
