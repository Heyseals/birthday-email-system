-- เฟส 5: ฟีเจอร์เสริม (แจ้งเตือนล่วงหน้า 3 วัน และส่งผ่าน LINE)

BEGIN;

-- 1. เพิ่มคอลัมน์ในตาราง customers (ไม่กระทบข้อมูลเดิม)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS advance_reminded_year integer NULL,
  ADD COLUMN IF NOT EXISTS line_user_id text NULL,
  ADD COLUMN IF NOT EXISTS notify_line boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS customers_advance_reminded_year_idx
  ON public.customers (advance_reminded_year);

COMMIT;
