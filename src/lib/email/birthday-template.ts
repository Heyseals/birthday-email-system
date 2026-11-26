function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface BirthdayEmailInput {
  fullName: string;
  unsubscribeUrl: string;
  isTest?: boolean;
  cardImageUrl?: string | null;
  customMessage?: string | null;
  senderName?: string | null;
}

export interface BirthdayEmailContent {
  subject: string;
  html: string;
  text: string;
}

export function buildBirthdayEmail({
  fullName,
  unsubscribeUrl,
  isTest = false,
  cardImageUrl,
  customMessage,
  senderName,
}: BirthdayEmailInput): BirthdayEmailContent {
  const safeName = escapeHtml(fullName);
  const safeUrl = escapeHtml(unsubscribeUrl);
  const safeCardUrl = cardImageUrl ? escapeHtml(cardImageUrl) : null;
  const safeCustomMessage = customMessage?.trim()
    ? escapeHtml(customMessage.trim()).replace(/\n/g, "<br />")
    : null;
  const safeSenderName = senderName?.trim() ? escapeHtml(senderName.trim()) : null;
  const prefix = isTest ? "[TEST] " : "";
  const subject = safeSenderName
    ? `${prefix}สุขสันต์วันเกิดคุณ ${fullName} จาก ${senderName!.trim()}`
    : `${prefix}สุขสันต์วันเกิดคุณ ${fullName}`;

  const testBannerHtml = isTest
    ? `<div style="margin-bottom:16px;padding:10px 14px;border-radius:8px;background-color:#fef3c7;border:1px solid #f59e0b;color:#92400e;font-size:13px;font-weight:600;">
        โหมดทดสอบ (TEST MODE) — อีเมลนี้ถูกส่งเพื่อทดสอบระบบเท่านั้น
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans Thai',sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#18181b 0%,#3f3f46 100%);padding:28px 28px 24px;color:#ffffff;text-align:center;">
                <h1 style="margin:0;font-size:22px;font-weight:700;line-height:1.4;">
                  สุขสันต์วันเกิดครับ/ค่ะ
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${testBannerHtml}
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">
                  สวัสดีคุณ <strong>${safeName}</strong>,
                </p>
                ${
                  safeCardUrl
                    ? `<div style="margin:0 0 20px;text-align:center;">
                        <img src="${safeCardUrl}" alt="การ์ดอวยพรวันเกิด" style="display:block;width:100%;max-width:500px;height:auto;margin:0 auto;border-radius:12px;border:1px solid #e4e4e7;" />
                      </div>`
                    : ""
                }
                ${
                  safeCustomMessage
                    ? `<div style="margin:0 0 18px;padding:16px;border-radius:10px;background-color:#FFF8EE;border:1px solid #E8D9C8;font-size:15px;line-height:1.7;color:#3B2A26;">
                        ${safeCustomMessage}
                      </div>`
                    : ""
                }
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#3f3f46;">
                  เนื่องในโอกาสวันคล้ายวันเกิดของคุณ ขอส่งความปรารถนาดีให้คุณมีสุขภาพแข็งแรง มีความสุข สมหวังในทุกสิ่งที่ตั้งใจ และพบเจอแต่สิ่งดีๆ ตลอดทั้งปีครับ/ค่ะ
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#3f3f46;">
                  ขอบคุณที่ไว้วางใจและอยู่เคียงข้างกันเสมอมา
                </p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;">
                  ด้วยความปรารถนาดี,<br />
                  ${safeSenderName ? safeSenderName : "ทีมงานระบบอวยพรวันเกิดอัตโนมัติ"}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background-color:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#71717a;">
                  คุณได้รับอีเมลนี้เนื่องจากได้ให้ความยินยอมรับข่าวสารและคำอวยพรวันเกิด
                </p>
                <p style="margin:0;font-size:12px;">
                  <a href="${safeUrl}" style="color:#52525b;text-decoration:underline;">
                    ยกเลิกการรับอีเมลอวยพร (Unsubscribe)
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    isTest ? "[TEST MODE] อีเมลนี้ถูกส่งเพื่อทดสอบระบบเท่านั้น\n" : "",
    `สวัสดีคุณ ${fullName},`,
    "",
    "สุขสันต์วันเกิด! ขอให้คุณมีสุขภาพแข็งแรง มีความสุข และสมหวังในทุกสิ่งที่ตั้งใจตลอดทั้งปี",
    "ขอบคุณที่ไว้วางใจและอยู่เคียงข้างกันเสมอมา",
    "",
    "ด้วยความปรารถนาดี,",
    "ทีมงานระบบอวยพรวันเกิดอัตโนมัติ",
    "",
    `หากไม่ต้องการรับอีเมลอวยพรอีกต่อไป กดยกเลิกได้ที่: ${unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
