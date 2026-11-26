/**
 * ตรวจสอบสิทธิ์แอดมินจากอีเมล (ADMIN_EMAILS ใน env) หรือ app_metadata.role === 'admin'
 * ใช้ฝั่ง server เท่านั้น
 */
export function isAdminUser(
  email?: string | null,
  appMetadata?: Record<string, unknown> | null
): boolean {
  if (appMetadata?.role === "admin") {
    return true;
  }

  const rawAdmins = process.env.ADMIN_EMAILS ?? "";
  const adminList = rawAdmins
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (adminList.length === 0) {
    // Fallback: หากยังไม่ตั้งค่า ADMIN_EMAILS ให้ถือว่าผู้ที่ล็อกอินด้วยรหัสผ่านในระบบเดิมมีสิทธิ์เฉพาะเมื่อตั้งค่าไว้
    // เพื่อความปลอดภัย แนะนำให้ตั้งค่า ADMIN_EMAILS ใน .env.local และ Vercel เสมอ
    return false;
  }

  if (!email) {
    return false;
  }

  return adminList.includes(email.trim().toLowerCase());
}
