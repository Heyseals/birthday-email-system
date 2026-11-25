import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const BUCKET_NAME = "birthday-images";

function detectImageMime(
  bytes: Uint8Array
): "image/jpeg" | "image/png" | "image/webp" | "image/gif" | null {
  // GIF: GIF87a or GIF89a
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function getExtension(
  mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
  }
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimitResult = await checkRateLimit(`upload:${ip}`, 10, 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "อัปโหลดรูปภาพบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์รูปภาพที่อัปโหลด" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "ไฟล์รูปภาพว่างเปล่า" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ขนาดไฟล์เกิน 15 MB กรุณาเลือกรูปที่เล็กกว่านี้" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const detectedMime = detectImageMime(bytes);

    if (!detectedMime) {
      return NextResponse.json(
        { error: "ชนิดไฟล์ไม่รองรับ รองรับเฉพาะ JPG, PNG และ WebP เท่านั้น" },
        { status: 400 }
      );
    }

    const ext = getExtension(detectedMime);
    const filePath = `greetings/${crypto.randomUUID()}.${ext}`;

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: detectedMime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filePath,
    });
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: unknown };
    const path = typeof body.path === "string" ? body.path.trim() : "";

    if (!path || !path.startsWith("greetings/") || path.includes("..")) {
      return NextResponse.json(
        { error: "ตำแหน่งไฟล์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    await supabase.storage.from(BUCKET_NAME).remove([path]);

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถลบรูปภาพได้" },
      { status: 500 }
    );
  }
}
