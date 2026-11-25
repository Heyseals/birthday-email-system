import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <section className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          ระบบส่งอีเมลอวยพรวันเกิดอัตโนมัติ
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          สำหรับผู้ดูแลระบบในการจัดการข้อมูลลูกค้าจำลองและติดตามประวัติการส่งอีเมล
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/admin"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            ไปที่หน้าแอดมิน
          </Link>
        </div>
      </section>
    </main>
  );
}
