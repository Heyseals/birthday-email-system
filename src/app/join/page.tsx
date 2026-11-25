import type { Metadata } from "next";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "ลงทะเบียนวันเกิด | ระบบส่งอีเมลอวยพรวันเกิด",
  description: "ลงทะเบียนชื่อ อีเมล และวัน/เดือนเกิด เพื่อรับคำอวยพรในวันเกิดของคุณ",
};

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8 text-center">
          <div className="mb-2 text-4xl" aria-hidden="true">
            🎂
          </div>
          <h1
            id="join-heading"
            className="text-2xl font-bold tracking-tight text-white"
          >
            ลงทะเบียนรับคำอวยพรวันเกิด
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            กรอกข้อมูลด้านล่าง ระบบจะส่งลิงก์ยืนยันไปที่อีเมลของคุณก่อนเริ่มใช้งาน
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl sm:p-8">
          <JoinForm />
        </section>

        <footer className="mt-8 text-center text-xs text-zinc-500">
          <p>Birthday Email System · ข้อมูลของคุณจะใช้เพื่อส่งคำอวยพรวันเกิดเท่านั้น</p>
        </footer>
      </div>
    </main>
  );
}
