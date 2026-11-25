-- เพิ่มคอลัมน์สำหรับข้อความอวยพรและรูปภาพแนบในตาราง customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS custom_message text,
  ADD COLUMN IF NOT EXISTS image_attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- สร้าง Storage Bucket สำหรับเก็บรูปภาพอวยพรวันเกิด (Public Read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'birthday-images',
  'birthday-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- อนุญาตให้ทุกคนอ่านรูปภาพใน bucket birthday-images ได้ (สำหรับแสดงในอีเมล)
CREATE POLICY "Public read birthday-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'birthday-images');

-- ไม่อนุญาตให้ anon อัปโหลด/ลบตรงๆ (ต้องผ่าน Server API ที่ใช้ Secret Key เท่านั้น)
