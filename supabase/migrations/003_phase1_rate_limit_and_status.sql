-- เฟส 1: เพิ่มสถานะ 'unsubscribed' ให้ customers และสร้างระบบ rate_limits แบบ atomic บน Supabase

BEGIN;

-- 1. เพิ่ม CHECK constraint ของ customers.status ให้รองรับ 'unsubscribed'
-- (จากการตรวจสอบ pg_constraint ไม่พบ check constraint เดิมของ status)
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_status_check;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_status_check
  CHECK (status IN ('pending', 'confirmed', 'unsubscribed'));

-- 2. ตาราง rate_limits แบบ persistent (ใช้แทน in-memory Map บน Vercel)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx
  ON public.rate_limits (reset_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 3. ฟังก์ชัน SQL แบบ atomic สำหรับตรวจสอบและอัปเดต rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_now timestamptz := now();
  v_new_reset_at timestamptz := v_now + make_interval(secs => p_window_seconds);
BEGIN
  INSERT INTO public.rate_limits (key, count, reset_at)
  VALUES (p_key, 1, v_new_reset_at)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN public.rate_limits.reset_at <= v_now THEN 1
      ELSE public.rate_limits.count + 1
    END,
    reset_at = CASE
      WHEN public.rate_limits.reset_at <= v_now THEN v_new_reset_at
      ELSE public.rate_limits.reset_at
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

-- จำกัดสิทธิ์ให้เรียกได้เฉพาะ service_role เท่านั้น
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

COMMIT;
