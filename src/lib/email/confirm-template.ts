function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ConfirmEmailInput {
  fullName: string;
  confirmUrl: string;
  expiresInHours?: number;
}

export interface ConfirmEmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * สร้างเนื้อหาอีเมลยืนยันการลงทะเบียนวันเกิด (Double Opt-in)
 */
export function buildConfirmEmail({
  fullName,
  confirmUrl,
  expiresInHours = 24,
}: ConfirmEmailInput): ConfirmEmailContent {
  const safeName = escapeHtml(fullName);
  const safeUrl = escapeHtml(confirmUrl);
  const subject = "ยืนยันการลงทะเบียนรับอีเมลอวยพรวันเกิด 🎂";

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
                <div style="font-size:36px;line-height:1;">✉️</div>
                <h1 style="margin:12px 0 0;font-size:21px;font-weight:700;line-height:1.4;">
                  ยืนยันอีเมลของคุณ
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;">
                  สวัสดีคุณ <strong>${safeName}</strong>,
                </p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#3f3f46;">
                  ขอบคุณที่ลงทะเบียนรับคำอวยพรวันเกิดกับเรา กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณให้สมบูรณ์:
                </p>
                <p style="margin:0 0 22px;text-align:center;">
                  <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;border-radius:10px;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                    ยืนยันการลงทะเบียน
                  </a>
                </p>
                <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#52525b;">
                  ลิงก์นี้มีอายุใช้งาน ${expiresInHours} ชั่วโมง หากคุณไม่ได้เป็นผู้ลงทะเบียน สามารถเพิกเฉยต่ออีเมลนี้ได้ทันที
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;word-break:break-all;">
                  หากปุ่มใช้งานไม่ได้ สามารถคัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br />
                  <a href="${safeUrl}" style="color:#52525b;">${safeUrl}</a>
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
    `สวัสดีคุณ ${fullName},`,
    "",
    "ขอบคุณที่ลงทะเบียนรับคำอวยพรวันเกิดกับเรา",
    `กรุณาเปิดลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ (ลิงก์มีอายุ ${expiresInHours} ชั่วโมง):`,
    confirmUrl,
    "",
    "หากคุณไม่ได้เป็นผู้ลงทะเบียน สามารถเพิกเฉยต่ออีเมลนี้ได้",
  ].join("\n");

  return { subject, html, text };
}
