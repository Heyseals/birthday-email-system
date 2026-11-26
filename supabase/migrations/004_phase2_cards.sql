-- เฟส 2: ตาราง cards, เชื่อม customers กับการ์ด, และ Storage bucket 'cards'

BEGIN;

-- 1. สร้างตาราง cards
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NULL,
  title text NOT NULL DEFAULT 'การ์ดอวยพรวันเกิด',
  canvas_json jsonb NOT NULL,
  image_path text NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cards_is_public_idx ON public.cards (is_public);
CREATE INDEX IF NOT EXISTS cards_owner_id_idx ON public.cards (owner_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตให้อ่านสาธารณะได้เฉพาะการ์ดที่ is_public = true
DROP POLICY IF EXISTS "Public can read public cards" ON public.cards;
CREATE POLICY "Public can read public cards"
  ON public.cards
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- 2. เพิ่มคอลัมน์ใน customers (ใช้ ALTER TABLE เท่านั้น)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS card_id uuid NULL REFERENCES public.cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_message text NULL,
  ADD COLUMN IF NOT EXISTS sender_name text NULL,
  ADD COLUMN IF NOT EXISTS personalized_card_path text NULL;

CREATE INDEX IF NOT EXISTS customers_card_id_idx ON public.customers (card_id);

-- 3. สร้าง Supabase Storage bucket 'cards' (อ่านสาธารณะได้ จำกัดขนาด 5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cards', 'cards', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- Policy สำหรับ bucket 'cards': อนุญาตให้อ่านสาธารณะได้
DROP POLICY IF EXISTS "Public read access for cards bucket" ON storage.objects;
CREATE POLICY "Public read access for cards bucket"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'cards');

COMMIT;
