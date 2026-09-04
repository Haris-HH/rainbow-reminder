// Supabase Edge Function: admin-users
// จัดการ user (สร้าง/ลบ/แก้) — ต้องเป็น admin เท่านั้น
// ใช้ service_role key ฝั่ง server (ปลอดภัย ไม่หลุดไป frontend)
//
// deploy: supabase functions deploy admin-users
// ต้องมี env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// (ปกติ Supabase ใส่ให้อัตโนมัติตอน deploy)
// ถ้าใช้ key แบบใหม่และต้องตั้งเอง:
//   SUPABASE_SERVICE_ROLE_KEY = secret key (sb_secret_...)  หรือ service_role legacy (eyJ...)
//   SUPABASE_ANON_KEY         = publishable key (sb_publishable_...) หรือ anon legacy (eyJ...)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // 1) ยืนยันตัวตนผู้เรียก จาก JWT ที่ส่งมา
    const authHeader = req.headers.get('Authorization') ?? ''
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: authErr,
    } = await caller.auth.getUser()
    if (authErr || !user) {
      return json({ error: 'unauthorized' }, 401)
    }

    // 2) เช็คว่าเป็น admin
    const admin = createClient(url, serviceKey)
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return json({ error: 'forbidden: admin only' }, 403)
    }

    // 3) ทำงานตาม action
    const body = await req.json()
    const action = body.action as string

    if (action === 'create') {
      const { username, password, full_name, role } = body
      const uname = String(username ?? '').trim().toLowerCase()
      if (!uname) return json({ error: 'ต้องระบุ username' }, 400)
      // map username -> email ภายใน (ต้องตรงกับ AUTH_EMAIL_DOMAIN ใน frontend)
      const email = uname.includes('@') ? uname : `${uname}@rainbow.local`
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: role ?? 'staff', username: uname },
      })
      if (error) return json({ error: error.message }, 400)
      return json({ user: data.user })
    }

    if (action === 'delete') {
      const { user_id } = body
      if (user_id === user.id) {
        return json({ error: 'ลบบัญชีตัวเองไม่ได้' }, 400)
      }
      const { error } = await admin.auth.admin.deleteUser(user_id)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    if (action === 'update') {
      const { user_id, full_name, role, password } = body
      // อัปเดต profile
      await admin
        .from('profiles')
        .update({ full_name, role })
        .eq('id', user_id)
      // อัปเดตรหัสผ่าน (ถ้าส่งมา)
      if (password) {
        const { error } = await admin.auth.admin.updateUserById(user_id, {
          password,
        })
        if (error) return json({ error: error.message }, 400)
      }
      return json({ ok: true })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
