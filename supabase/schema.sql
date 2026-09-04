-- ============================================================
-- Rainbow Drinking Water — Database schema
-- Run this in Supabase SQL Editor (or via `supabase db push`)
-- ============================================================

-- --------- Enums ---------
do $$ begin
  create type deliverer_mode as enum ('village', 'day');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('admin', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type currency_code as enum ('THB', 'MMK');
exception when duplicate_object then null; end $$;

-- --------- profiles ---------
-- Extends auth.users. One row per app user.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,                       -- ชื่อผู้ใช้สำหรับ login (map เป็น email ภายใน)
  full_name text not null default '',
  role app_role not null default 'staff',
  lang text not null default 'th',          -- 'th' | 'my'
  currency currency_code not null default 'THB',
  theme text not null default 'light',       -- 'light' | 'dark'
  created_at timestamptz not null default now()
);

-- เผื่อกรณีเคยรัน schema เวอร์ชันก่อนแล้ว (idempotent)
alter table public.profiles add column if not exists username text;
do $$ begin
  alter table public.profiles add constraint profiles_username_key unique (username);
exception when duplicate_object then null; end $$;

-- --------- villages ---------
create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --------- deliverers (คนส่ง) ---------
create table if not exists public.deliverers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mode deliverer_mode not null default 'village',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --------- deliverer_villages (คนส่ง <-> หมู่บ้าน, เมื่อ mode = village) ---------
create table if not exists public.deliverer_villages (
  deliverer_id uuid not null references public.deliverers(id) on delete cascade,
  village_id uuid not null references public.villages(id) on delete cascade,
  primary key (deliverer_id, village_id)
);

-- --------- delivery_records (การส่งน้ำ / ยอดค้าง) ---------
-- village_id ใช้เมื่อ deliverer mode = village
-- day_of_week (0=อาทิตย์..6=เสาร์) ใช้เมื่อ mode = day
create table if not exists public.delivery_records (
  id uuid primary key default gen_random_uuid(),
  deliverer_id uuid not null references public.deliverers(id) on delete cascade,
  village_id uuid references public.villages(id) on delete set null,
  day_of_week smallint check (day_of_week between 0 and 6),
  house_no text not null default '',        -- บ้านเลขที่ เช่น "29/3"
  quantity numeric not null default 0,      -- จำนวนถัง/หน่วย
  amount numeric not null default 0,        -- ยอดเงิน
  currency currency_code not null default 'THB',
  paid boolean not null default false,      -- ชำระแล้วหรือยัง
  note text default '',
  delivered_at date not null default current_date,
  created_at timestamptz not null default now(),
  deleted_at timestamptz                    -- soft delete: "ลบเวลาลูกค้าหนีแล้ว"
);

create index if not exists idx_delivery_deliverer on public.delivery_records(deliverer_id) where deleted_at is null;
create index if not exists idx_delivery_village on public.delivery_records(village_id) where deleted_at is null;
create index if not exists idx_dv_deliverer on public.deliverer_villages(deliverer_id);

-- ============================================================
-- Row Level Security
-- ทุกคนที่ login แล้ว (มี profile) อ่าน/เขียนข้อมูลงานได้
-- เฉพาะ admin จัดการ profiles ของคนอื่นได้
-- ============================================================
alter table public.profiles enable row level security;
alter table public.villages enable row level security;
alter table public.deliverers enable row level security;
alter table public.deliverer_villages enable row level security;
alter table public.delivery_records enable row level security;

-- helper: เช็คว่า current user เป็น admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- profiles: อ่าน profile ตัวเองได้เสมอ; admin อ่านได้หมด
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- อัปเดต profile ตัวเอง (theme/lang/currency); admin อัปเดตได้หมด
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- admin เท่านั้นที่ insert/delete profile (ผ่าน edge function)
drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert with check (public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete using (public.is_admin());

-- data tables: authenticated ทำได้ทุกอย่าง
do $$
declare t text;
begin
  foreach t in array array['villages','deliverers','deliverer_villages','delivery_records']
  loop
    execute format('drop policy if exists %I_all on public.%I', t, t);
    execute format(
      'create policy %I_all on public.%I for all to authenticated using (true) with check (true)',
      t, t
    );
  end loop;
end $$;

-- ============================================================
-- Trigger: สร้าง profile อัตโนมัติเมื่อมี auth user ใหม่
-- (metadata full_name/role ส่งมาตอนสร้าง user)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'staff')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
