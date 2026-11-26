"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Download,
  Edit3,
  Globe,
  Lock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  THAI_MONTHS,
  getMaxDaysInMonth,
  type CardRecord,
  type Customer,
  type EmailLog,
} from "@/types/database";

interface DashboardClientProps {
  userEmail: string;
  initialCustomers: Customer[];
  initialCards: CardRecord[];
  initialLogs: EmailLog[];
  supabaseUrl: string;
}

const STATUS_LABELS: Record<Customer["status"], { label: string; cls: string }> = {
  confirmed: {
    label: "ยืนยันแล้ว (พร้อมส่ง)",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  paused: {
    label: "หยุดส่งชั่วคราว",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
  },
  pending: {
    label: "รอยืนยันอีเมล",
    cls: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
  unsubscribed: {
    label: "ยกเลิกแล้ว",
    cls: "bg-red-50 text-red-700 border-red-200",
  },
};

export function DashboardClient({
  userEmail,
  initialCustomers,
  initialCards,
  initialLogs,
  supabaseUrl,
}: DashboardClientProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [cards, setCards] = useState<CardRecord[]>(initialCards);
  const [logs] = useState<EmailLog[]>(initialLogs);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Edit customer modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editMonth, setEditMonth] = useState(1);
  const [editDay, setEditDay] = useState(1);
  const [editMessage, setEditMessage] = useState("");

  // Delete account confirmation state
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.full_name);
    setEditMonth(c.birth_month);
    setEditDay(c.birth_day);
    setEditMessage(c.custom_message ?? "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setBusyId(editingCustomer.id);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/dashboard/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName,
          birth_month: editMonth,
          birth_day: editDay,
          custom_message: editMessage.trim() || null,
        }),
      });
      const data = (await res.json()) as { customer?: Customer; error?: string };
      if (!res.ok || !data.customer) {
        setStatusMsg(data.error ?? "ไม่สามารถบันทึกการแก้ไขได้");
        return;
      }
      setCustomers((prev) =>
        prev.map((item) => (item.id === editingCustomer.id ? data.customer! : item))
      );
      setEditingCustomer(null);
      setStatusMsg("บันทึกการแก้ไขเรียบร้อยแล้ว");
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePause = async (c: Customer) => {
    const nextStatus = c.status === "paused" ? "confirmed" : "paused";
    setBusyId(c.id);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/dashboard/customers/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json()) as { customer?: Customer; error?: string };
      if (!res.ok || !data.customer) {
        setStatusMsg(data.error ?? "ไม่สามารถเปลี่ยนสถานะได้");
        return;
      }
      setCustomers((prev) =>
        prev.map((item) => (item.id === c.id ? data.customer! : item))
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    setBusyId(id);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/dashboard/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setStatusMsg("ไม่สามารถลบรายการได้");
        return;
      }
      setCustomers((prev) => prev.filter((item) => item.id !== id));
      setStatusMsg("ลบรายการวันเกิดเรียบร้อยแล้ว");
    } finally {
      setBusyId(null);
    }
  };

  const handleClaimOldRecords = async () => {
    setBusyId("claim");
    setStatusMsg(null);
    try {
      const res = await fetch("/api/dashboard/claim", { method: "POST" });
      const data = (await res.json()) as { claimedCount?: number; error?: string };
      if (!res.ok) {
        setStatusMsg(data.error ?? "ไม่สามารถผูกข้อมูลเก่าได้");
        return;
      }
      if ((data.claimedCount ?? 0) > 0) {
        setStatusMsg(`ผูกข้อมูลเก่าสำเร็จ ${data.claimedCount} รายการ`);
        router.refresh();
      } else {
        setStatusMsg("ไม่พบข้อมูลเก่าที่ใช้อีเมลตรงกับบัญชีนี้");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleCardPublic = async (card: CardRecord) => {
    setBusyId(card.id);
    setStatusMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("cards")
        .update({
          is_public: !card.is_public,
          updated_at: new Date().toISOString(),
        })
        .eq("id", card.id);

      if (error) {
        setStatusMsg("ไม่สามารถเปลี่ยนสถานะการ์ดได้");
        return;
      }
      setCards((prev) =>
        prev.map((item) =>
          item.id === card.id ? { ...item, is_public: !card.is_public } : item
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setBusyId(cardId);
    setStatusMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("cards").delete().eq("id", cardId);
      if (error) {
        setStatusMsg("ไม่สามารถลบการ์ดได้");
        return;
      }
      setCards((prev) => prev.filter((item) => item.id !== cardId));
      setStatusMsg("ลบการ์ดเรียบร้อยแล้ว");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/dashboard/account", { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setStatusMsg(data.error ?? "ไม่สามารถลบบัญชีได้");
        setIsDeletingAccount(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setStatusMsg("เกิดข้อผิดพลาดขณะลบบัญชี");
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E8D9C8] bg-[#FFF8EE] p-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3B2A26]">
            แดชบอร์ดของฉัน
          </h1>
          <p className="mt-1 text-sm text-[#7A635D]">
            เข้าสู่ระบบในชื่อ:{" "}
            <span className="font-medium text-[#3B2A26]">{userEmail}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/create"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#D97724] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#B85E16]"
          >
            <Plus size={16} />
            <span>สร้างการ์ดใหม่</span>
          </Link>
          <Link
            href="/join"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#E8D9C8] bg-white px-4 py-2 text-sm font-medium text-[#3B2A26] transition-colors hover:bg-[#FFF8EE]"
          >
            <Calendar size={16} />
            <span>ตั้งวันเกิด / ส่งการ์ด</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="min-h-[42px] rounded-xl border border-[#E8D9C8] bg-white px-4 py-2 text-sm font-medium text-[#3B2A26] transition-colors hover:bg-[#FFF8EE]"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      {statusMsg && (
        <div
          role="status"
          className="rounded-xl border border-[#E8D9C8] bg-[#FFF8EE] px-4 py-3 text-sm font-medium text-[#3B2A26]"
        >
          {statusMsg}
        </div>
      )}

      {/* Section 1: รายการวันเกิดที่ตั้งไว้ */}
      <section className="space-y-4 rounded-2xl border border-[#E8D9C8] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#3B2A26]">
              รายการวันเกิดที่ตั้งไว้ ({customers.length})
            </h2>
            <p className="text-xs text-[#7A635D]">
              แสดงทั้งรายการของตัวเองและรายการที่คุณส่งการ์ดให้คนอื่น
            </p>
          </div>
          <button
            type="button"
            onClick={handleClaimOldRecords}
            disabled={busyId === "claim"}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#E8D9C8] bg-[#FFF8EE] px-3 py-1.5 text-xs font-medium text-[#3B2A26] hover:bg-[#F5E9D9] disabled:opacity-60"
          >
            <RefreshCw size={14} />
            <span>ผูกข้อมูลเก่าที่ใช้อีเมลเดียวกัน</span>
          </button>
        </div>

        {customers.length === 0 ? (
          <p className="rounded-xl bg-[#FFFDF9] p-6 text-center text-sm text-[#7A635D]">
            ยังไม่มีรายการวันเกิดที่ผูกกับบัญชีนี้
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {customers.map((c) => {
              const badge = STATUS_LABELS[c.status];
              const canPauseToggle =
                c.status === "confirmed" || c.status === "paused";

              return (
                <div
                  key={c.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[#E8D9C8] bg-[#FFFDF9] p-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#3B2A26]">
                          {c.full_name}
                        </p>
                        <p className="text-xs text-[#7A635D]">{c.email}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#3B2A26]">
                      วันเกิด: {c.birth_day} {THAI_MONTHS[c.birth_month - 1]}
                    </p>
                    {c.sender_name && (
                      <p className="text-xs text-[#7A635D]">
                        ผู้ส่ง: {c.sender_name}
                      </p>
                    )}
                    {c.custom_message && (
                      <p className="rounded-lg bg-[#FFF8EE] p-2 text-xs text-[#3B2A26]">
                        “{c.custom_message}”
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0E4D6]">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      disabled={busyId === c.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E8D9C8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3B2A26] hover:bg-[#FFF8EE]"
                    >
                      <Edit3 size={13} />
                      <span>แก้ไข</span>
                    </button>

                    {canPauseToggle && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(c)}
                        disabled={busyId === c.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E8D9C8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3B2A26] hover:bg-[#FFF8EE]"
                      >
                        {c.status === "paused" ? (
                          <>
                            <Play size={13} />
                            <span>เปิดรับต่อ</span>
                          </>
                        ) : (
                          <>
                            <Pause size={13} />
                            <span>หยุดชั่วคราว</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(c.id)}
                      disabled={busyId === c.id}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      <Trash2 size={13} />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: การ์ดที่บันทึกไว้ */}
      <section className="space-y-4 rounded-2xl border border-[#E8D9C8] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#3B2A26]">
          การ์ดที่บันทึกไว้ ({cards.length})
        </h2>

        {cards.length === 0 ? (
          <p className="rounded-xl bg-[#FFFDF9] p-6 text-center text-sm text-[#7A635D]">
            คุณยังไม่ได้บันทึกการ์ดไว้
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const imageUrl =
                card.image_path && supabaseUrl
                  ? `${supabaseUrl}/storage/v1/object/public/cards/${card.image_path}`
                  : null;

              return (
                <div
                  key={card.id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#E8D9C8] bg-[#FFFDF9]"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={card.title}
                      className="h-40 w-full object-cover bg-[#FFF8EE]"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-[#FFF8EE] text-xs text-[#7A635D]">
                      ไม่มีภาพตัวอย่าง
                    </div>
                  )}

                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-[#3B2A26]">
                        {card.title}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8EE] px-2 py-0.5 text-[11px] text-[#7A635D]">
                        {card.is_public ? (
                          <>
                            <Globe size={11} /> สาธารณะ
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> ส่วนตัว
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/create?cardId=${card.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#D97724] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#B85E16]"
                      >
                        <Edit3 size={13} />
                        <span>แก้ไขต่อ</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleCardPublic(card)}
                        disabled={busyId === card.id}
                        className="rounded-lg border border-[#E8D9C8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3B2A26] hover:bg-[#FFF8EE]"
                      >
                        {card.is_public ? "ตั้งเป็นส่วนตัว" : "ตั้งเป็นสาธารณะ"}
                      </button>
                      {card.is_public && (
                        <button
                          type="button"
                          onClick={async () => {
                            const url = `${window.location.origin}/card/${card.id}`;
                            await navigator.clipboard.writeText(url);
                            setStatusMsg(`คัดลอกลิงก์แชร์การ์ด "${card.title}" แล้ว`);
                          }}
                          className="rounded-lg border border-[#E8D9C8] bg-[#FFF8EE] px-2.5 py-1.5 text-xs font-medium text-[#3B2A26] hover:bg-[#F5E9D9]"
                        >
                          คัดลอกลิงก์แชร์
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id)}
                        disabled={busyId === card.id}
                        className="ml-auto rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: ประวัติการส่งอีเมล */}
      <section className="space-y-4 rounded-2xl border border-[#E8D9C8] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#3B2A26]">
          ประวัติการส่งอีเมล ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <p className="rounded-xl bg-[#FFFDF9] p-6 text-center text-sm text-[#7A635D]">
            ยังไม่มีประวัติการส่งอีเมล
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8D9C8] text-xs text-[#7A635D]">
                  <th className="py-2 pr-4">ผู้รับ</th>
                  <th className="py-2 pr-4">อีเมล</th>
                  <th className="py-2 pr-4">วันที่ส่ง</th>
                  <th className="py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#F5E9D9]">
                    <td className="py-2.5 pr-4 font-medium">
                      {log.customers?.full_name ?? "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-[#7A635D]">
                      {log.recipient_email}
                    </td>
                    <td className="py-2.5 pr-4 text-[#7A635D]">
                      {new Date(log.sent_at).toLocaleString("th-TH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-[#FFF8EE] px-2.5 py-0.5 text-xs font-medium text-[#3B2A26]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 4: สิทธิ์ตาม PDPA */}
      <section className="space-y-4 rounded-2xl border border-[#E8D9C8] bg-[#FFF8EE] p-6">
        <h2 className="text-lg font-semibold text-[#3B2A26]">
          จัดการข้อมูลส่วนบุคคล (PDPA)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/dashboard/export"
            download="my-birthday-data.json"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#E8D9C8] bg-white px-4 py-2 text-sm font-medium text-[#3B2A26] hover:bg-[#FFFDF9]"
          >
            <Download size={16} />
            <span>ดาวน์โหลดข้อมูลของฉัน (JSON)</span>
          </a>

          <button
            type="button"
            onClick={() => setConfirmDeleteAccount(true)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Trash2 size={16} />
            <span>ลบข้อมูลทั้งหมดของฉัน</span>
          </button>
        </div>

        {confirmDeleteAccount && (
          <div className="rounded-xl border border-red-300 bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700">
              ยืนยันการลบข้อมูลและบัญชีถาวร?
            </p>
            <p className="text-xs text-[#7A635D]">
              การดำเนินการนี้จะลบรายการวันเกิด การ์ดที่บันทึกไว้ รูปภาพในระบบ และบัญชีผู้ใช้ของคุณอย่างถาวร ไม่สามารถกู้คืนได้
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeletingAccount ? "กำลังลบ..." : "ยืนยันลบบัญชีถาวร"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteAccount(false)}
                disabled={isDeletingAccount}
                className="rounded-lg border border-[#E8D9C8] bg-white px-4 py-2 text-xs font-medium text-[#3B2A26]"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#E8D9C8] bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-[#3B2A26]">
              แก้ไขข้อมูลวันเกิด
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#3B2A26]">
                ชื่อผู้รับ
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-[#E8D9C8] px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#3B2A26]">
                  เดือนเกิด
                </label>
                <select
                  value={editMonth}
                  onChange={(e) => {
                    const nextM = Number(e.target.value);
                    setEditMonth(nextM);
                    const maxD = getMaxDaysInMonth(nextM);
                    if (editDay > maxD) setEditDay(maxD);
                  }}
                  className="w-full rounded-lg border border-[#E8D9C8] px-3 py-2 text-sm"
                >
                  {THAI_MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#3B2A26]">
                  วันเกิด
                </label>
                <select
                  value={editDay}
                  onChange={(e) => setEditDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E8D9C8] px-3 py-2 text-sm"
                >
                  {Array.from(
                    { length: getMaxDaysInMonth(editMonth) },
                    (_, i) => i + 1
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#3B2A26]">
                ข้อความอวยพร
              </label>
              <textarea
                rows={3}
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="w-full rounded-lg border border-[#E8D9C8] px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="rounded-lg border border-[#E8D9C8] px-4 py-2 text-xs font-medium text-[#3B2A26]"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={busyId === editingCustomer.id}
                className="rounded-lg bg-[#D97724] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B85E16] disabled:opacity-60"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
