import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import { ZoomGuard } from "@/components/zoom-guard";
import { PreferencesProvider } from "@/components/preferences-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ระบบส่งอีเมลอวยพรวันเกิดอัตโนมัติ",
  description: "ระบบจัดการรายชื่อลูกค้าจำลองและส่งอีเมลอวยพรวันเกิดอัตโนมัติ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip">
        <PreferencesProvider>
          <ZoomGuard />
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
