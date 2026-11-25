-- ขั้นที่ 10: รองรับระบบลงทะเบียนลูกค้า (Double Opt-in) และลิงก์จัดการข้อมูลตัวเอง
-- หมายเหตุ: คอลัมน์ status มีค่าเริ่มต้นเป็น 'confirmed' เพื่อให้ข้อมูลลูกค้าเดิมไม่ถูกกระทบ

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed')),
  ADD COLUMN IF NOT EXISTS confirm_token text,
  ADD COLUMN IF NOT EXISTS confirm_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS manage_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Index สำหรับค้นหาและกัน token ซ้ำ
CREATE UNIQUE INDEX IF NOT EXISTS customers_confirm_token_idx
  ON public.customers (confirm_token)
  WHERE confirm_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_manage_token_idx
  ON public.customers (manage_token);

CREATE INDEX IF NOT EXISTS customers_status_idx
  ON public.customers (status);

-- ยืนยันว่าเปิด RLS บนตาราง customers ไว้เสมอ (ห้าม anon เขียนหรืออ่านตรงๆ)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
