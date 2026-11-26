"use client";

import { useActionState, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [mode, setMode] = useState<"user" | "admin">("user");
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);

  // User Magic Link & Google OAuth state
  const [magicEmail, setMagicEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    const trimmed = magicEmail.trim();
    if (!trimmed) {
      setAuthError("กรุณากรอกอีเมลของคุณ");
      return;
    }

    setAuthLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) {
        setAuthError(error.message || "ไม่สามารถส่งลิงก์เข้าสู่ระบบได้ กรุณาลองใหม่");
      } else {
        setAuthMessage(
          "ส่งลิงก์เข้าสู่ระบบ (Magic Link) ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย"
        );
      }
    } catch {
      setAuthError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthMessage(null);
    setAuthLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) {
        setAuthError(
          "ยังไม่สามารถเข้าสู่ระบบด้วย Google ได้ในขณะนี้ (อาจยังไม่ได้เปิดใช้งาน Google Provider ในระบบ)"
        );
        setAuthLoading(false);
      }
    } catch {
      setAuthError(
        "ยังไม่สามารถเข้าสู่ระบบด้วย Google ได้ในขณะนี้ กรุณาใช้วิธี Magic Link แทน"
      );
      setAuthLoading(false);
    }
  };

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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setMode("user")}
          className={`min-h-[40px] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "user"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          ผู้ใช้ทั่วไป
        </button>
        <button
          type="button"
          onClick={() => setMode("admin")}
          className={`min-h-[40px] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "admin"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          แอดมิน
        </button>
      </div>

      {mode === "user" ? (
        <div className="space-y-4">
          {authError && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
            >
              <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
            >
              <CheckCircle2 size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              <span>{authMessage}</span>
            </div>
          )}

          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="magic-email"
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                เข้าสู่ระบบด้วย Magic Link ทางอีเมล
              </label>
              <input
                id="magic-email"
                type="email"
                required
                value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-h-12 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#D97724] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#B85E16] disabled:opacity-60"
            >
              <Mail size={18} strokeWidth={1.5} aria-hidden="true" />
              <span>{authLoading ? "กำลังส่งลิงก์..." : "ส่งลิงก์เข้าสู่ระบบ"}</span>
            </button>
          </form>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700" />
            <span className="mx-3 shrink text-xs text-zinc-500 dark:text-zinc-400">
              หรือ
            </span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
