"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CircleCheck } from "lucide-react";
import {
  createCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
} from "./actions";
import {
  formatThaiBirthday,
  getMaxDaysInMonth,
  THAI_MONTHS,
  type Customer,
  type EmailLog,
} from "@/types/database";

type ActiveTab = "customers" | "logs" | "test";
type PreviewResult = {
  targetDate: {
    year: number;
    month: number;
    day: number;
    includeFeb29: boolean;
  };
  eligible: Array<{
    id: string;
    full_name: string;
    email: string;
    birth_month: number;
    birth_day: number;
  }>;
  skippedAlreadySentCount: number;
};
type StatusFilter =
  | "all"
  | "eligible"
  | "birthday_today"
  | "no_consent"
  | "unsubscribed";

function formatBangkokDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

function isBirthdayToday(
  customer: Customer,
  todayMonth: number,
  todayDay: number,
  isNonLeapFeb28: boolean
): boolean {
  if (customer.birth_month === todayMonth && customer.birth_day === todayDay) {
    return true;
  }
  return isNonLeapFeb28 && customer.birth_month === 2 && customer.birth_day === 29;
}

export function AdminDashboard({
  customers,
  emailLogs,
  todayMonth,
  todayDay,
  isNonLeapFeb28,
}: {
  customers: Customer[];
  emailLogs: EmailLog[];
  todayMonth: number;
  todayDay: number;
  isNonLeapFeb28: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Test Mode State
  const [previewMonth, setPreviewMonth] = useState<number>(todayMonth);
  const [previewDay, setPreviewDay] = useState<number>(todayDay);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    null
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [testCustomerId, setTestCustomerId] = useState<string>(
    customers[0]?.id ?? ""
  );
  const effectiveTestCustomerId = customers.some(
    (c) => c.id === testCustomerId
  )
    ? testCustomerId
    : (customers[0]?.id ?? "");
  const [testRecipientEmail, setTestRecipientEmail] = useState("");
  const [testSendMessage, setTestSendMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Add/Edit Dialog State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingForm, startFormTransition] = useTransition();
  const [formMonth, setFormMonth] = useState<number>(1);
  const [formDay, setFormDay] = useState<number>(1);
  const [formKey, setFormKey] = useState(0);
  const formDialogRef = useRef<HTMLDialogElement>(null);

  // Delete Confirmation Dialog State
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const openAddDialog = () => {
    setEditingCustomer(null);
    setFormError(null);
    setFormMonth(todayMonth);
    setFormDay(todayDay);
    setFormKey((k) => k + 1);
    setBannerMessage(null);
    formDialogRef.current?.showModal();
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormError(null);
    setFormMonth(customer.birth_month);
    setFormDay(customer.birth_day);
    setFormKey((k) => k + 1);
    setBannerMessage(null);
    formDialogRef.current?.showModal();
  };

  const closeFormDialog = () => {
    formDialogRef.current?.close();
    setFormError(null);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isEdit = Boolean(editingCustomer);

    startFormTransition(async () => {
      const result = isEdit
        ? await updateCustomerAction({ error: null, successId: null }, formData)
        : await createCustomerAction(
            { error: null, successId: null },
            formData
          );

      if (result.error) {
        setFormError(result.error);
        return;
      }

      formDialogRef.current?.close();
      setFormError(null);
      setBannerMessage(
        isEdit
          ? "บันทึกการแก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว"
          : "เพิ่มข้อมูลลูกค้าจำลองเรียบร้อยแล้ว"
      );
    });
  };

  const openDeleteDialog = (customer: Customer) => {
    setDeletingCustomer(customer);
    setDeleteError(null);
    setBannerMessage(null);
    deleteDialogRef.current?.showModal();
  };

  const closeDeleteDialog = () => {
    deleteDialogRef.current?.close();
    setDeletingCustomer(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingCustomer) return;
    const targetName = deletingCustomer.full_name;
    const targetId = deletingCustomer.id;

    startDeleteTransition(async () => {
      const result = await deleteCustomerAction(targetId);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      deleteDialogRef.current?.close();
      setDeletingCustomer(null);
      setBannerMessage(`ลบข้อมูลลูกค้า "${targetName}" เรียบร้อยแล้ว`);
    });
  };

  const stats = useMemo(() => {
    let eligibleToday = 0;
    let eligibleAll = 0;
    let blocked = 0;

    for (const c of customers) {
      const canReceive = c.consent_given && !c.unsubscribed;
      if (canReceive) {
        eligibleAll += 1;
        if (isBirthdayToday(c, todayMonth, todayDay, isNonLeapFeb28)) {
          eligibleToday += 1;
        }
      } else {
        blocked += 1;
      }
    }

    return {
      total: customers.length,
      eligibleToday,
      eligibleAll,
      blocked,
      logsCount: emailLogs.length,
    };
  }, [customers, emailLogs.length, isNonLeapFeb28, todayDay, todayMonth]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesQuery =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      switch (statusFilter) {
        case "eligible":
          return c.consent_given && !c.unsubscribed;
        case "birthday_today":
          return (
            c.consent_given &&
            !c.unsubscribed &&
            isBirthdayToday(c, todayMonth, todayDay, isNonLeapFeb28)
          );
        case "no_consent":
          return !c.consent_given;
        case "unsubscribed":
          return c.unsubscribed;
        default:
          return true;
      }
    });
  }, [customers, isNonLeapFeb28, searchQuery, statusFilter, todayDay, todayMonth]);

  const maxDays = getMaxDaysInMonth(formMonth);
  const clampedDay = Math.min(formDay, maxDays);
  const maxPreviewDays = getMaxDaysInMonth(previewMonth);
  const clampedPreviewDay = Math.min(previewDay, maxPreviewDays);

  const handleRunPreview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      const res = await fetch(
        `/api/admin/test-mode/preview?month=${previewMonth}&day=${clampedPreviewDay}`
      );
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error ?? "ไม่สามารถดึงข้อมูล Preview ได้");
        setPreviewResult(null);
      } else {
        setPreviewResult(data);
      }
    } catch {
      setPreviewError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      setPreviewResult(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleTestSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestSendMessage(null);
    try {
      const res = await fetch("/api/admin/test-mode/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: effectiveTestCustomerId,
          testRecipientEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestSendMessage({
          type: "error",
          text: data.error ?? "ส่งอีเมลทดสอบไม่สำเร็จ",
        });
      } else {
        setTestSendMessage({
          type: "success",
          text: `ส่งอีเมลทดสอบ [TEST] สำหรับคุณ "${data.customerName}" ไปที่ ${data.recipientEmail} และบันทึกลง email_log แล้ว (ID: ${data.messageId})`,
        });
        router.refresh();
      }
    } catch {
      setTestSendMessage({
        type: "error",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <section aria-label="สรุปภาพรวมระบบ" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-4">
          <p className="text-xs font-medium text-[var(--birthday-muted)]">
            ลูกค้าจำลองทั้งหมด
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--birthday-text)]">
            {stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-4">
          <p className="text-xs font-medium text-[var(--birthday-muted)]">
            เกิดวันนี้ &amp; พร้อมส่ง
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--birthday-success)]">
            {stats.eligibleToday}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-4">
          <p className="text-xs font-medium text-[var(--birthday-muted)]">
            ไม่ยินยอม / ยกเลิกแล้ว
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--birthday-primary)]">
            {stats.blocked}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-4">
          <p className="text-xs font-medium text-[var(--birthday-muted)]">
            ประวัติการส่ง (Log)
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--birthday-text)]">
            {stats.logsCount}
          </p>
        </div>
      </section>

      {bannerMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-soft)] px-4 py-3 text-sm text-[var(--birthday-text)]"
        >
          <span className="flex items-center gap-2">
            <CircleCheck size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-[var(--birthday-success)]" />
            <span>{bannerMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="rounded px-2 py-1 text-xs font-medium text-[var(--birthday-primary)] hover:bg-[var(--birthday-surface)]/70"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Accessible Tabs */}
      <section className="rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-5 sm:p-6">
        <div
          role="tablist"
          aria-label="หมวดหมู่ข้อมูลแอดมิน"
          className="admin-tablist mb-5 flex gap-6 border-b border-[var(--birthday-border)]"
        >
          <button
            type="button"
            role="tab"
            id="tab-customers"
            aria-selected={activeTab === "customers"}
            onClick={() => setActiveTab("customers")}
            className="admin-tab min-h-11 px-1 pb-3 text-sm font-medium text-[var(--birthday-muted)] transition-colors hover:text-[var(--birthday-text)] aria-selected:text-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            รายชื่อลูกค้าจำลอง ({customers.length})
          </button>
          <button
            type="button"
            role="tab"
            id="tab-logs"
            aria-selected={activeTab === "logs"}
            onClick={() => setActiveTab("logs")}
            className="admin-tab min-h-11 px-1 pb-3 text-sm font-medium text-[var(--birthday-muted)] transition-colors hover:text-[var(--birthday-text)] aria-selected:text-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            ประวัติการส่งอีเมล ({emailLogs.length})
          </button>
          <button
            type="button"
            role="tab"
            id="tab-test"
            aria-selected={activeTab === "test"}
            onClick={() => setActiveTab("test")}
            className="admin-tab min-h-11 px-1 pb-3 text-sm font-medium text-[var(--birthday-muted)] transition-colors hover:text-[var(--birthday-text)] aria-selected:text-[var(--birthday-primary)] focus-visible:outline-2 focus-visible:outline-[var(--birthday-primary)]"
          >
            โหมดทดสอบ (Test Mode)
          </button>
        </div>

        {/* Panel 1: Customers */}
        <div
          role="tabpanel"
          id="panel-customers"
          aria-labelledby="tab-customers"
          hidden={activeTab !== "customers"}
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <search className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1">
                <label
                  htmlFor="customer-search"
                  className="text-xs font-medium text-[var(--birthday-text)]"
                >
                  ค้นหาชื่อหรืออีเมล
                </label>
                <input
                  id="customer-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์ชื่อหรืออีเมลลูกค้าจำลอง..."
                  className="min-h-11 w-full rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3.5 text-sm text-[var(--birthday-text)] outline-none focus-visible:border-[var(--birthday-primary)] focus-visible:ring-2 focus-visible:ring-[var(--birthday-primary)]"
                />
              </div>
              <div className="flex flex-col gap-1 sm:w-56">
                <label
                  htmlFor="customer-filter"
                  className="text-xs font-medium text-[var(--birthday-text)]"
                >
                  กรองตามสถานะ
                </label>
                <select
                  id="customer-filter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)] outline-none focus-visible:border-[var(--birthday-primary)] focus-visible:ring-2 focus-visible:ring-[var(--birthday-primary)]"
                >
                  <option value="all">ทั้งหมด ({customers.length})</option>
                  <option value="eligible">
                    พร้อมส่ง ({stats.eligibleAll})
                  </option>
                  <option value="birthday_today">
                    เกิดวันนี้ &amp; พร้อมส่ง ({stats.eligibleToday})
                  </option>
                  <option value="no_consent">ยังไม่ยินยอม</option>
                  <option value="unsubscribed">ยกเลิกรับอีเมลแล้ว</option>
                </select>
              </div>
            </search>

            <button
              type="button"
              onClick={openAddDialog}
              className="min-h-11 shrink-0 rounded-lg bg-[var(--birthday-primary)] px-4 py-2.5 text-sm font-medium text-[var(--birthday-on-primary)] transition-colors hover:bg-[var(--birthday-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--birthday-primary)]"
            >
              + เพิ่มลูกค้าจำลอง
            </button>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--birthday-border)] px-4 py-10 text-center text-sm text-[var(--birthday-muted)]">
              ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="customers-table-caption"
              className="admin-table-wrapper rounded-xl border border-[var(--birthday-border)]"
            >
              <table className="admin-responsive-table customers-table w-full text-left text-sm">
                <caption id="customers-table-caption" className="sr-only">
                  รายชื่อลูกค้าจำลองสำหรับระบบส่งอีเมลอวยพรวันเกิด
                </caption>
                <thead className="bg-[var(--birthday-bg)] text-xs font-semibold text-[var(--birthday-text)]">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      ชื่อ-นามสกุล
                    </th>
                    <th scope="col" className="px-4 py-3">
                      อีเมล
                    </th>
                    <th scope="col" className="px-4 py-3">
                      วันเกิด
                    </th>
                    <th scope="col" className="px-4 py-3">
                      ความยินยอม
                    </th>
                    <th scope="col" className="px-4 py-3">
                      การรับอีเมล
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--birthday-border)]">
                  {filteredCustomers.map((customer) => {
                    const bdayToday = isBirthdayToday(
                      customer,
                      todayMonth,
                      todayDay,
                      isNonLeapFeb28
                    );
                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-[var(--birthday-bg)]/60"
                      >
                        <th
                          scope="row"
                          className="px-4 py-3 font-medium text-[var(--birthday-text)]"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{customer.full_name}</span>
                            {bdayToday && (
                              <span className="inline-flex items-center rounded-full bg-[var(--birthday-soft)] px-2 py-0.5 text-xs font-medium text-[var(--birthday-primary)]">
                                เกิดวันนี้
                              </span>
                            )}
                          </div>
                        </th>
                        <td className="px-4 py-3 text-[var(--birthday-muted)]">
                          {customer.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[var(--birthday-muted)]">
                          {formatThaiBirthday(
                            customer.birth_month,
                            customer.birth_day
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {customer.consent_given ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-success)]">
                              ยินยอม
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[var(--birthday-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-muted)]">
                              ไม่ยินยอม
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {customer.unsubscribed ? (
                            <span className="inline-flex items-center rounded-full bg-[var(--birthday-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-error)]">
                              ยกเลิกแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-success)]">
                              รับอีเมล
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditDialog(customer)}
                              className="min-h-9 rounded-md border border-[var(--birthday-border)] px-3 py-1 text-xs font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)] focus-visible:outline-2 focus-visible:outline-[var(--birthday-primary)]"
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteDialog(customer)}
                              className="min-h-9 rounded-md border border-[var(--birthday-soft)] px-3 py-1 text-xs font-medium text-[var(--birthday-error)] hover:bg-[var(--birthday-soft)] focus-visible:outline-2 focus-visible:outline-[var(--birthday-error)]"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel 2: Email Logs */}
        <div
          role="tabpanel"
          id="panel-logs"
          aria-labelledby="tab-logs"
          hidden={activeTab !== "logs"}
        >
          {emailLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--birthday-border)] px-4 py-10 text-center text-sm text-[var(--birthday-muted)]">
              ยังไม่มีประวัติการส่งอีเมล
            </div>
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="logs-table-caption"
              className="admin-table-wrapper rounded-xl border border-[var(--birthday-border)]"
            >
              <table className="admin-responsive-table logs-table w-full text-left text-sm">
                <caption id="logs-table-caption" className="sr-only">
                  ประวัติการส่งอีเมลอวยพรวันเกิด
                </caption>
                <thead className="bg-[var(--birthday-bg)] text-xs font-semibold text-[var(--birthday-text)]">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      วันเวลาที่ส่ง
                    </th>
                    <th scope="col" className="px-4 py-3">
                      ลูกค้า
                    </th>
                    <th scope="col" className="px-4 py-3">
                      อีเมลปลายทาง
                    </th>
                    <th scope="col" className="px-4 py-3">
                      ปีที่ส่ง
                    </th>
                    <th scope="col" className="px-4 py-3">
                      ประเภท
                    </th>
                    <th scope="col" className="px-4 py-3">
                      ผลลัพธ์
                    </th>
                    <th scope="col" className="px-4 py-3">
                      รายละเอียด
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--birthday-border)]">
                  {emailLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[var(--birthday-bg)]/60"
                    >
                      <th
                        scope="row"
                        className="px-4 py-3 whitespace-nowrap font-medium text-[var(--birthday-text)]"
                      >
                        {formatBangkokDateTime(log.sent_at)}
                      </th>
                      <td className="px-4 py-3 text-[var(--birthday-muted)]">
                        {log.customers?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--birthday-muted)]">
                        {log.recipient_email}
                      </td>
                      <td className="px-4 py-3 text-[var(--birthday-muted)]">
                        {log.sent_year}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.is_test ? (
                          <span className="inline-flex items-center rounded-full bg-[var(--birthday-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-primary)]">
                            ทดสอบ
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[var(--birthday-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-text)]">
                            ส่งจริง
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.status === "sent" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-success)]">
                            ส่งสำเร็จ
                          </span>
                        )}
                        {log.status === "test" && (
                          <span className="inline-flex items-center rounded-full bg-[var(--birthday-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-primary)]">
                            ส่งทดสอบแล้ว
                          </span>
                        )}
                        {log.status === "failed" && (
                          <span className="inline-flex items-center rounded-full bg-[var(--birthday-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--birthday-error)]">
                            ล้มเหลว
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--birthday-muted)]">
                        {log.error_message || log.provider_message_id || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel 3: Test Mode */}
        <div
          role="tabpanel"
          id="panel-test"
          aria-labelledby="tab-test"
          hidden={activeTab !== "test"}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Dry-Run / Preview */}
            <section className="rounded-xl border border-[var(--birthday-border)] p-5">
              <h2 className="text-base font-semibold text-[var(--birthday-text)]">
                1. ดูรายชื่อผู้มีสิทธิ์รับอีเมล (Preview / Dry-Run)
              </h2>
              <p className="mt-1 text-xs text-[var(--birthday-muted)]">
                จำลองวันที่เพื่อตรวจสอบว่าใครเข้าเกณฑ์ได้รับอีเมลบ้าง
                (ยังไม่ยิงอีเมลออกจริง)
              </p>

              <form onSubmit={handleRunPreview} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="preview-month" className="text-xs font-medium text-[var(--birthday-text)]">
                      เดือนที่จำลอง
                    </label>
                    <select
                      id="preview-month"
                      value={previewMonth}
                      onChange={(e) => setPreviewMonth(Number(e.target.value))}
                      className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)]"
                    >
                      {THAI_MONTHS.map((name, idx) => (
                        <option key={name} value={idx + 1}>
                          {idx + 1} - {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="preview-day" className="text-xs font-medium text-[var(--birthday-text)]">
                      วันที่จำลอง
                    </label>
                    <select
                      id="preview-day"
                      value={clampedPreviewDay}
                      onChange={(e) => setPreviewDay(Number(e.target.value))}
                      className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)]"
                    >
                      {Array.from(
                        { length: maxPreviewDays },
                        (_, idx) => idx + 1
                      ).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPreviewing}
                  className="min-h-11 w-full rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-bg)] px-4 py-2 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-soft)] disabled:opacity-60"
                >
                  {isPreviewing
                    ? "กำลังตรวจสอบรายชื่อ..."
                    : "ดูรายชื่อที่จะได้รับเมล (Dry-Run)"}
                </button>
              </form>

              {previewError && (
                <div
                  role="status"
                  className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--birthday-soft)] px-3.5 py-2.5 text-sm text-[var(--birthday-error)]"
                >
                  <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

              {previewResult && (
                <div className="mt-4 space-y-2 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-bg)] p-3.5 text-sm">
                  <p className="font-medium text-[var(--birthday-text)]">
                    วันที่จำลอง:{" "}
                    {formatThaiBirthday(
                      previewResult.targetDate.month,
                      previewResult.targetDate.day
                    )}{" "}
                    ({previewResult.eligible.length} คนที่เข้าเกณฑ์
                    {previewResult.skippedAlreadySentCount > 0
                      ? `, ข้ามที่ส่งแล้วในปีนี้ ${previewResult.skippedAlreadySentCount} คน`
                      : ""}
                    )
                  </p>
                  {previewResult.eligible.length === 0 ? (
                    <p className="text-xs text-[var(--birthday-muted)]">
                      ไม่มีลูกค้าที่เข้าเกณฑ์ส่งอีเมลในวันที่เลือก
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs">
                      {previewResult.eligible.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded bg-[var(--birthday-surface)] px-2.5 py-1.5"
                        >
                          <span className="font-medium text-[var(--birthday-text)]">{item.full_name}</span>
                          <span className="text-[var(--birthday-muted)]">{item.email}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            {/* Test Send */}
            <section className="rounded-xl border border-[var(--birthday-border)] p-5">
              <h2 className="text-base font-semibold text-[var(--birthday-text)]">
                2. ส่งอีเมลทดสอบจริง ([TEST] Send)
              </h2>
              <p className="mt-1 text-xs text-[var(--birthday-muted)]">
                เลือกลูกค้าจำลอง 1 คนแล้วส่งเข้าอีเมลผู้ทดสอบ (หัวข้อขึ้นต้นด้วย{" "}
                <code>[TEST]</code> และบันทึกเป็น <code>is_test = true</code>)
              </p>

              <form onSubmit={handleTestSend} className="mt-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="test-customer-select"
                    className="text-xs font-medium text-[var(--birthday-text)]"
                  >
                    เลือกลูกค้าจำลองสำหรับสร้างข้อความอวยพร
                  </label>
                  <select
                    id="test-customer-select"
                    value={effectiveTestCustomerId}
                    onChange={(e) => setTestCustomerId(e.target.value)}
                    required
                    className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)]"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({formatThaiBirthday(c.birth_month, c.birth_day)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="test-recipient-email"
                    className="text-xs font-medium text-[var(--birthday-text)]"
                  >
                    อีเมลผู้ทดสอบ (เช่น อีเมลที่ใช้สมัคร Resend)
                  </label>
                  <input
                    id="test-recipient-email"
                    type="email"
                    required
                    spellCheck={false}
                    autoCapitalize="none"
                    value={testRecipientEmail}
                    onChange={(e) => setTestRecipientEmail(e.target.value)}
                    placeholder="your-resend-email@example.com"
                    className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingTest || customers.length === 0}
                  className="min-h-11 w-full rounded-lg bg-[var(--birthday-primary)] px-4 py-2 text-sm font-medium text-[var(--birthday-on-primary)] hover:bg-[var(--birthday-primary-hover)] disabled:opacity-60"
                >
                  {isSendingTest
                    ? "กำลังส่งอีเมลทดสอบ..."
                    : "ส่งอีเมลทดสอบ ([TEST])"}
                </button>
              </form>

              {testSendMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-4 flex items-start gap-2 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-soft)] px-3.5 py-2.5 text-sm ${
                    testSendMessage.type === "success"
                      ? "text-[var(--birthday-text)]"
                      : "text-[var(--birthday-error)]"
                  }`}
                >
                  {testSendMessage.type === "success" ? (
                    <CircleCheck size={18} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--birthday-success)]" />
                  ) : (
                    <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                  )}
                  <span>{testSendMessage.text}</span>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      {/* Native Modal Dialog: Add / Edit Customer */}
      <dialog
        ref={formDialogRef}
        aria-labelledby="customer-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          closeFormDialog();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-6 text-[var(--birthday-text)] shadow-lg backdrop:bg-black/40"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="customer-dialog-title" className="text-lg font-semibold text-[var(--birthday-text)]">
            {editingCustomer ? "แก้ไขข้อมูลลูกค้าจำลอง" : "เพิ่มลูกค้าจำลองใหม่"}
          </h2>
          <button
            type="button"
            onClick={closeFormDialog}
            aria-label="ปิดหน้าต่าง"
            className="min-h-9 min-w-9 rounded-lg text-sm text-[var(--birthday-muted)] hover:bg-[var(--birthday-bg)]"
          >
            ✕
          </button>
        </div>

        <form
          key={`${editingCustomer?.id ?? "new"}-${formKey}`}
          onSubmit={handleFormSubmit}
          className="space-y-4"
        >
          {editingCustomer && (
            <input type="hidden" name="id" value={editingCustomer.id} />
          )}

          {formError && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-lg bg-[var(--birthday-soft)] px-3.5 py-2.5 text-sm text-[var(--birthday-error)]"
            >
              <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="form-full-name" className="text-sm font-medium text-[var(--birthday-text)]">
              ชื่อ-นามสกุล (จำลอง) <span className="text-[var(--birthday-primary)]">*</span>
            </label>
            <input
              id="form-full-name"
              name="full_name"
              type="text"
              required
              autoFocus
              defaultValue={editingCustomer?.full_name ?? ""}
              placeholder="เช่น สมชาย ใจดี"
              className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)] outline-none focus-visible:border-[var(--birthday-primary)] focus-visible:ring-2 focus-visible:ring-[var(--birthday-primary)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="form-email" className="text-sm font-medium text-[var(--birthday-text)]">
              อีเมล (จำลอง) <span className="text-[var(--birthday-primary)]">*</span>
            </label>
            <input
              id="form-email"
              name="email"
              type="email"
              required
              spellCheck={false}
              autoCapitalize="none"
              defaultValue={editingCustomer?.email ?? ""}
              placeholder="somchai.mock@example.com"
              className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)] outline-none focus-visible:border-[var(--birthday-primary)] focus-visible:ring-2 focus-visible:ring-[var(--birthday-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="form-birth-month" className="text-sm font-medium text-[var(--birthday-text)]">
                เดือนเกิด <span className="text-[var(--birthday-primary)]">*</span>
              </label>
              <select
                id="form-birth-month"
                name="birth_month"
                value={formMonth}
                onChange={(e) => setFormMonth(Number(e.target.value))}
                className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)] outline-none focus-visible:border-[var(--birthday-primary)] focus-visible:ring-2 focus-visible:ring-[var(--birthday-primary)]"
              >
                {THAI_MONTHS.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {idx + 1} - {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="form-birth-day" className="text-sm font-medium text-[var(--birthday-text)]">
                วันที่เกิด <span className="text-[var(--birthday-primary)]">*</span>
              </label>
              <select
                id="form-birth-day"
                name="birth_day"
                value={clampedDay}
                onChange={(e) => setFormDay(Number(e.target.value))}
                className="min-h-11 rounded-lg border border-[var(--birthday-border)] bg-[var(--birthday-surface)] px-3 text-sm text-[var(--birthday-text)] outline-none focus-visible:border-[var(--birthday-primary)] focus-visible:ring-2 focus-visible:ring-[var(--birthday-primary)]"
              >
                {Array.from({ length: maxDays }, (_, idx) => idx + 1).map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-bg)]/50 p-3.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--birthday-text)]">
              <input
                type="checkbox"
                name="consent_given"
                defaultChecked={editingCustomer?.consent_given ?? true}
                className="h-4 w-4 accent-[var(--birthday-primary)]"
              />
              <span>ลูกค้าให้ความยินยอมรับอีเมลอวยพร (Consent)</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--birthday-text)]">
              <input
                type="checkbox"
                name="unsubscribed"
                defaultChecked={editingCustomer?.unsubscribed ?? false}
                className="h-4 w-4 accent-[var(--birthday-primary)]"
              />
              <span>ยกเลิกรับอีเมลแล้ว (Unsubscribed)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeFormDialog}
              className="min-h-11 rounded-lg border border-[var(--birthday-border)] px-4 py-2 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmittingForm}
              className="min-h-11 rounded-lg bg-[var(--birthday-primary)] px-4 py-2 text-sm font-medium text-[var(--birthday-on-primary)] hover:bg-[var(--birthday-primary-hover)] disabled:opacity-60"
            >
              {isSubmittingForm
                ? "กำลังบันทึก..."
                : editingCustomer
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มลูกค้า"}
            </button>
          </div>
        </form>
      </dialog>

      {/* Native Modal Dialog: Confirm Delete */}
      <dialog
        ref={deleteDialogRef}
        aria-labelledby="delete-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          closeDeleteDialog();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-[var(--birthday-border)] bg-[var(--birthday-surface)] p-6 text-[var(--birthday-text)] shadow-lg backdrop:bg-black/40"
      >
        <h2 id="delete-dialog-title" className="text-lg font-semibold text-[var(--birthday-text)]">
          ยืนยันการลบข้อมูลลูกค้า
        </h2>
        <p className="mt-2 text-sm text-[var(--birthday-muted)]">
          ต้องการลบลูกค้า{" "}
          <span className="font-semibold text-[var(--birthday-text)]">
            {deletingCustomer?.full_name}
          </span>{" "}
          ({deletingCustomer?.email}) ออกจากระบบใช่หรือไม่?
          ประวัติการส่งที่ผูกกับลูกค้ารายนี้จะถูกลบด้วย
        </p>

        {deleteError && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--birthday-soft)] px-3 py-2 text-sm text-[var(--birthday-error)]"
          >
            <AlertCircle size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
            <span>{deleteError}</span>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            autoFocus
            onClick={closeDeleteDialog}
            disabled={isDeleting}
            className="min-h-11 rounded-lg border border-[var(--birthday-border)] px-4 py-2 text-sm font-medium text-[var(--birthday-text)] hover:bg-[var(--birthday-bg)]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="min-h-11 rounded-lg bg-[var(--birthday-error)] px-4 py-2 text-sm font-medium text-[var(--birthday-on-primary)] hover:opacity-90 disabled:opacity-60"
          >
            {isDeleting ? "กำลังลบ..." : "ยืนยันลบข้อมูล"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
