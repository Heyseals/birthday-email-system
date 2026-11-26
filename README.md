# ระบบส่งอีเมลอวยพรวันเกิดอัตโนมัติ (Birthday Email & Card System)

เว็บแอปพลิเคชันสำหรับสร้างการ์ดอวยพรวันเกิดออนไลน์ ตั้งค่าวันเกิดล่วงหน้า (ทั้งของตัวเองและส่งให้คนอื่น) พร้อมระบบส่งอีเมลอวยพรอัตโนมัติทุกเช้าเวลา 08:00 น. (เวลาไทย) และรองรับ PDPA อย่างครบถ้วน

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Database & Auth & Storage:** Supabase (PostgreSQL + RLS + Auth + Storage)
- **Email:** Resend
- **Card Editor:** Konva (`react-konva`) + `jspdf` (Export PNG / PDF ฝั่ง browser)
- **Hosting & Cron:** Vercel + Vercel Schedules

---

## ลำดับการรัน SQL Migrations (Supabase SQL Editor)
รันไฟล์ในโฟลเดอร์ `supabase/migrations/` ตามลำดับ:
1. `001_initial_schema.sql` — ตาราง `customers`, `email_log`, RLS และ Unique Index กันส่งซ้ำ
2. `002_double_opt_in.sql` — รองรับ Double Opt-in (`status`, `confirm_token`, `manage_token`)
3. `003_rate_limits.sql` — ตาราง `rate_limits` และฟังก์ชัน `check_rate_limit`
4. `004_phase2_cards.sql` — ตาราง `cards` และ Storage bucket `cards` (จำกัด 5MB)
5. `005_phase3_dashboard_auth.sql` — เชื่อม `owner_id`, สถานะ `paused`, และ RLS สำหรับผู้ใช้ที่ล็อกอิน
6. `006_phase5_features.sql` — คอลัมน์ `advance_reminded_year`, `line_user_id`, `notify_line`

---

## การตั้งค่า Vercel Environment Variables
ดูรายการตัวแปรทั้งหมดใน `.env.example`:
- **บังคับ:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `ADMIN_EMAILS`
- **เสริม (ไม่บังคับ):** `GEMINI_API_KEY` (มี Fallback ในตัว), `LINE_CHANNEL_ACCESS_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `GIPHY_API_KEY`

---

## หมายเหตุเรื่อง Cron บน Vercel (Hobby vs Pro)
- ไฟล์ `vercel.json` ตั้งค่าเรียก `/api/cron/birthday` ที่ `0 1 * * *` (01:00 UTC = **08:00 น. เวลาไทย**)
- **Vercel Hobby Plan:** รองรับ Cron ได้สูงสุด 1 งาน/วัน และอาจมีความคลาดเคลื่อนของเวลาเล็กน้อย (ช่วง 08:00–08:59 น.)
- **Vercel Pro Plan:** รันตรงเวลาและรองรับความถี่ระดับนาที/ชั่วโมงได้
