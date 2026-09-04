import { createClient } from '@supabase/supabase-js'

// รับเฉพาะ Project URL (origin) — เผื่อเผลอวาง RESTful endpoint (.../rest/v1)
// หรือมี / ต่อท้าย ให้ตัดออกอัตโนมัติ
function normalizeUrl(raw: string | undefined): string {
  if (!raw) return ''
  return raw.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}

const url = normalizeUrl(import.meta.env.VITE_SUPABASE_URL)
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!url || !anon) {
  // ช่วยเตือนตอน dev ถ้ายังไม่ได้ตั้งค่า .env
  // VITE_SUPABASE_ANON_KEY รับได้ทั้ง publishable key (sb_publishable_...) และ anon legacy (eyJ...)
  console.warn(
    '[supabase] ยังไม่ได้ตั้ง VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — คัดลอก .env.example เป็น .env แล้วใส่ค่า'
  )
}

// fallback รูปแบบถูกต้อง เพื่อให้แอป render ได้แม้ยังไม่ได้ตั้งค่า .env
// (auth/query จะ fail จนกว่าจะใส่ค่าจริง — ดูคำเตือนด้านบน)
const FALLBACK_URL = 'https://placeholder.supabase.co'
const FALLBACK_KEY = 'public-anon-key-placeholder'

export const supabase = createClient(url || FALLBACK_URL, anon || FALLBACK_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
