"use client";

import { useRef, useState } from "react";
import { AlertCircle, CircleCheck, Loader2, Mail } from "lucide-react";
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

      if (res.status === 429) {
        setServerError(
          "คุณส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
        );
        return;
      }

      if (!res.ok || !data.ok) {
        setServerError(
          data.error ?? "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง"
        );
        return;
      }

      setSuccessMessage(
        data.message ??
          "ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมายและโฟลเดอร์สแปม"
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
        className="rounded-lg bg-[var(--birthday-soft)] p-6"
      >
        <div className="flex items-start gap-3">
          <CircleCheck
            size={20}
            strokeWidth={1.5}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[var(--birthday-success)]"
          />
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--birthday-text)]">
              กรุณาตรวจสอบอีเมลเพื่อยืนยัน
            </h2>
            <p className="text-sm leading-relaxed text-[var(--birthday-text)]">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="mt-2 inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--birthday-primary)] underline underline-offset-4 hover:text-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              ลงทะเบียนอีเมลอื่น
            </button>
          </div>
        </div>
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
          className="flex items-start gap-2.5 rounded-lg bg-[var(--birthday-soft)] px-4 py-3 text-sm text-[var(--birthday-error)]"
        >
          <AlertCircle
            size={18}
            strokeWidth={1.5}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
          <span>{serverError}</span>
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
          className="text-sm font-medium text-[var(--birthday-text)]"
        >
          ชื่อที่อยากให้เรียก{" "}
          <span aria-hidden="true" className="text-[var(--birthday-primary)]">
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
          className={`min-h-[44px] w-full rounded-lg border bg-[var(--birthday-surface)] px-3.5 py-2.5 text-base text-[var(--birthday-text)] placeholder:text-[var(--birthday-muted)]/70 transition-colors focus-visible:border-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--birthday-primary)] ${
            nameInvalid
              ? "border-[var(--birthday-error)]"
              : "border-[var(--birthday-border)]"
          }`}
        />
        {nameInvalid && (
          <p
            id="full_name-error"
            className="flex items-center gap-1.5 text-sm text-[var(--birthday-error)]"
          >
            <AlertCircle
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0"
            />
            <span>กรุณากรอกชื่อที่อยากให้เรียก (ไม่เกิน 100 ตัวอักษร)</span>
          </p>
        )}
      </div>

      {/* อีเมล */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[var(--birthday-text)]"
        >
          อีเมล{" "}
          <span aria-hidden="true" className="text-[var(--birthday-primary)]">
            *
          </span>
        </label>
        <div className="relative">
          <Mail
            size={18}
            strokeWidth={1.5}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--birthday-muted)]"
          />
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
            className={`min-h-[44px] w-full rounded-lg border bg-[var(--birthday-surface)] py-2.5 pr-3.5 pl-10 text-base text-[var(--birthday-text)] placeholder:text-[var(--birthday-muted)]/70 transition-colors focus-visible:border-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--birthday-primary)] ${
              emailInvalid
                ? "border-[var(--birthday-error)]"
                : "border-[var(--birthday-border)]"
            }`}
          />
        </div>
        <span id="email-hint" className="text-sm text-[var(--birthday-muted)]">
          ใช้ส่งลิงก์ยืนยันและคำอวยพรในวันเกิดของคุณ
        </span>
        {emailInvalid && (
          <p
            id="email-error"
            className="flex items-center gap-1.5 text-sm text-[var(--birthday-error)]"
          >
            <AlertCircle
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0"
            />
            <span>กรุณากรอกรูปแบบอีเมลให้ถูกต้อง</span>
          </p>
        )}
      </div>

      {/* วัน/เดือนเกิด (ไม่เก็บปี) */}
      <fieldset className="space-y-2 border-t border-[var(--birthday-border)] pt-5">
        <legend className="text-sm font-medium text-[var(--birthday-text)]">
          วัน / เดือนเกิด (ไม่เก็บปีเกิด){" "}
          <span aria-hidden="true" className="text-[var(--birthday-primary)]">
            *
          </span>
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="birth_month"
              className="text-sm text-[var(--birthday-muted)]"
            >
              เดือนเกิด
            </label>
            <div className="relative">
              <select
                ref={monthRef}
                id="birth_month"
                name="birth_month"
                required
                value={birthMonth}
                aria-invalid={monthInvalid ? "true" : "false"}
                aria-describedby={monthInvalid ? "month-error" : undefined}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={`min-h-[44px] w-full appearance-none rounded-lg border bg-[var(--birthday-surface)] py-2.5 pr-9 pl-3.5 text-base text-[var(--birthday-text)] transition-colors focus-visible:border-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--birthday-primary)] ${
                  monthInvalid
                    ? "border-[var(--birthday-error)]"
                    : "border-[var(--birthday-border)]"
                }`}
              >
                <option value="">เลือกเดือน</option>
                {THAI_MONTHS.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {index + 1}. {name}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--birthday-muted)]"
              >
                <path
                  d="M6 8l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {monthInvalid && (
              <p
                id="month-error"
                className="flex items-center gap-1.5 text-sm text-[var(--birthday-error)]"
              >
                <AlertCircle
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="shrink-0"
                />
                <span>กรุณาเลือกเดือนเกิด</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="birth_day"
              className="text-sm text-[var(--birthday-muted)]"
            >
              วันที่เกิด
            </label>
            <div className="relative">
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
                className={`min-h-[44px] w-full appearance-none rounded-lg border bg-[var(--birthday-surface)] py-2.5 pr-9 pl-3.5 text-base text-[var(--birthday-text)] transition-colors focus-visible:border-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--birthday-primary)] ${
                  dayInvalid
                    ? "border-[var(--birthday-error)]"
                    : "border-[var(--birthday-border)]"
                }`}
              >
                <option value="">เลือกวัน</option>
                {Array.from({ length: maxDays }, (_, idx) => idx + 1).map(
                  (day) => (
                    <option key={day} value={day}>
                      วันที่ {day}
                    </option>
                  )
                )}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--birthday-muted)]"
              >
                <path
                  d="M6 8l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {dayInvalid && (
              <p
                id="day-error"
                className="flex items-center gap-1.5 text-sm text-[var(--birthday-error)]"
              >
                <AlertCircle
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="shrink-0"
                />
                <span>กรุณาเลือกวันที่เกิด</span>
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Checkbox PDPA — ไม่ติ๊กไว้ล่วงหน้า และไม่เป็นกล่องซ้อน */}
      <div className="border-t border-[var(--birthday-border)] pt-5">
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
            className="mt-1 h-5 w-5 shrink-0 rounded border-[var(--birthday-border)] accent-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          />
          <label
            htmlFor="consent_given"
            className="cursor-pointer text-sm leading-relaxed text-[var(--birthday-text)]"
          >
            ยินยอมให้จัดเก็บชื่อ อีเมล และวัน/เดือนเกิด เพื่อส่งคำอวยพรวันเกิด{" "}
            <span aria-hidden="true" className="text-[var(--birthday-primary)]">
              *
            </span>
          </label>
        </div>
        <p
          id="pdpa-notice"
          className="mt-2 pl-8 text-sm leading-relaxed text-[var(--birthday-muted)]"
        >
          ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
          ระบบไม่เก็บปีเกิดและใช้ข้อมูลเพื่อส่งอีเมลอวยพรวันเกิดเท่านั้น
          คุณสามารถแก้ไข ลบข้อมูล หรือยกเลิกการรับอีเมลได้ตลอดเวลา
        </p>
        {consentInvalid && (
          <p
            id="consent-error"
            className="mt-2 flex items-center gap-1.5 pl-8 text-sm text-[var(--birthday-error)]"
          >
            <AlertCircle
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
              className="shrink-0"
            />
            <span>กรุณาติ๊กยินยอมก่อนส่งแบบฟอร์ม</span>
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--birthday-primary)] px-4 text-base font-medium text-[var(--birthday-on-primary)] transition-colors hover:bg-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
              className="animate-spin"
            />
            <span>กำลังส่ง</span>
          </>
        ) : (
          "สมัครรับอีเมล"
        )}
      </button>
    </form>
  );
}
