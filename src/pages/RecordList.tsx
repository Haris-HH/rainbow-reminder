import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { Check, RotateCcw, Trash2, Search, Home } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Modal } from '@/components/Modal'
import { Fab } from '@/components/Fab'
import { formatMoney } from '@/lib/format'
import { dayName } from '@/i18n/strings'
import type { DeliveryRecord, Village } from '@/types/database'

interface FormState {
  id?: string
  house_no: string
  quantity: string
  amount: string
  note: string
  delivered_at: string
  paid: boolean
}

const blank = (): FormState => ({
  house_no: '',
  quantity: '1',
  amount: '',
  note: '',
  delivered_at: new Date().toISOString().slice(0, 10),
  paid: false,
})

export function RecordList() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const villageId = params.get('village')
  const dayParam = params.get('day')
  const day = dayParam !== null ? Number(dayParam) : null

  const { t, lang, currency } = useSettings()
  const [records, setRecords] = useState<DeliveryRecord[]>([])
  const [village, setVillage] = useState<Village | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(blank())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    let q = supabase
      .from('delivery_records')
      .select('*')
      .eq('deliverer_id', id)
      .is('deleted_at', null)
    if (villageId) q = q.eq('village_id', villageId)
    if (day !== null) q = q.eq('day_of_week', day)
    const { data } = await q.order('delivered_at', { ascending: false })
    setRecords((data as DeliveryRecord[]) ?? [])

    if (villageId) {
      const { data: v } = await supabase
        .from('villages')
        .select('*')
        .eq('id', villageId)
        .single()
      setVillage((v as Village) ?? null)
    }
    setLoading(false)
  }, [id, villageId, day])

  useEffect(() => {
    load()
  }, [load])

  function openAdd() {
    setForm(blank())
    setModalOpen(true)
  }

  function openEdit(r: DeliveryRecord) {
    setForm({
      id: r.id,
      house_no: r.house_no,
      quantity: String(r.quantity),
      amount: String(r.amount),
      note: r.note ?? '',
      delivered_at: r.delivered_at,
      paid: r.paid,
    })
    setModalOpen(true)
  }

  async function save() {
    if (!id) return
    setSaving(true)
    const payload = {
      deliverer_id: id,
      village_id: villageId,
      day_of_week: day,
      house_no: form.house_no,
      quantity: Number(form.quantity) || 0,
      amount: Number(form.amount) || 0,
      currency,
      note: form.note,
      delivered_at: form.delivered_at,
      paid: form.paid,
    }
    if (form.id) {
      await supabase.from('delivery_records').update(payload).eq('id', form.id)
    } else {
      await supabase.from('delivery_records').insert(payload)
    }
    setSaving(false)
    setModalOpen(false)
    load()
  }

  async function togglePaid(r: DeliveryRecord) {
    await supabase
      .from('delivery_records')
      .update({ paid: !r.paid })
      .eq('id', r.id)
    load()
  }

  async function softDelete(r: DeliveryRecord) {
    if (!confirm(t('confirmDelete'))) return
    await supabase
      .from('delivery_records')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', r.id)
    load()
  }

  const title = villageId
    ? village?.name
    : day !== null
      ? dayName(day, lang)
      : t('addRecord')

  // filter ตามคำค้น (บ้านเลขที่ / หมายเหตุ)
  const q = search.trim().toLowerCase()
  const filtered = q
    ? records.filter(
        (r) =>
          (r.house_no || '').toLowerCase().includes(q) ||
          (r.note || '').toLowerCase().includes(q)
      )
    : records

  // group ตามบ้านเลขที่ + คิดยอดรวมของแต่ละกลุ่ม
  const groupMap = new Map<string, DeliveryRecord[]>()
  for (const r of filtered) {
    const key = r.house_no || '-'
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(r)
  }
  const groups = [...groupMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true })
  )

  const outstanding = filtered
    .filter((r) => !r.paid)
    .reduce((s, r) => s + Number(r.amount), 0)

  const actionCell = (r: DeliveryRecord) => (
    <td
      className="num"
      onClick={(e) => e.stopPropagation()}
      style={{ whiteSpace: 'nowrap' }}
    >
      <button
        className={`btn btn-sm ${r.paid ? 'btn-ghost' : 'btn-action'}`}
        onClick={() => togglePaid(r)}
        aria-label={r.paid ? t('markUnpaid') : t('markPaid')}
      >
        {r.paid ? <RotateCcw size={15} aria-hidden /> : <Check size={15} aria-hidden />}
      </button>{' '}
      <button
        className="btn btn-sm btn-ghost"
        onClick={() => softDelete(r)}
        aria-label={t('delete')}
      >
        <Trash2 size={15} aria-hidden />
      </button>
    </td>
  )

  return (
    <Layout back title={title}>
      <div className="summary">
        <div className="label">{t('outstanding')}</div>
        <div className="value">{formatMoney(outstanding, currency)}</div>
      </div>

      {!loading && records.length > 0 && (
        <div className="search-bar">
          <Search size={18} className="muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchRecord')}
            inputMode="text"
          />
        </div>
      )}

      {loading ? (
        <div className="center">{t('loading')}</div>
      ) : records.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : groups.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : (
        groups.map(([house, rows]) => {
          const gTotal = rows.reduce((s, r) => s + Number(r.amount), 0)
          const gOutstanding = rows
            .filter((r) => !r.paid)
            .reduce((s, r) => s + Number(r.amount), 0)
          return (
            <div key={house} className="card rec-group">
              <div className="rec-group-head">
                <span className="rec-house">
                  <Home size={16} aria-hidden /> {house}
                  <span className="muted rec-count">
                    {rows.length} {t('records')}
                  </span>
                </span>
                <span className="rec-group-sum">
                  <span
                    className={gOutstanding > 0 ? 'rec-out' : 'muted'}
                    style={{ fontWeight: 800 }}
                  >
                    {formatMoney(gOutstanding, currency)}
                  </span>
                  <span className="muted rec-count">
                    {t('groupTotal')} {formatMoney(gTotal, currency)}
                  </span>
                </span>
              </div>
              <table className="rec-table rec-inner">
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => openEdit(r)}>
                      <td>
                        {r.delivered_at}
                        <div>
                          <span className={`badge ${r.paid ? 'paid' : 'unpaid'}`}>
                            {r.paid ? t('paid') : t('unpaid')}
                          </span>
                        </div>
                      </td>
                      <td className="num">{r.quantity}</td>
                      <td className="num">
                        {formatMoney(Number(r.amount), currency)}
                      </td>
                      {actionCell(r)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })
      )}

      <Fab onClick={openAdd} />

      <Modal
        open={modalOpen}
        title={form.id ? t('edit') : t('addRecord')}
        onClose={() => setModalOpen(false)}
      >
          <div className="field">
            <label>{t('houseNo')}</label>
            <input
              className="input"
              value={form.house_no}
              onChange={(e) => setForm({ ...form, house_no: e.target.value })}
              placeholder="29/3"
            />
          </div>
          <div className="row">
            <div className="field">
              <label>{t('quantity')}</label>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="field">
              <label>
                {t('amount')} ({currency})
              </label>
              <input
                className="input"
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>{t('date')}</label>
            <input
              className="input"
              type="date"
              value={form.delivered_at}
              onChange={(e) =>
                setForm({ ...form, delivered_at: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>{t('note')}</label>
            <input
              className="input"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div className="segmented">
            <button
              type="button"
              className={!form.paid ? 'on' : ''}
              onClick={() => setForm({ ...form, paid: false })}
            >
              {t('unpaid')}
            </button>
            <button
              type="button"
              className={form.paid ? 'on' : ''}
              onClick={() => setForm({ ...form, paid: true })}
            >
              {t('paid')}
            </button>
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-ghost"
              onClick={() => setModalOpen(false)}
            >
              {t('cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {t('save')}
            </button>
          </div>
      </Modal>
    </Layout>
  )
}
