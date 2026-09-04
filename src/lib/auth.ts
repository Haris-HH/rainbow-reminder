// Supabase Auth ต้องใช้ email — เราให้ผู้ใช้กรอก "username" แล้ว map เป็น email ภายใน
// เช่น "nick" -> "nick@rainbow.local"
// ถ้าผู้ใช้กรอกเป็น email เต็ม (มี @) อยู่แล้ว จะใช้ตามนั้น (รองรับ admin คนแรกที่สร้างด้วย email จริง)
export const AUTH_EMAIL_DOMAIN = 'rainbow.local'

export function usernameToEmail(input: string): string {
  const v = input.trim()
  if (v.includes('@')) return v.toLowerCase()
  return `${v.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`
}

// แปลง email กลับเป็น username สำหรับแสดงผล (ตัด @rainbow.local ออก)
export function emailToUsername(email: string | null | undefined): string {
  if (!email) return ''
  const [local, domain] = email.split('@')
  return domain === AUTH_EMAIL_DOMAIN ? local : email
}
