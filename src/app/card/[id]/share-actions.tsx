"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function ShareCardActions({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E8D9C8] bg-white px-4 py-2 text-sm font-medium text-[#3B2A26] transition-colors hover:bg-[#FFF8EE]"
    >
      {copied ? (
        <>
          <Check size={16} className="text-emerald-600" />
          <span>คัดลอกลิงก์แชร์แล้ว</span>
        </>
      ) : (
        <>
          <Copy size={16} />
          <span>คัดลอกลิงก์แชร์</span>
        </>
      )}
    </button>
  );
}
