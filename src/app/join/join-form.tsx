"use client";

import { useRef, useState } from "react";
import { THAI_MONTHS, getMaxDaysInMonth } from "@/types/database";

export function JoinForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [birthDay, setBirthDay] = useState<string>("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [website, setWebsite] = useState("");

  const [nameInvalid, setNameInvalid] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [monthInvalid, setMonthInvalid] = useState(false);
  const [dayInvalid, setDayInvalid] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLSelectElement>(null);
  const dayRef = useRef<HTMLSelectElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const selectedMonthNum = Number(birthMonth);
  const maxDays =
    Number.isInteger(selectedMonthNum) &&
    selectedMonthNum >= 1 &&
    selectedMonthNum <= 12
      ? getMaxDaysInMonth(selectedMonthNum)
      : 31;

  const isNameValid = (val: string) =>
    val.trim().length > 0 && val.trim().length <= 100;
  const isEmailValid = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleMonthChange = (value: string) => {
    setBirthMonth(value);
    setMonthInvalid(false);
    const nextMonth = Number(value);
    if (nextMonth >= 1 && nextMonth <= 12 && birthDay) {
      const nextMax = getMaxDaysInMonth(nextMonth);
      if (Number(birthDay) > nextMax) {
        setBirthDay("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const validName = isNameValid(fullName);
    const validEmail = isEmailValid(email);
    const validMonth =
      Number.isInteger(Number(birthMonth)) &&
      Number(birthMonth) >= 1 &&
      Number(birthMonth) <= 12;
    const validDay =
      Number.isInteger(Number(birthDay)) &&
      Number(birthDay) >= 1 &&
      Number(birthDay) <= maxDays;
    const validConsent = consentGiven === true;

    setNameInvalid(!validName);
    setEmailInvalid(!validEmail);
    setMonthInvalid(!validMonth);
    setDayInvalid(!validDay);
    setConsentInvalid(!validConsent);

    if (!validName) {
      nameRef.current?.focus();
      return;
    }
    if (!validEmail) {
      emailRef.current?.focus();
      return;
    }
    if (!validMonth) {
      monthRef.current?.focus();
      return;
    }
    if (!validDay) {
      dayRef.current?.focus();
      return;
    }
    if (!validConsent) {
      consentRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          birth_month: Number(birthMonth),
          birth_day: Number(birthDay),
          consent_given: consentGiven,
          website,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setServerError(
          data.error ?? "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง"
        );
        return;
      }

      setSuccessMessage(
        data.message ??
          "ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย"
      );
      setFullName("");
      setEmail("");
      setBirthMonth("");
      setBirthDay("");
      setConsentGiven(false);
    } catch {
      setServerError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-6 text-center"
      >
        <div className="mb-3 text-4xl" aria-hidden="true">
          📩
        </div>
        <h2 className="mb-2 text-lg font-bold text-emerald-300">
          ตรวจสอบอีเมลเพื่อยืนยันตัวตน
        </h2>
        <p className="text-sm leading-relaxed text-zinc-200">{successMessage}</p>
        <button
          type="button"
          onClick={() => setSuccessMessage(null)}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          ลงทะเบียนอีเมลอื่น
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="join-heading"
      className="space-y-5"
    >
      {serverError && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-red-700 bg-red-950/50 px-4 py-3 text-sm text-red-200"
        >
          <span role="img" aria-label="ข้อผิดพลาด">
            ⚠️
          </span>{" "}
          {serverError}
        </div>
      )}

      {/* Honeypot field สำหรับกันสแปม — ซ่อนจากผู้ใช้และ Screen Reader */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* ชื่อที่อยากให้เรียก */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="full_name"
          className="text-sm font-medium text-zinc-100"
        >
          ชื่อที่อยากให้เรียก{" "}
          <span aria-hidden="true" className="text-red-400">
            *
          </span>
        </label>
        <input
          ref={nameRef}
          id="full_name"
          name="full_name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          enterKeyHint="next"
          value={fullName}
          aria-invalid={nameInvalid ? "true" : "false"}
          aria-describedby={nameInvalid ? "full_name-error" : undefined}
          onChange={(e) => {
            setFullName(e.target.value);
            if (nameInvalid && isNameValid(e.target.value)) {
              setNameInvalid(false);
            }
          }}
          onBlur={() => {
            if (fullName.length > 0) {
              setNameInvalid(!isNameValid(fullName));
            }
          }}
          placeholder="เช่น คุณสมชาย หรือ ชื่อเล่น"
          className={`min-h-12 w-full rounded-lg border bg-zinc-900 px-3.5 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
            nameInvalid ? "border-red-500 bg-red-950/30" : "border-zinc-700"
          }`}
        />
        {nameInvalid && (
          <p id="full_name-error" className="text-sm text-red-400">
            กรุณากรอกชื่อที่อยากให้เรียก (ไม่เกิน 100 ตัวอักษร)
          </p>
        )}
      </div>

      {/* อีเมล */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-zinc-100">
          อีเมล{" "}
          <span aria-hidden="true" className="text-red-400">
            *
          </span>
        </label>
        <span id="email-hint" className="text-xs text-zinc-400">
          ใช้สำหรับส่งลิงก์ยืนยันและอีเมลอวยพรวันเกิด (เช่น name@example.com)
        </span>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="next"
          value={email}
          aria-invalid={emailInvalid ? "true" : "false"}
          aria-describedby={
            emailInvalid ? "email-hint email-error" : "email-hint"
          }
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailInvalid && isEmailValid(e.target.value)) {
              setEmailInvalid(false);
            }
          }}
          onBlur={() => {
            if (email.length > 0) {
              setEmailInvalid(!isEmailValid(email));
            }
          }}
          placeholder="you@example.com"
          className={`min-h-12 w-full rounded-lg border bg-zinc-900 px-3.5 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
            emailInvalid ? "border-red-500 bg-red-950/30" : "border-zinc-700"
          }`}
        />
        {emailInvalid && (
          <p id="email-error" className="text-sm text-red-400">
            กรุณากรอกรูปแบบอีเมลให้ถูกต้อง
          </p>
        )}
      </div>

      {/* วัน/เดือนเกิด (ไม่เก็บปี) */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-100">
          วัน / เดือนเกิด (ไม่เก็บปีเกิด){" "}
          <span aria-hidden="true" className="text-red-400">
            *
          </span>
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="birth_month" className="text-xs text-zinc-400">
              เดือนเกิด
            </label>
            <select
              ref={monthRef}
              id="birth_month"
              name="birth_month"
              required
              value={birthMonth}
              aria-invalid={monthInvalid ? "true" : "false"}
              aria-describedby={monthInvalid ? "month-error" : undefined}
              onChange={(e) => handleMonthChange(e.target.value)}
              className={`min-h-12 w-full rounded-lg border bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                monthInvalid
                  ? "border-red-500 bg-red-950/30"
                  : "border-zinc-700"
              }`}
            >
              <option value="">-- เลือกเดือน --</option>
              {THAI_MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {index + 1}. {name}
                </option>
              ))}
            </select>
            {monthInvalid && (
              <p id="month-error" className="text-sm text-red-400">
                กรุณาเลือกเดือนเกิด
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="birth_day" className="text-xs text-zinc-400">
              วันที่เกิด
            </label>
            <select
              ref={dayRef}
              id="birth_day"
              name="birth_day"
              required
              value={birthDay}
              aria-invalid={dayInvalid ? "true" : "false"}
              aria-describedby={dayInvalid ? "day-error" : undefined}
              onChange={(e) => {
                setBirthDay(e.target.value);
                setDayInvalid(false);
              }}
              className={`min-h-12 w-full rounded-lg border bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 ${
                dayInvalid ? "border-red-500 bg-red-950/30" : "border-zinc-700"
              }`}
            >
              <option value="">-- เลือกวัน --</option>
              {Array.from({ length: maxDays }, (_, idx) => idx + 1).map(
                (day) => (
                  <option key={day} value={day}>
                    วันที่ {day}
                  </option>
                )
              )}
            </select>
            {dayInvalid && (
              <p id="day-error" className="text-sm text-red-400">
                กรุณาเลือกวันที่เกิด
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Checkbox PDPA — ไม่ติ๊กไว้ล่วงหน้า */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-start gap-3">
          <input
            ref={consentRef}
            id="consent_given"
            name="consent_given"
            type="checkbox"
            required
            checked={consentGiven}
            aria-invalid={consentInvalid ? "true" : "false"}
            aria-describedby={
              consentInvalid ? "pdpa-notice consent-error" : "pdpa-notice"
            }
            onChange={(e) => {
              setConsentGiven(e.target.checked);
              if (e.target.checked) {
                setConsentInvalid(false);
              }
            }}
            className="mt-1 h-5 w-5 shrink-0 rounded border-zinc-600 bg-zinc-950 accent-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          />
          <label
            htmlFor="consent_given"
            className="cursor-pointer text-sm leading-relaxed text-zinc-200"
          >
            ยินยอมให้จัดเก็บและใช้ข้อมูลส่วนบุคคล (ชื่อ อีเมล และวัน/เดือนเกิด){" "}
            <span aria-hidden="true" className="text-red-400">
              *
            </span>
          </label>
        </div>
        <p id="pdpa-notice" className="mt-2 pl-8 text-xs leading-relaxed text-zinc-400">
          ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
          ระบบจะเก็บเฉพาะชื่อที่อยากให้เรียก อีเมล และวัน/เดือนเกิด (ไม่เก็บปีเกิด)
          เพื่อวัตถุประสงค์ในการส่งอีเมลอวยพรวันเกิดเท่านั้น
          คุณสามารถแก้ไข ลบข้อมูล หรือยกเลิกการรับอีเมลได้ตลอดเวลา
        </p>
        {consentInvalid && (
          <p id="consent-error" className="mt-2 pl-8 text-sm text-red-400">
            กรุณาติ๊กยินยอมก่อนส่งแบบฟอร์ม
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-12 w-full items-center justify-center rounded-lg bg-zinc-100 px-4 py-3 text-base font-semibold text-zinc-950 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "กำลังส่งข้อมูล..." : "ลงทะเบียนรับคำอวยพรวันเกิด"}
      </button>
    </form>
  );
}
