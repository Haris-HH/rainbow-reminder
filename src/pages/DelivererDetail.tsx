import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { Building2, CalendarDays, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Modal } from '@/components/Modal'
import { Reveal } from '@/components/Reveal'
import { Fab } from '@/components/Fab'
import { formatMoney } from '@/lib/format'
import { dayName } from '@/i18n/strings'
import type { Deliverer, DeliveryRecord, Village } from '@/types/database'

// ลำดับการแสดงวัน: จันทร์ -> อาทิตย์
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function DelivererDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, lang, currency } = useSettings()
  const navigate = useNavigate()

  const [deliverer, setDeliverer] = useState<Deliverer | null>(null)
  const [villages, setVillages] = useState<Village[]>([])
  const [days, setDays] = useState<number[]>([])
  const [records, setRecords] = useState<DeliveryRecord[]>([])
  const [allVillages, setAllVillages] = useState<Village[]>([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const [dRes, dvRes, ddRes, recRes] = await Promise.all([
      supabase.from('deliverers').select('*').eq('id', id).single(),
      supabase
        .from('deliverer_villages')
        .select('village_id, villages(*)')
        .eq('deliverer_id', id),
      supabase
        .from('deliverer_days')
        .select('day_of_week')
        .eq('deliverer_id', id),
      supabase
        .from('delivery_records')
        .select('*')
        .eq('deliverer_id', id)
        .is('deleted_at', null),
    ])
    setDeliverer((dRes.data as Deliverer) ?? null)
    // supabase อาจ infer join เป็น array หรือ object — รองรับทั้งสองแบบ
    const vs = ((dvRes.data ?? []) as Array<{ villages: Village | Village[] | null }>)
      .flatMap((r) => (Array.isArray(r.villages) ? r.villages : r.villages ? [r.villages] : []))
    setVillages(vs.sort((a, b) => a.name.localeCompare(b.name)))
    const ds = ((ddRes.data ?? []) as Array<{ day_of_week: number }>).map(
      (r) => r.day_of_week
    )
    setDays(ds.sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)))
    setRecords((recRes.data as DeliveryRecord[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function openAssign() {
    if (deliverer?.mode === 'village') {
      const { data } = await supabase
        .from('villages')
        .select('*')
        .is('deleted_at', null)
        .order('name')
      setAllVillages((data as Village[]) ?? [])
    }
    setAssignOpen(true)
  }

  async function assignVillage(villageId: string) {
    const { error } = await supabase
      .from('deliverer_villages')
      .insert({ deliverer_id: id, village_id: villageId })
    if (error) return alert(error.message)
    setAssignOpen(false)
    load()
  }

  async function removeVillage(villageId: string) {
    if (!confirm(t('confirmDelete'))) return
    const { error } = await supabase
      .from('deliverer_villages')
      .delete()
      .eq('deliverer_id', id)
      .eq('village_id', villageId)
    if (error) return alert(error.message)
    load()
  }

  async function assignDay(day: number) {
    const { error } = await supabase
      .from('deliverer_days')
      .insert({ deliverer_id: id, day_of_week: day })
    if (error) return alert(error.message)
    setAssignOpen(false)
    load()
  }

  async function removeDay(day: number) {
    if (!confirm(t('confirmDelete'))) return
    const { error } = await supabase
      .from('deliverer_days')
      .delete()
      .eq('deliverer_id', id)
      .eq('day_of_week', day)
    if (error) return alert(error.message)
    load()
  }

  function outstandingFor(pred: (r: DeliveryRecord) => boolean): number {
    return records
      .filter((r) => !r.paid && pred(r))
      .reduce((s, r) => s + Number(r.amount), 0)
  }

  if (loading) {
    return (
      <Layout back title={t('loading')}>
        <div className="center">{t('loading')}</div>
      </Layout>
    )
  }

  const totalOutstanding = outstandingFor(() => true)
  const isVillage = deliverer?.mode === 'village'
  // วันที่มี record อยู่แล้ว (จะโชว์เสมอ เพื่อไม่ให้ยอดค้างลอยหาย)
  const recordDays = Array.from(
    new Set(
      records
        .filter((r) => r.day_of_week != null)
        .map((r) => r.day_of_week as number)
    )
  )
  const displayDays = DAY_ORDER.filter(
    (d) => days.includes(d) || recordDays.includes(d)
  )
  const unassignedDays = DAY_ORDER.filter((d) => !displayDays.includes(d))

  return (
    <Layout back title={deliverer?.name}>
      <div className="summary">
        <div className="label">{t('outstanding')}</div>
        <div className="value">{formatMoney(totalOutstanding, currency)}</div>
      </div>

      <div className="page-head">
        <h2>{isVillage ? t('assignedVillages') : t('assignedDays')}</h2>
      </div>

      {isVillage ? (
        villages.length === 0 ? (
          <div className="center">{t('empty')}</div>
        ) : (
          <Reveal className="list-grid" deps={[villages.length]}>
            {villages.map((v) => (
              <div
                key={v.id}
                className="list-item"
                onClick={() =>
                  navigate(`/deliverer/${id}/records?village=${v.id}`)
                }
              >
                <span className="avatar">
                  <Building2 size={22} aria-hidden />
                </span>
                <span className="body">
                  <span className="title">{v.name}</span>
                  <span className="sub">
                    {t('outstanding')}:{' '}
                    {formatMoney(
                      outstandingFor((r) => r.village_id === v.id),
                      currency
                    )}
                  </span>
                </span>
                <button
                  className="row-del"
                  aria-label={t('remove')}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeVillage(v.id)
                  }}
                >
                  <Trash2 size={17} aria-hidden />
                </button>
                <ChevronRight className="chev" size={20} aria-hidden />
              </div>
            ))}
          </Reveal>
        )
      ) : displayDays.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : (
        <Reveal className="list-grid" deps={[displayDays.length]}>
          {displayDays.map((day) => (
            <div
              key={day}
              className="list-item"
              onClick={() => navigate(`/deliverer/${id}/records?day=${day}`)}
            >
              <span className="avatar">
                <CalendarDays size={22} aria-hidden />
              </span>
              <span className="body">
                <span className="title">{dayName(day, lang)}</span>
                <span className="sub">
                  {t('outstanding')}:{' '}
                  {formatMoney(
                    outstandingFor((r) => r.day_of_week === day),
                    currency
                  )}
                </span>
              </span>
              {!recordDays.includes(day) && (
                <button
                  className="row-del"
                  aria-label={t('remove')}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeDay(day)
                  }}
                >
                  <Trash2 size={17} aria-hidden />
                </button>
              )}
              <ChevronRight className="chev" size={20} aria-hidden />
            </div>
          ))}
        </Reveal>
      )}

      <Fab onClick={openAssign} label="assign" />

      <Modal
        open={assignOpen}
        title={isVillage ? t('addVillage') : t('addDay')}
        onClose={() => setAssignOpen(false)}
      >
        {isVillage
          ? allVillages
              .filter((v) => !villages.some((x) => x.id === v.id))
              .map((v) => (
                <button
                  key={v.id}
                  className="list-item"
                  onClick={() => assignVillage(v.id)}
                >
                  <span className="body">
                    <span className="title">{v.name}</span>
                  </span>
                  <Plus className="chev" size={20} aria-hidden />
                </button>
              ))
          : unassignedDays.map((day) => (
              <button
                key={day}
                className="list-item"
                onClick={() => assignDay(day)}
              >
                <span className="body">
                  <span className="title">{dayName(day, lang)}</span>
                </span>
                <Plus className="chev" size={20} aria-hidden />
              </button>
            ))}
        {((isVillage &&
          allVillages.filter((v) => !villages.some((x) => x.id === v.id))
            .length === 0) ||
          (!isVillage && unassignedDays.length === 0)) && (
          <div className="center">{t('empty')}</div>
        )}
      </Modal>
    </Layout>
  )
}
