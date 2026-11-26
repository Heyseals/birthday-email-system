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
  unsubscribeUrl?: string;
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
  unsubscribeUrl,
  expiresInHours = 24,
}: ConfirmEmailInput): ConfirmEmailContent {
  const safeName = escapeHtml(fullName);
  const safeUrl = escapeHtml(confirmUrl);
  const safeUnsubscribeUrl = unsubscribeUrl ? escapeHtml(unsubscribeUrl) : null;
  const subject = "ยืนยันการลงทะเบียนรับอีเมลอวยพรวันเกิด";

  const html = `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#FFF8EE;font-family:'Noto Sans Thai','Sukhumvit Set','Thonburi','Leelawadee UI',Tahoma,Arial,sans-serif;color:#3B2A26;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFF8EE;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#FFFFFF;border-radius:12px;border:1px solid #E8D9C8;overflow:hidden;">
            <tr>
              <td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="25%" height="6" style="background-color:#C8421F;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="25%" height="6" style="background-color:#F2B632;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="25%" height="6" style="background-color:#FBE3DC;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="25%" height="6" style="background-color:#1F7A6D;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 28px 8px;">
                <h1 style="margin:0;font-size:20px;font-weight:600;line-height:1.4;color:#3B2A26;">
                  ยืนยันอีเมลของคุณ
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 28px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#3B2A26;">
                  สวัสดีคุณ <strong>${safeName}</strong>
                </p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#3B2A26;">
                  ขอบคุณที่ลงทะเบียนรับคำอวยพรวันเกิดกับเรา กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณให้เรียบร้อย
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                  <tr>
                    <td align="center" bgcolor="#C8421F" style="border-radius:8px;">
                      <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">
                        ยืนยันอีเมล
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#6B5750;">
                  ลิงก์นี้มีอายุใช้งาน ${expiresInHours} ชั่วโมง หากคุณไม่ได้เป็นผู้ลงทะเบียน สามารถเพิกเฉยต่ออีเมลนี้ได้
                </p>
                <p style="margin:0;padding-top:14px;border-top:1px solid #E8D9C8;font-size:12px;line-height:1.6;color:#6B5750;word-break:break-all;">
                  หากปุ่มใช้งานไม่ได้ กรุณาคัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br />
                  <a href="${safeUrl}" style="color:#C8421F;text-decoration:underline;">${safeUrl}</a>
                </p>
                ${
                  safeUnsubscribeUrl
                    ? `<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#6B5750;">หากไม่ต้องการรับอีเมลจากเราอีก สามารถ <a href="${safeUnsubscribeUrl}" style="color:#6B5750;text-decoration:underline;">ยกเลิกการรับอีเมลได้ที่นี่</a></p>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `สวัสดีคุณ ${fullName}`,
    "",
    "ขอบคุณที่ลงทะเบียนรับคำอวยพรวันเกิดกับเรา",
    `กรุณาเปิดลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ (ลิงก์มีอายุ ${expiresInHours} ชั่วโมง):`,
    confirmUrl,
    "",
    "หากคุณไม่ได้เป็นผู้ลงทะเบียน สามารถเพิกเฉยต่ออีเมลนี้ได้",
  ].join("\n");

  return { subject, html, text };
}
