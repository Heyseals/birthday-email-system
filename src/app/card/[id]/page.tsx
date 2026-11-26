import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cake, Sparkles } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBuntingBar } from "@/components/public-shell";
import { ShareCardActions } from "./share-actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getPublicCard(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, title, image_path, is_public, created_at")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data;
}

function getCardImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/cards/${imagePath}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getPublicCard(id);

  if (!card) {
    return {
      title: "ไม่พบการ์ดอวยพรวันเกิด",
    };
  }

  const imageUrl = getCardImageUrl(card.image_path);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pageUrl = `${siteUrl}/card/${card.id}`;
  const description = `การ์ดอวยพรวันเกิด "${card.title}" — ใช้การ์ดนี้ส่งต่อความสุขให้คนพิเศษของคุณ`;

  return {
    title: `${card.title} | การ์ดอวยพรวันเกิด`,
    description,
    openGraph: {
      title: card.title,
      description,
      url: pageUrl,
      type: "website",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 800,
              height: 1000,
              alt: card.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: card.title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

async function PublicCardContent({ params }: PageProps) {
  const { id } = await params;
  const card = await getPublicCard(id);

  if (!card) {
    notFound();
  }

  const imageUrl = getCardImageUrl(card.image_path);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shareUrl = `${siteUrl}/card/${card.id}`;

  return (
    <div className="space-y-6 rounded-2xl border border-[#E8D9C8] bg-white p-6 shadow-sm sm:p-8">
      <div className="text-center space-y-1.5">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8EE] px-3 py-1 text-xs font-medium text-[#D97724]">
          <Sparkles size={13} />
          <span>การ์ดอวยพรวันเกิดสาธารณะ</span>
        </p>
        <h1 className="text-2xl font-bold text-[#3B2A26]">{card.title}</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8D9C8] bg-[#FFF8EE]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.title}
            className="mx-auto max-h-[540px] w-auto object-contain"
          />
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-[#7A635D]">
            ไม่มีภาพตัวอย่างของการ์ดนี้
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Link
          href={`/join?cardId=${card.id}`}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#D97724] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B85E16]"
        >
          <Cake size={17} />
          <span>ใช้การ์ดนี้ส่งอวยพรวันเกิด</span>
        </Link>

        <ShareCardActions shareUrl={shareUrl} />

        <Link
          href="/create"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#E8D9C8] bg-[#FFF8EE] px-4 py-2 text-sm font-medium text-[#3B2A26] transition-colors hover:bg-[#F5E9D9]"
        >
          สร้างการ์ดของคุณเอง
        </Link>
      </div>
    </div>
  );
}

export default function PublicCardPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#3B2A26]">
      <TopBuntingBar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[#E8D9C8] bg-white p-8 text-center text-sm text-[#7A635D]">
              กำลังโหลดการ์ด...
            </div>
          }
        >
          <PublicCardContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}
