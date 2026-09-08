import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * subscribe การเปลี่ยนแปลง (insert/update/delete) ของตารางที่ระบุ
 * แล้วเรียก onChange (debounce) เพื่อ reload ข้อมูล
 * -> ถ้ามีผู้ใช้อีกคนแก้ข้อมูล เราจะเห็น update อัตโนมัติ
 *
 * ต้องเปิด Realtime ให้ตารางใน Supabase ก่อน (ดู schema.sql ส่วน publication)
 */
export function useRealtime(tables: string[], onChange: () => void) {
  const cb = useRef(onChange)
  cb.current = onChange
  const key = tables.join(',')

  useEffect(() => {
    let timer: number | undefined
    const trigger = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => cb.current(), 250)
    }

    const channel = supabase.channel(`rt:${key}:${Math.random().toString(36).slice(2)}`)
    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        trigger
      )
    }
    channel.subscribe()

    return () => {
      window.clearTimeout(timer)
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
