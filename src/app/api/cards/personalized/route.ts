import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`cards:personalized:${ip}`, 15, 15 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "อัปโหลดรูปการ์ดบ่อยเกินไป กรุณารอสักครู่" },
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

  const imageFile = formData.get("image");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    return NextResponse.json(
      { error: "กรุณาแนบไฟล์รูปการ์ด" },
      { status: 400 }
    );
  }

  if (imageFile.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "ไฟล์รูปการ์ดต้องมีขนาดไม่เกิน 5 MB" },
      { status: 400 }
    );
  }

  const filePath = `personalized/${randomUUID()}.png`;
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from("cards")
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    console.error("[cards/personalized] upload error:", uploadError.message);
    return NextResponse.json(
      { error: "ไม่สามารถอัปโหลดรูปการ์ดเฉพาะบุคคลได้" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, path: filePath });
}
