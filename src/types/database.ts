export interface Customer {
  id: string;
  full_name: string;
  email: string;
  birth_month: number;
  birth_day: number;
  consent_given: boolean;
  consent_at: string | null;
  unsubscribed: boolean;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  status: "pending" | "confirmed";
  confirm_token: string | null;
  confirm_token_expires_at: string | null;
  manage_token: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  customer_id: string;
  recipient_email: string;
  sent_year: number;
  status: "sent" | "failed" | "test";
  is_test: boolean;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string;
  customers: { full_name: string } | null;
}

export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

export function getMaxDaysInMonth(month: number): number {
  if (month === 2) return 29;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function formatThaiBirthday(month: number, day: number): string {
  const monthName = THAI_MONTHS[month - 1] ?? `เดือน ${month}`;
  return `${day} ${monthName}`;
}
