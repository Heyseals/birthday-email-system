import assert from "node:assert/strict";
import {
  getBangkokDateOffset,
  getBangkokToday,
  isBirthdayToday,
  isConfirmTokenExpired,
  isLeapYear,
} from "../birthday";

// 1. ทดสอบการคำนวณวันเกิดตามเวลา Asia/Bangkok
{
  // 2026-05-10 20:00 UTC = 2026-05-11 03:00 Asia/Bangkok
  const utcLate = new Date("2026-05-10T20:00:00Z");
  const bkk = getBangkokToday(utcLate);
  assert.equal(bkk.year, 2026);
  assert.equal(bkk.month, 5);
  assert.equal(bkk.day, 11);
  assert.equal(isBirthdayToday(5, 11, bkk), true);
  assert.equal(isBirthdayToday(5, 10, bkk), false);
}

// 2. ทดสอบเคส 29 ก.พ. (วันเกิดจริง และแจ้งเตือนล่วงหน้า 3 วัน)
{
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2026), false);

  // ปีปกติ (2026): วันที่ 28 ก.พ. ต้องตรงกับคนที่เกิด 29 ก.พ.
  const feb28NonLeap = { year: 2026, month: 2, day: 28 };
  assert.equal(isBirthdayToday(2, 29, feb28NonLeap), true);

  // ปีอธิกสุรทิน (2024): วันที่ 28 ก.พ. ไม่ควรส่งให้คนเกิด 29 ก.พ. (รอส่งวันที่ 29 ก.พ.)
  const feb28Leap = { year: 2024, month: 2, day: 28 };
  assert.equal(isBirthdayToday(2, 29, feb28Leap), false);

  // แจ้งเตือนล่วงหน้า 3 วัน: 25 ก.พ. 2026 + 3 วัน = 28 ก.พ. 2026
  const feb25 = new Date("2026-02-25T01:00:00Z"); // 08:00 BKK
  const plus3 = getBangkokDateOffset(3, feb25);
  assert.equal(plus3.month, 2);
  assert.equal(plus3.day, 28);
  assert.equal(isBirthdayToday(2, 29, plus3), true);
}

// 3. ทดสอบ Token หมดอายุ
{
  const now = new Date("2026-06-01T12:00:00Z");
  assert.equal(isConfirmTokenExpired(null, now), true);
  assert.equal(isConfirmTokenExpired("invalid-date", now), true);
  assert.equal(isConfirmTokenExpired("2026-06-01T11:59:59Z", now), true);
  assert.equal(isConfirmTokenExpired("2026-06-01T12:00:01Z", now), false);
}

// 4. ทดสอบการกันส่งซ้ำ (Unique key logic)
{
  const sentSet = new Set<string>();
  const key = (customerId: string, year: number) => `${customerId}:${year}`;
  assert.equal(sentSet.has(key("c1", 2026)), false);
  sentSet.add(key("c1", 2026));
  assert.equal(sentSet.has(key("c1", 2026)), true);
  assert.equal(sentSet.has(key("c1", 2027)), false);
}

console.log("All Phase 5 birthday tests passed!");
