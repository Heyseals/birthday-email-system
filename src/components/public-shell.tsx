import Link from "next/link";
import type { ReactNode } from "react";

interface PublicShellProps {
  children: ReactNode;
  maxWidth?: "narrow" | "reading" | "wide";
  showJoinLinkInHeader?: boolean;
  showBackgroundPattern?: boolean;
  centerVertically?: boolean;
}

export function TopBuntingBar() {
  return (
    <div
      aria-hidden="true"
      className="h-1.5 w-full shrink-0"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, var(--birthday-primary) 0 24px, var(--birthday-accent) 24px 48px, var(--birthday-soft) 48px 72px, var(--birthday-success) 72px 96px)",
      }}
    />
  );
}

export function PublicShell({
  children,
  maxWidth = "reading",
  showJoinLinkInHeader = true,
  showBackgroundPattern = true,
  centerVertically = false,
}: PublicShellProps) {
  const widthClass =
    maxWidth === "narrow"
      ? "max-w-[30rem]"
      : maxWidth === "wide"
        ? "max-w-[clamp(68.75rem,85vw,75rem)] min-[1920px]:max-w-[87.5rem]"
        : "max-w-[42.5rem]";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-clip bg-[var(--birthday-bg)] text-[var(--birthday-text)] font-[family-name:var(--font-ibm-plex-thai)]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 0% 25%, rgba(251, 227, 220, 0.35), transparent 36%), radial-gradient(circle at 100% 75%, rgba(242, 182, 50, 0.12), transparent 36%)",
      }}
    >
      {showBackgroundPattern && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 hidden justify-between overflow-hidden xl:flex"
        >
          <svg
            className="mt-24 h-[60vh] w-[10vw] max-w-[10rem] opacity-25"
            viewBox="0 0 96 320"
            fill="none"
          >
            <circle cx="24" cy="32" r="5" fill="var(--birthday-accent)" />
            <polygon points="58,64 68,80 48,80" fill="var(--birthday-primary)" />
            <line
              x1="16"
              y1="128"
              x2="34"
              y2="114"
              stroke="var(--birthday-success)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="64" cy="180" r="4" fill="var(--birthday-soft)" />
            <polygon points="22,232 34,224 30,240" fill="var(--birthday-accent)" />
            <circle cx="52" cy="284" r="4" fill="var(--birthday-primary)" />
          </svg>
          <svg
            className="mt-32 h-[60vh] w-[10vw] max-w-[10rem] opacity-25"
            viewBox="0 0 96 320"
            fill="none"
          >
            <polygon points="62,28 74,42 54,46" fill="var(--birthday-accent)" />
            <circle cx="32" cy="92" r="4.5" fill="var(--birthday-success)" />
            <line
              x1="54"
              y1="146"
              x2="72"
              y2="160"
              stroke="var(--birthday-primary)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="26" cy="212" r="5" fill="var(--birthday-accent)" />
            <polygon points="64,252 72,266 54,264" fill="var(--birthday-primary)" />
            <circle cx="38" cy="296" r="4" fill="var(--birthday-success)" />
          </svg>
        </div>
      )}
      <TopBuntingBar />

      <header className="relative border-b border-[var(--birthday-border)]/80">
        <div
          className={`mx-auto flex w-full ${widthClass} items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8`}
        >
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--birthday-text)] transition-colors hover:text-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            ระบบอวยพรวันเกิดอัตโนมัติ
          </Link>

          <nav aria-label="เมนูหลัก" className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              href="/create"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--birthday-primary)] bg-[var(--birthday-soft)] px-4 text-sm font-semibold text-[var(--birthday-primary)] transition-colors hover:bg-[var(--birthday-primary)] hover:text-[var(--birthday-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              สร้างการ์ด
            </Link>
            {showJoinLinkInHeader && (
              <Link
                href="/join"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--birthday-primary)] px-4 text-sm font-semibold text-[var(--birthday-on-primary)] shadow-xs transition-colors hover:bg-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
              >
                สมัครรับอีเมล
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main
        className={`relative mx-auto w-full flex-1 ${widthClass} px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-14 lg:px-8 lg:pt-12 lg:pb-16 ${
          centerVertically ? "flex flex-col justify-center" : ""
        }`}
      >
        {children}
      </main>

      <footer className="relative border-t border-[var(--birthday-border)]">
        <div
          className={`mx-auto flex w-full ${widthClass} flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-[var(--birthday-muted)] sm:px-6 lg:px-8`}
        >
          <p>
            ระบบอวยพรวันเกิดอัตโนมัติ · ใช้ข้อมูลเพื่อส่งคำอวยพรในวันเกิดเท่านั้น
          </p>
          <nav aria-label="ลิงก์ท้ายหน้า" className="flex flex-wrap items-center gap-4">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center underline-offset-4 hover:text-[var(--birthday-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              หน้าแรก
            </Link>
            <Link
              href="/create"
              className="inline-flex min-h-[44px] items-center underline-offset-4 hover:text-[var(--birthday-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              สร้างการ์ด
            </Link>
            <Link
              href="/join"
              className="inline-flex min-h-[44px] items-center underline-offset-4 hover:text-[var(--birthday-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              สมัครรับอีเมล
            </Link>
            <Link
              href="/privacy"
              className="inline-flex min-h-[44px] items-center underline-offset-4 hover:text-[var(--birthday-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
