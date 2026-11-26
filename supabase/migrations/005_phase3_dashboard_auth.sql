-- เฟส 3: เชื่อม customers กับ auth.users (owner_id), เพิ่มสถานะ 'paused', และ RLS สำหรับผู้ใช้ที่ล็อกอิน

BEGIN;

-- 1. เพิ่มคอลัมน์ owner_id ในตาราง customers (ไม่กระทบข้อมูลเดิม)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS owner_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customers_owner_id_idx ON public.customers (owner_id);

-- 2. อัปเดต CHECK constraint ของ status ให้รองรับ 'paused'
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_status_check;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_status_check
  CHECK (status IN ('pending', 'confirmed', 'paused', 'unsubscribed'));

-- 3. RLS Policies สำหรับผู้ใช้ที่ล็อกอิน (authenticated) บนตาราง customers
-- เปิดเฉพาะ SELECT และ DELETE เพื่อป้องกันการแก้ status จาก 'pending' เป็น 'confirmed' เอง
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
CREATE POLICY "Users can delete own customers"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- 4. RLS Policy (SELECT) บนตาราง email_log สำหรับเจ้าของ customer
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_log;
CREATE POLICY "Users can view own email logs"
  ON public.email_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.id = email_log.customer_id
        AND c.owner_id = auth.uid()
    )
  );

-- 5. RLS Policies สำหรับผู้ใช้ที่ล็อกอิน (authenticated) บนตาราง cards
DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;
CREATE POLICY "Users can view own cards"
  ON public.cards
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own cards" ON public.cards;
CREATE POLICY "Users can insert own cards"
  ON public.cards
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own cards" ON public.cards;
CREATE POLICY "Users can update own cards"
  ON public.cards
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own cards" ON public.cards;
CREATE POLICY "Users can delete own cards"
  ON public.cards
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

COMMIT;
