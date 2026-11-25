import Link from "next/link";
import type { ReactNode } from "react";

interface PublicShellProps {
  children: ReactNode;
  maxWidth?: "narrow" | "reading";
  showJoinLinkInHeader?: boolean;
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
}: PublicShellProps) {
  const widthClass =
    maxWidth === "narrow" ? "max-w-[460px]" : "max-w-[640px]";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--birthday-bg)] text-[var(--birthday-text)] font-[family-name:var(--font-ibm-plex-thai)]">
      <TopBuntingBar />

      <header className="border-b border-[var(--birthday-border)]/80">
        <div
          className={`mx-auto flex w-full ${widthClass} items-center justify-between gap-4 px-5 py-3 sm:px-6`}
        >
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--birthday-text)] transition-colors hover:text-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            ระบบอวยพรวันเกิดอัตโนมัติ
          </Link>

          {showJoinLinkInHeader && (
            <Link
              href="/join"
              className="inline-flex min-h-[44px] items-center text-sm font-medium text-[var(--birthday-primary)] underline-offset-4 hover:text-[var(--birthday-primary-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              สมัครรับอีเมล
            </Link>
          )}
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 ${widthClass} px-5 pt-10 pb-14 sm:px-6`}>
        {children}
      </main>

      <footer className="border-t border-[var(--birthday-border)]">
        <div
          className={`mx-auto flex w-full ${widthClass} flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-6 text-xs text-[var(--birthday-muted)] sm:px-6`}
        >
          <p>
            ระบบอวยพรวันเกิดอัตโนมัติ · ใช้ข้อมูลเพื่อส่งคำอวยพรในวันเกิดเท่านั้น
          </p>
          <nav aria-label="ลิงก์ท้ายหน้า" className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center underline-offset-4 hover:text-[var(--birthday-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              หน้าแรก
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
