export interface SendLineBirthdayInput {
  lineUserId: string;
  fullName: string;
  customMessage?: string | null;
  senderName?: string | null;
  cardImageUrl?: string | null;
}

export async function sendLineBirthdayMessage({
  lineUserId,
  fullName,
  customMessage,
  senderName,
  cardImageUrl,
}: SendLineBirthdayInput): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ok: true, skipped: true };
  }

  const trimmedUserId = lineUserId.trim();
  if (!trimmedUserId) {
    return { ok: true, skipped: true };
  }

  const lines = [`🎂 สุขสันต์วันเกิดคุณ ${fullName}!`];
  if (customMessage?.trim()) {
    lines.push("", customMessage.trim());
  }
  if (senderName?.trim()) {
    lines.push("", `จาก: ${senderName.trim()}`);
  }

  const messages: Array<Record<string, unknown>> = [];
  if (cardImageUrl && cardImageUrl.startsWith("https://")) {
    messages.push({
      type: "image",
      originalContentUrl: cardImageUrl,
      previewImageUrl: cardImageUrl,
    });
  }
  messages.push({
    type: "text",
    text: lines.join("\n"),
  });

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: trimmedUserId,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `LINE API ${res.status}: ${errText}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "LINE push failed",
    };
  }
}
