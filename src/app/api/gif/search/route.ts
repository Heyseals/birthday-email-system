import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า GIPHY_API_KEY บนเซิร์ฟเวอร์" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "birthday";
  const offset = Math.max(0, Number(searchParams.get("offset") || "0") || 0);
  const limit = 12;

  try {
    const url = new URL("https://api.giphy.com/v1/gifs/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("rating", "g");
    url.searchParams.set("lang", "th");

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "ไม่สามารถดึงข้อมูลจากคลัง GIF ได้" },
        { status: 502 }
      );
    }

    const json = (await res.json()) as {
      data?: Array<{
        id: string;
        title: string;
        images?: {
          fixed_width?: { url: string; width: string; height: string };
          downsized?: { url: string; width: string; height: string };
        };
      }>;
    };

    const items = (json.data ?? []).map((item) => ({
      id: item.id,
      title: item.title || "GIF อวยพรวันเกิด",
      previewUrl: item.images?.fixed_width?.url ?? "",
      url: item.images?.downsized?.url ?? item.images?.fixed_width?.url ?? "",
      width: Number(item.images?.fixed_width?.width ?? 200) || 200,
      height: Number(item.images?.fixed_width?.height ?? 200) || 200,
    }));

    return NextResponse.json({ items, nextOffset: offset + items.length });
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเชื่อมต่อคลัง GIF" },
      { status: 500 }
    );
  }
}
