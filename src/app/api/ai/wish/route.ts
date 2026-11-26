import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const wishSchema = z.object({
  tone: z.enum(["เป็นทางการ", "สนุก", "ซึ้ง"]),
  relationship: z.enum(["เพื่อน", "ครอบครัว", "ที่ทำงาน", "คนรัก"]),
  recipientName: z.string().trim().max(80).optional(),
  language: z.enum(["th", "en"]).default("th"),
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function getFallbackWishes(
  tone: "เป็นทางการ" | "สนุก" | "ซึ้ง",
  relationship: "เพื่อน" | "ครอบครัว" | "ที่ทำงาน" | "คนรัก",
  language: "th" | "en"
): string[] {
  if (language === "en") {
    if (tone === "เป็นทางการ") {
      return [
        "Wishing you a very Happy Birthday, {ชื่อ}! May this year bring you continued success, good health, and happiness.",
        "Happy Birthday, {ชื่อ}. May every endeavor you pursue this year be met with achievement and joy.",
        "Warmest birthday wishes to {ชื่อ}. Wishing you prosperity, health, and wonderful moments ahead.",
      ];
    }
    if (tone === "สนุก") {
      return [
        "Happy Birthday, {ชื่อ}! Hope your day is packed with cake, laughs, and zero calories!",
        "Cheers to another awesome year, {ชื่อ}! Let's celebrate big today!",
        "HBD {ชื่อ}! Wishing you endless fun, good vibes, and unforgettable memories this year!",
      ];
    }
    return [
      "Happy Birthday, {ชื่อ}. Thank you for bringing so much warmth and kindness into our lives.",
      "Wishing the happiest of birthdays to {ชื่อ}. May your heart always be full of peace and love.",
      "Happy Birthday, {ชื่อ}. Grateful for every moment shared with you—may this year be your brightest yet.",
    ];
  }

  if (tone === "เป็นทางการ") {
    return [
      "เนื่องในโอกาสวันคล้ายวันเกิดของ {ชื่อ} ขออำนาจคุณพระศรีรัตนตรัยดลบันดาลให้มีสุขภาพแข็งแรง ประสบความสำเร็จในทุกด้านตลอดปีครับ/ค่ะ",
      "สุขสันต์วันเกิดคุณ {ชื่อ} ขอให้มีความสุข ความเจริญก้าวหน้า และสมหวังในสิ่งที่ตั้งใจทุกประการ",
      "ในวาระดิถีคล้ายวันเกิดของคุณ {ชื่อ} ขอส่งความปรารถนาดีให้มีพลานามัยสมบูรณ์แข็งแรงและพบเจอแต่ความสุขความเจริญ",
    ];
  }
  if (tone === "สนุก") {
    return [
      "สุขสันต์วันเกิดนะ {ชื่อ}! ปีนี้ขอให้ปังๆ เฮงๆ งานไม่หนัก เงินเข้าไม่หยุด กินเท่าไหร่ก็ไม่อ้วน!",
      "HBD นะ {ชื่อ}! ขอให้วันนี้มีแต่รอยยิ้ม เสียงหัวเราะ และของขวัญเต็มมือเลยนะ!",
      "วันเกิดปีนี้ของ {ชื่อ} ขอให้แฮปปี้สุดๆ สมหวังทุกเรื่องที่แอบเล็งไว้เลยนะ!",
    ];
  }

  const relText =
    relationship === "คนรัก"
      ? "ขอบคุณที่อยู่เคียงข้างกันเสมอมา"
      : relationship === "ครอบครัว"
      ? "รักและห่วงใยเสมอ"
      : "ขอบคุณสำหรับมิตรภาพดีๆ ที่มีให้กัน";

  return [
    `สุขสันต์วันเกิดนะ {ชื่อ} ${relText} ขอให้ทุกวันต่อจากนี้มีแต่ความอบอุ่นและรอยยิ้ม`,
    "ขอให้วันเกิดปีนี้เป็นจุดเริ่มต้นของเรื่องราวดีๆ สำหรับ {ชื่อ} ขอให้มีสุขภาพแข็งแรงและใจที่เป็นสุขเสมอ",
    "สุขสันต์วันเกิด {ชื่อ} ดีใจที่ได้รู้จักและมีช่วงเวลาดีๆ ร่วมกัน ขอให้ปีนี้ใจดีกับเธอมากๆ นะ",
  ];
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(`ai:wish:${ip}`, 15, 15 * 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "เรียกใช้งานบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const parsed = wishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const { tone, relationship, recipientName, language } = parsed.data;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      source: "fallback",
      wishes: getFallbackWishes(tone, relationship, language),
    });
  }

  const prompt = `สร้างคำอวยพรวันเกิด 3 แบบที่แตกต่างกัน
- โทน: ${tone}
- ความสัมพันธ์: ${relationship}
- ชื่อผู้รับ: ${recipientName || "ไม่ระบุ"}
- ภาษา: ${language === "en" ? "English" : "ภาษาไทย"}
- ข้อกำหนด: ทุกแบบต้องมีตัวแปร {ชื่อ} อยู่ในข้อความ และตอบกลับเป็น JSON array ของ string 3 รายการเท่านั้น เช่น ["...", "...", "..."]`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        ok: true,
        source: "fallback",
        wishes: getFallbackWishes(tone, relationship, language),
      });
    }

    const json = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsedWishes = JSON.parse(rawText) as unknown;

    if (
      Array.isArray(parsedWishes) &&
      parsedWishes.length > 0 &&
      parsedWishes.every((item) => typeof item === "string" && item.trim().length > 0)
    ) {
      return NextResponse.json({
        ok: true,
        source: "gemini",
        wishes: parsedWishes.slice(0, 3),
      });
    }
  } catch {
    // Fallback gracefully on timeout or parse error
  }

  return NextResponse.json({
    ok: true,
    source: "fallback",
    wishes: getFallbackWishes(tone, relationship, language),
  });
}
