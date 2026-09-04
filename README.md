# Rainbow Drinking Water — ระบบเก็บยอดค้างค่าน้ำ

PWA (ติดตั้งบนมือถือได้, เข้าเว็บที่ไหนก็ได้) สำหรับบันทึกว่า ใคร / หมู่บ้านไหน / ค้างค่าน้ำเท่าไหร่

- **Frontend**: Vite + React + TypeScript + PWA
- **Backend + Database**: Supabase (Postgres, Auth, Edge Functions) — ฟรี
- **รองรับ**: ธีม (สว่าง/มืด), ภาษา (ไทย/พม่า), สกุลเงิน (THB/MMK)

## ฟีเจอร์ (ตาม spec)

1. **Login** — เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน
2. **Dashboard** — รายชื่อคนส่ง → กดเข้าไปดูหมู่บ้าน/วันที่รับผิดชอบ → กดดูรายการส่งน้ำ (เพิ่ม/แก้/ลบ ยอดค้างได้)
3. **หมู่บ้าน** — เพิ่ม/แก้/ลบ + ปุ่มลิงก์ Google Maps
4. **คนส่ง** — เพิ่ม/แก้/ลบ + เลือกได้ว่าส่งเป็น "หมู่บ้าน" หรือ "วัน"
5. **จัดการผู้ใช้** (เฉพาะ admin) — เพิ่ม/แก้/ลบ user ผ่าน Edge Function

> การลบข้อมูลงานเป็น **soft delete** (เก็บ `deleted_at`) เพื่อรักษาประวัติยอดค้างไว้ — ตรงกับโน้ต "ลบเวลาลูกค้าหนีแล้ว"

---

## เริ่มใช้งาน (Setup)

### 1) สร้างโปรเจกต์ Supabase (ฟรี)

1. ไปที่ https://supabase.com → สร้าง project ใหม่
2. เมนู **SQL Editor** → วางเนื้อหาจาก [`supabase/schema.sql`](supabase/schema.sql) → Run
3. คัดลอกค่า 2 ตัว:
   - **Project URL** — Settings → **Data API** → Project URL (หรือปุ่ม **Connect** บน dashboard)
   - **Publishable / anon key** — Settings → **API Keys**
     - แบบใหม่ (แนะนำ): แท็บ *Publishable and secret* → **Publishable key** (`sb_publishable_...`)
     - แบบเก่า: แท็บ *Legacy anon, service_role* → **anon public** (`eyJ...`)
   - ⚠️ **อย่า**ใช้ secret / service_role key ในฝั่ง frontend

### 2) ตั้งค่า env ในเครื่อง

```bash
cp .env.example .env
```

ใส่ค่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ลงใน `.env`

### 3) ติดตั้ง & รัน

```bash
npm install
npm run dev
```

### 4) สร้าง admin คนแรก

ระบบ login ด้วย **username** (แอป map เป็น email ภายในอัตโนมัติ เช่น `nick` → `nick@rainbow.local`)
เนื่องจากการสร้าง user ต้องใช้สิทธิ์ admin ให้สร้างคนแรกด้วยมือ:

1. Supabase → **Authentication → Users → Add user**
   - Email ใส่เป็น `<username>@rainbow.local` เช่น `admin@rainbow.local`
   - ตั้ง Password, ติ๊ก **Auto Confirm User**
2. Supabase → **SQL Editor** รันเพื่อตั้งชื่อผู้ใช้ + เลื่อนเป็น admin:
   ```sql
   update public.profiles
   set role = 'admin', username = 'admin', full_name = 'ผู้ดูแลระบบ'
   where id = (select id from auth.users where email = 'admin@rainbow.local');
   ```
3. login เข้าแอปด้วย username `admin` + รหัสผ่าน → ไปเมนู ตั้งค่า → ผู้ใช้งาน เพื่อเพิ่มคนอื่นต่อได้

> หมายเหตุ: ช่อง login รองรับ email เต็มด้วย (ถ้าพิมพ์มี `@`) เผื่อ admin ที่เคยสร้างด้วย email จริง

### 5) Deploy Edge Function (สำหรับหน้าจัดการผู้ใช้)

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase functions deploy admin-users
```

> `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` ปกติถูกตั้งให้อัตโนมัติ
> ถ้าใช้ key แบบใหม่แล้วต้องตั้งเอง:
> ```bash
> npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxx
> npx supabase secrets set SUPABASE_ANON_KEY=sb_publishable_xxxx
> ```

---

## Deploy ขึ้นเว็บฟรี

Build:

```bash
npm run build
```

แล้วอัปโหลดโฟลเดอร์ `dist/` ขึ้น **Vercel / Netlify / Cloudflare Pages** (ฟรีทั้งหมด)
อย่าลืมตั้ง env `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` บนแพลตฟอร์มด้วย

> เป็น SPA — ตั้ง rewrite ให้ทุก path ชี้ไป `index.html` (Netlify: `_redirects` = `/* /index.html 200`)
