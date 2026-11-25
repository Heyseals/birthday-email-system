# สรุปความคืบหน้าโปรเจกต์: ระบบส่งอีเมลอวยพรวันเกิดอัตโนมัติ

- **เป้าหมาย:** เว็บจัดการลูกค้าจำลอง + ส่งอีเมลอวยพรวันเกิดทุกเช้า 08:00 น. (เวลาไทย) เฉพาะผู้ที่ยินยอมและยังไม่ Unsubscribe พร้อมลิงก์ยกเลิก ระบบกันส่งซ้ำ และโหมดทดสอบ
- **Tech Stack:** Next.js (App Router + TS + Tailwind), Supabase (PostgreSQL + Auth + RLS), Resend, Vercel (Deploy + Schedules)
- **ตารางหลัก:** `customers` (ข้อมูลวัน/เดือนเกิด, consent, unsubscribe_token) และ `email_log` (ประวัติส่ง + Unique Index `(customer_id, sent_year)` เมื่อ `status='sent' AND is_test=false`)
- **ข้อบังคับ:** เก็บคีย์ใน `.env.local`/Vercel เท่านั้น, เปิด RLS ทุกตาราง, ใช้ Mock Data เท่านั้น, อัปเดตจากหลังบ้าน/Server เท่านั้น

## สถานะงาน (ทำทีละขั้น)
- [x] **ขั้นที่ 1:** เตรียมบัญชีบริการ (Supabase, Resend, Vercel) — **ผ่านแล้ว**
- [x] **ขั้นที่ 2:** สร้างโปรเจกต์ Next.js + `.env.example` / `.env.local` + `.gitignore` — **ผ่านแล้ว**
- [x] **ขั้นที่ 3:** สร้างตาราง `customers`, `email_log`, Unique Index, เปิด RLS + Policies, เพิ่ม Mock Data 8 รายการ — **ผ่านแล้ว**
- [ ] **ขั้นที่ 4:** ทำระบบล็อกอินแอดมิน (`/login` + ป้องกัน `/admin`) — **ทำเสร็จแล้ว รอผู้ใช้ทดสอบ**
- [ ] **ขั้นที่ 5:** ทำหน้าแอดมินจัดการลูกค้า (CRUD + ค้นหา/กรอง) และดู `email_log`
- [ ] **ขั้นที่ 6:** เชื่อมต่อ Resend + เทมเพลตอีเมล + โหมดทดสอบ (Preview & Test Send)
- [ ] **ขั้นที่ 7:** ทำหน้า `/unsubscribe?token=...` อัปเดตสถานะฝั่ง Server
- [ ] **ขั้นที่ 8:** ทำ Daily Morning Job (`vercel.json` + Vercel Schedules 08:00 น. + กันส่งซ้ำ + กรณี 29 ก.พ.)
- [ ] **ขั้นที่ 9:** Deploy ขึ้น Vercel + ใส่ Env + ทดสอบ End-to-End
