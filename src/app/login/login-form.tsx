"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleBlur = (
    el: HTMLInputElement | null,
    setInvalid: (val: boolean) => void
  ) => {
    if (!el) return;
    setInvalid(!el.validity.valid);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const emailEl = emailRef.current;
    const passwordEl = passwordRef.current;

    const isEmailValid = emailEl ? emailEl.validity.valid : true;
    const isPasswordValid = passwordEl ? passwordEl.validity.valid : true;

    setEmailInvalid(!isEmailValid);
    setPasswordInvalid(!isPasswordValid);

    if (!isEmailValid) {
      e.preventDefault();
      emailEl?.focus();
      return;
    }

    if (!isPasswordValid) {
      e.preventDefault();
      passwordEl?.focus();
    }
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
      aria-labelledby="login-heading"
    >
      {state.error && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
        >
          <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          อีเมลแอดมิน <span aria-hidden="true" className="text-red-600">*</span>
        </label>
        <span id="email-hint" className="text-xs text-zinc-500 dark:text-zinc-400">
          รูปแบบ: admin@example.com
        </span>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="next"
          aria-invalid={emailInvalid ? "true" : "false"}
          aria-describedby={emailInvalid ? "email-hint email-error" : "email-hint"}
          onBlur={() => handleBlur(emailRef.current, setEmailInvalid)}
          onInput={() => {
            if (emailInvalid && emailRef.current?.validity.valid) {
              setEmailInvalid(false);
            }
          }}
          className={`min-h-12 w-full rounded-lg border px-3.5 py-2.5 text-base text-zinc-900 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 dark:bg-zinc-900 dark:text-zinc-100 ${
            emailInvalid
              ? "border-red-600 bg-red-50/60 dark:border-red-500 dark:bg-red-950/30"
              : "border-zinc-400 dark:border-zinc-700"
          }`}
          placeholder="admin@example.com"
        />
        {emailInvalid && (
          <p
            id="email-error"
            className="flex items-center gap-1.5 text-sm text-red-700 dark:text-red-400"
          >
            <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            <span>กรุณากรอกอีเมลให้ถูกต้อง เช่น admin@example.com</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          รหัสผ่าน <span aria-hidden="true" className="text-red-600">*</span>
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            enterKeyHint="done"
            aria-invalid={passwordInvalid ? "true" : "false"}
            aria-describedby={passwordInvalid ? "password-error" : undefined}
            onBlur={() => handleBlur(passwordRef.current, setPasswordInvalid)}
            onInput={() => {
              if (passwordInvalid && passwordRef.current?.validity.valid) {
                setPasswordInvalid(false);
              }
            }}
            className={`min-h-12 w-full rounded-lg border py-2.5 pl-3.5 pr-20 text-base text-zinc-900 bg-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 dark:bg-zinc-900 dark:text-zinc-100 ${
              passwordInvalid
                ? "border-red-600 bg-red-50/60 dark:border-red-500 dark:bg-red-950/30"
                : "border-zinc-400 dark:border-zinc-700"
            }`}
          />
          <button
            type="button"
            aria-pressed={showPassword}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 min-h-9 rounded-md px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {showPassword ? "ซ่อน" : "แสดง"}
          </button>
        </div>
        {passwordInvalid && (
          <p
            id="password-error"
            className="flex items-center gap-1.5 text-sm text-red-700 dark:text-red-400"
          >
            <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            <span>กรุณากรอกรหัสผ่าน</span>
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบแอดมิน"}
      </button>
    </form>
  );
}
