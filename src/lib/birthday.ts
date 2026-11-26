export interface BangkokDate {
  year: number;
  month: number;
  day: number;
}

/**
 * คืนค่าวันที่ปัจจุบันตามเขตเวลา Asia/Bangkok (GMT+7)
 */
export function getBangkokToday(now: Date = new Date()): BangkokDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return { year, month, day };
}

/**
 * ตรวจสอบว่าปี ค.ศ. นั้นเป็นปีอธิกสุรทิน (Leap Year) หรือไม่
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * ตรวจสอบว่าวันเกิด (birthMonth, birthDay) ตรงกับวันที่ปัจจุบันในเวลาไทยหรือไม่
 * กรณีเกิด 29 ก.พ. ในปีที่ไม่ใช่ปีอธิกสุรทิน ให้ตรงกับวันที่ 28 ก.พ.
 */
export function isBirthdayToday(
  birthMonth: number,
  birthDay: number,
  today: BangkokDate
): boolean {
  if (birthMonth === today.month && birthDay === today.day) {
    return true;
  }

  if (
    birthMonth === 2 &&
    birthDay === 29 &&
    today.month === 2 &&
    today.day === 28 &&
    !isLeapYear(today.year)
  ) {
    return true;
  }

  return false;
}

/**
 * ตรวจสอบว่า confirm_token หมดอายุหรือยัง
 */
export function isConfirmTokenExpired(
  expiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return true;
  const expiresMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresMs)) return true;
  return expiresMs <= now.getTime();
}
