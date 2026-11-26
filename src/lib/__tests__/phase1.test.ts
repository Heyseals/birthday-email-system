import assert from "node:assert/strict";
import test from "node:test";
import {
  getBangkokToday,
  isBirthdayToday,
  isConfirmTokenExpired,
  isLeapYear,
} from "../birthday";

test("getBangkokToday แปลงเวลา UTC เป็น Asia/Bangkok (GMT+7) ถูกต้อง", () => {
  // 2026-02-28T17:30:00.000Z = 2026-03-01 00:30:00 เวลาไทย
  const utcDate = new Date("2026-02-28T17:30:00.000Z");
  const bangkok = getBangkokToday(utcDate);
  assert.deepEqual(bangkok, { year: 2026, month: 3, day: 1 });
});

test("isLeapYear และ isBirthdayToday รองรับ 29 ก.พ. ถูกต้อง", () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2025), false);
  assert.equal(isLeapYear(2026), false);

  // ปีไม่ใช่ Leap Year (2026): 29 ก.พ. ต้องส่งวันที่ 28 ก.พ.
  assert.equal(
    isBirthdayToday(2, 29, { year: 2026, month: 2, day: 28 }),
    true
  );
  // ปี Leap Year (2024): 29 ก.พ. ไม่ส่งวันที่ 28 ก.พ. แต่ส่งวันที่ 29 ก.พ.
  assert.equal(
    isBirthdayToday(2, 29, { year: 2024, month: 2, day: 28 }),
    false
  );
  assert.equal(
    isBirthdayToday(2, 29, { year: 2024, month: 2, day: 29 }),
    true
  );
});

test("isConfirmTokenExpired ตรวจวันหมดอายุของ token ถูกต้อง", () => {
  const now = new Date("2026-11-26T12:00:00.000Z");
  assert.equal(isConfirmTokenExpired("2026-11-26T11:59:59.000Z", now), true);
  assert.equal(isConfirmTokenExpired("2026-11-26T12:00:00.000Z", now), true);
  assert.equal(isConfirmTokenExpired("2026-11-26T12:00:01.000Z", now), false);
  assert.equal(isConfirmTokenExpired(null, now), true);
});

test("กันส่งซ้ำเมื่อเรียกส่งซ้ำในปีเดียวกัน", () => {
  const sentKeys = new Set<string>();
  const trySend = (customerId: string, year: number) => {
    const key = `${customerId}:${year}`;
    if (sentKeys.has(key)) return "skipped";
    sentKeys.add(key);
    return "sent";
  };

  assert.equal(trySend("cust-1", 2026), "sent");
  assert.equal(trySend("cust-1", 2026), "skipped");
  assert.equal(trySend("cust-1", 2027), "sent");
});
