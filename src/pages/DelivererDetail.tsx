import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { Building2, CalendarDays, ChevronRight, Plus } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Modal } from '@/components/Modal'
import { Reveal } from '@/components/Reveal'
import { Fab } from '@/components/Fab'
import { formatMoney } from '@/lib/format'
import { dayName } from '@/i18n/strings'
import type {
  Deliverer,
  DeliveryRecord,
  Village,
} from '@/types/database'

export function DelivererDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, lang, currency } = useSettings()
  const navigate = useNavigate()

  const [deliverer, setDeliverer] = useState<Deliverer | null>(null)
  const [villages, setVillages] = useState<Village[]>([])
  const [records, setRecords] = useState<DeliveryRecord[]>([])
  const [allVillages, setAllVillages] = useState<Village[]>([])
  const [loading, setLoading] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const [dRes, dvRes, recRes] = await Promise.all([
      supabase.from('deliverers').select('*').eq('id', id).single(),
      supabase
        .from('deliverer_villages')
        .select('village_id, villages(*)')
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
    setRecords((recRes.data as DeliveryRecord[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function openAssign() {
    const { data } = await supabase
      .from('villages')
      .select('*')
      .is('deleted_at', null)
      .order('name')
    setAllVillages((data as Village[]) ?? [])
    setAssignOpen(true)
  }

  async function assignVillage(villageId: string) {
    await supabase
      .from('deliverer_villages')
      .insert({ deliverer_id: id, village_id: villageId })
    setAssignOpen(false)
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

  return (
    <Layout back title={deliverer?.name}>
      <div className="summary">
        <div className="label">{t('outstanding')}</div>
        <div className="value">{formatMoney(totalOutstanding, currency)}</div>
      </div>

      {deliverer?.mode === 'village' ? (
        <>
          <div className="page-head">
            <h2>{t('assignedVillages')}</h2>
          </div>
          {villages.length === 0 ? (
            <div className="center">{t('empty')}</div>
          ) : (
            <Reveal className="list-grid" deps={[villages.length]}>
              {villages.map((v) => (
                <button
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
                  <ChevronRight className="chev" size={20} aria-hidden />
                </button>
              ))}
            </Reveal>
          )}
          <Fab onClick={openAssign} label="assign" />
        </>
      ) : (
        <>
          <div className="page-head">
            <h2>{t('byDay')}</h2>
          </div>
          <Reveal className="list-grid" deps={[deliverer?.id]}>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <button
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
                <ChevronRight className="chev" size={20} aria-hidden />
              </button>
            ))}
          </Reveal>
        </>
      )}

      <Modal
        open={assignOpen}
        title={t('assignedVillages')}
        onClose={() => setAssignOpen(false)}
      >
        {allVillages
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
            ))}
      </Modal>
    </Layout>
  )
}
