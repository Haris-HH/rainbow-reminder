import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { Check, RotateCcw, Trash2, Search, Home, LayoutList, Table2, Plus, Printer, ChevronDown } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/Modal'
import { SpeedDial } from '@/components/SpeedDial'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import { useRealtime } from '@/hooks/useRealtime'
import { useDialog } from '@/contexts/DialogContext'
import { formatMoney } from '@/lib/format'
import { dayName } from '@/i18n/strings'
import type { DeliveryRecord, Village } from '@/types/database'

interface FormState {
  id?: string
  link_id?: string | null
  house_no: string
  quantity: string
  amount: string
  note: string
  delivered_at: string
  paid: boolean
  normalDay: boolean // สวิตช์: ส่งตามวันปกติของบ้านนี้ไหม (เฉพาะแบบวัน)
}

// วันที่ "วันนี้" ตามเวลาท้องถิ่น (YYYY-MM-DD) — ตัดที่เที่ยงคืนตามเครื่องผู้ใช้
const localToday = (): string => {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 10)
}

const blank = (): FormState => ({
  house_no: '',
  quantity: '1',
  amount: '',
  note: '',
  delivered_at: localToday(),
  paid: false,
  normalDay: true,
})

export function RecordList() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const villageId = params.get('village')
  const dayParam = params.get('day')
  const day = dayParam !== null ? Number(dayParam) : null

  const { t, lang, currency } = useSettings()
  const { confirm, alert } = useDialog()
  const [records, setRecords] = useState<DeliveryRecord[]>([])
  const [village, setVillage] = useState<Village | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(blank())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'table'>('list')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  function toggleGroup(house: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(house)) next.delete(house)
      else next.add(house)
      return next
    })
  }

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

  useRealtime(['delivery_records'], load)

  function openAdd() {
    setForm(blank())
    setModalOpen(true)
  }

  function openEdit(r: DeliveryRecord) {
    setForm({
      id: r.id,
      link_id: r.link_id,
      house_no: r.house_no,
      quantity: String(r.quantity),
      amount: String(r.amount),
      note: r.note ?? '',
      delivered_at: r.delivered_at,
      paid: r.paid,
      normalDay: true,
    })
    setModalOpen(true)
  }

  // หา "วันปกติ" ของบ้าน = วันที่บ้านนี้เคยมี record มากที่สุด (ยกเว้นวันปัจจุบัน)
  async function findNormalDay(houseNo: string): Promise<number | null> {
    const { data } = await supabase
      .from('delivery_records')
      .select('day_of_week')
      .eq('deliverer_id', id)
      .eq('house_no', houseNo)
      .is('deleted_at', null)
      .not('day_of_week', 'is', null)
    const counts = new Map<number, number>()
    for (const row of (data ?? []) as { day_of_week: number }[]) {
      if (row.day_of_week === day) continue
      counts.set(row.day_of_week, (counts.get(row.day_of_week) ?? 0) + 1)
    }
    let best: number | null = null
    let max = 0
    for (const [d, c] of counts) {
      if (c > max) {
        max = c
        best = d
      }
    }
    return best
  }

  async function save() {
    if (!id) return
    setSaving(true)
    const shared = {
      deliverer_id: id,
      village_id: villageId,
      house_no: form.house_no,
      quantity: Number(form.quantity) || 0,
      amount: Number(form.amount) || 0,
      currency,
      note: form.note,
      delivered_at: form.delivered_at,
      paid: form.paid,
    }

    if (form.id) {
      // แก้ไข: ถ้าผูกกันอยู่ อัปเดตทุก record ที่ link เดียวกัน (คงวันของแต่ละอันไว้)
      if (form.link_id) {
        await supabase
          .from('delivery_records')
          .update(shared)
          .eq('link_id', form.link_id)
      } else {
        await supabase
          .from('delivery_records')
          .update({ ...shared, day_of_week: day })
          .eq('id', form.id)
      }
    } else if (day !== null && !form.normalDay) {
      // ส่งนอกวันปกติ: เพิ่มวันนี้ + วันปกติของบ้าน (ผูก link เดียวกัน)
      const normal = await findNormalDay(form.house_no)
      if (normal === null) {
        await alert(t('noNormalDay'))
        await supabase
          .from('delivery_records')
          .insert({ ...shared, day_of_week: day })
      } else {
        const link_id = crypto.randomUUID()
        await supabase.from('delivery_records').insert([
          { ...shared, day_of_week: day, link_id },
          { ...shared, day_of_week: normal, link_id },
        ])
      }
    } else {
      // ปกติ
      await supabase
        .from('delivery_records')
        .insert({ ...shared, day_of_week: day })
    }

    setSaving(false)
    setModalOpen(false)
    load()
  }

  async function togglePaid(r: DeliveryRecord) {
    const qy = supabase.from('delivery_records').update({ paid: !r.paid })
    // sync ทั้งคู่ถ้าผูกกัน
    if (r.link_id) await qy.eq('link_id', r.link_id)
    else await qy.eq('id', r.id)
    load()
  }

  async function softDelete(r: DeliveryRecord) {
    if (!(await confirm(t('confirmDelete')))) return
    const qy = supabase
      .from('delivery_records')
      .update({ deleted_at: new Date().toISOString() })
    if (r.link_id) await qy.eq('link_id', r.link_id)
    else await qy.eq('id', r.id)
    load()
  }

  // ลบทุกรายการของบ้านนี้ (soft delete) + record ที่ผูกไว้ในวันอื่นด้วย
  async function deleteHouse(rows: DeliveryRecord[]) {
    if (!(await confirm(t('confirmDeleteHouse')))) return
    const del = new Date().toISOString()
    const ids = rows.map((r) => r.id)
    const linkIds = [
      ...new Set(rows.map((r) => r.link_id).filter(Boolean) as string[]),
    ]
    await supabase
      .from('delivery_records')
      .update({ deleted_at: del })
      .in('id', ids)
    if (linkIds.length) {
      await supabase
        .from('delivery_records')
        .update({ deleted_at: del })
        .in('link_id', linkIds)
    }
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

  // ledger: ค้างชำระ = +หนี้ , ชำระแล้ว = -เงินที่จ่าย
  const netBalance = (rows: DeliveryRecord[]) =>
    rows.reduce(
      (s, r) => s + (r.paid ? -Number(r.amount) : Number(r.amount)),
      0
    )
  // ยอดทั้งหมด = หนี้ที่เรียกเก็บทั้งหมด (รายการที่ค้าง)
  const sumCharges = (rows: DeliveryRecord[]) =>
    rows.filter((r) => !r.paid).reduce((s, r) => s + Number(r.amount), 0)

  const outstanding = netBalance(filtered)

  // แบบตาราง: แสดงเฉพาะรายการของ "วันนี้" (เลยเที่ยงคืน = ขึ้นวันใหม่ ตารางว่าง)
  // แยกเป็น 2 ตาราง (ค้างชำระ / ชำระแล้ว) เรียงตามบ้านเลขที่แล้ววันที่
  const today = localToday()
  const byHouseThenDate = (a: DeliveryRecord, b: DeliveryRecord) => {
    const h = (a.house_no || '').localeCompare(b.house_no || '', undefined, {
      numeric: true,
    })
    return h !== 0 ? h : b.delivered_at.localeCompare(a.delivered_at)
  }
  const todayRows = filtered.filter((r) => r.delivered_at === today)
  const unpaidRows = todayRows.filter((r) => !r.paid).sort(byHouseThenDate)
  const paidRows = todayRows.filter((r) => r.paid).sort(byHouseThenDate)
  const sumAmount = (rows: DeliveryRecord[]) =>
    rows.reduce((s, r) => s + Number(r.amount), 0)

  // ปุ่ม print pdf กดไม่ได้ถ้าไม่มีข้อมูลในมุมมองปัจจุบัน
  const printDisabled = view === 'table' ? todayRows.length === 0 : groups.length === 0

  // pdfmake โหลดแบบ dynamic import เพื่อไม่ให้ bundle หลักบวมสำหรับหน้าที่ไม่ได้ print
  // เปิดหน้าต่างใหม่แบบ sync ในตัว handler ก่อน (ยังอยู่ใน user-gesture) กัน popup blocker
  function handlePrint() {
    if (printDisabled) return
    const win = window.open('', '_blank')
    void import('@/lib/pdf').then(({ printRecordsPdf }) => {
      printRecordsPdf({
        title: title ?? '',
        lang,
        currency,
        view,
        rows: view === 'table' ? todayRows : filtered,
        win,
      })
    })
  }

  // จัดกลุ่มแถวตามบ้านเลขที่ (คงลำดับที่ sort มาแล้ว)
  const groupByHouse = (rows: DeliveryRecord[]): [string, DeliveryRecord[]][] => {
    const m = new Map<string, DeliveryRecord[]>()
    for (const r of rows) {
      const k = r.house_no || '-'
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(r)
    }
    return [...m.entries()]
  }

  const actionCell = (r: DeliveryRecord) => (
    <td className="rec-act-cell" onClick={(e) => e.stopPropagation()}>
      <div className="rec-act">
        <button
          className={`btn btn-sm rec-act-btn ${r.paid ? 'btn-ghost' : 'btn-action'}`}
          onClick={() => togglePaid(r)}
          aria-label={r.paid ? t('markUnpaid') : t('markPaid')}
        >
          {r.paid ? <RotateCcw size={15} aria-hidden /> : <Check size={15} aria-hidden />}
        </button>
        <button
          className="btn btn-sm rec-act-btn btn-ghost"
          onClick={() => softDelete(r)}
          aria-label={t('delete')}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
    </td>
  )

  // แบบตาราง: หนึ่ง section (ค้างชำระ/ชำระแล้ว) = accordion จัดกลุ่มตามบ้าน
  const renderSection = (
    rows: DeliveryRecord[],
    keyPrefix: string,
    heading: string,
    positive: boolean
  ) => {
    const color = positive ? 'var(--success)' : 'var(--crimson)'
    return (
      <div className="rec-table-block">
        <div className="rec-table-head">
          <span className="rec-table-title">{heading}</span>
          <span className="rec-table-total" style={{ color }}>
            {formatMoney(sumAmount(rows), currency)}
          </span>
        </div>
        {rows.length === 0 ? (
          <div className="acc-empty">{t('empty')}</div>
        ) : (
          <div className="acc">
            {groupByHouse(rows).map(([house, gr]) => (
              <div className="acc-group open" key={`${keyPrefix}:${house}`}>
                <div className="acc-head">
                  <span className="acc-name">
                    <Home size={15} aria-hidden /> {house}
                  </span>
                  <span className="acc-count">{gr.length}</span>
                  <span className="acc-sum" style={{ color }}>
                    {formatMoney(sumAmount(gr), currency)}
                  </span>
                </div>
                <table className="rec-table rec-inner acc-body">
                  <colgroup>
                    <col />
                    <col style={{ width: '44px' }} />
                    <col style={{ width: '84px' }} />
                    <col style={{ width: '92px' }} />
                  </colgroup>
                  <tbody>
                    {gr.map((r) => (
                      <tr key={r.id} onClick={() => openEdit(r)}>
                        <td>{r.delivered_at}</td>
                        <td className="num">{r.quantity}</td>
                        <td
                          className="rec-amt"
                          style={{ color: positive ? 'var(--success)' : undefined }}
                        >
                          {formatMoney(Number(r.amount), currency)}
                        </td>
                        {actionCell(r)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout back title={title}>
      <div className="summary">
        <div className="label">{t('outstanding')}</div>
        <div className="value">{formatMoney(outstanding, currency)}</div>
      </div>

      {!loading && records.length > 0 && (
        <>
          <div className="search-bar">
            <Search size={18} className="muted" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchRecord')}
              inputMode="text"
            />
          </div>
          <div className="view-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'list'}
              className={view === 'list' ? 'on' : ''}
              onClick={() => setView('list')}
            >
              <LayoutList size={16} aria-hidden /> {t('viewList')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'table'}
              className={view === 'table' ? 'on' : ''}
              onClick={() => setView('table')}
            >
              <Table2 size={16} aria-hidden /> {t('viewTable')}
            </button>
          </div>
        </>
      )}

      {loading ? (
        <Loader label={t('loading')} />
      ) : records.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : groups.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : view === 'table' ? (
        <>
          {renderSection(unpaidRows, 'u', t('unpaid'), false)}
          {renderSection(paidRows, 'p', t('paid'), true)}
        </>
      ) : (
        groups.map(([house, rows]) => {
          const gNet = netBalance(rows)
          const gCharges = sumCharges(rows)
          const isCollapsed = collapsedGroups.has(house)
          return (
            <SwipeToDelete
              key={house}
              label={t('deleteAll')}
              onDelete={() => deleteHouse(rows)}
            >
              <div className="card rec-group">
                <div
                  className="rec-group-head"
                  onClick={() => toggleGroup(house)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleGroup(house)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!isCollapsed}
                >
                <span className="rec-house">
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className="rec-collapse-chevron"
                    style={{
                      transform: isCollapsed ? 'rotate(-90deg)' : undefined,
                    }}
                  />
                  <Home size={16} aria-hidden /> {house}
                  <span className="muted rec-count">
                    {rows.length} {t('records')}
                  </span>
                </span>
                <span className="rec-group-sum">
                  <span
                    className={gNet > 0 ? 'rec-out' : 'muted'}
                    style={{ fontWeight: 800 }}
                  >
                    {formatMoney(gNet, currency)}
                  </span>
                  <span className="muted rec-count">
                    {t('total')} {formatMoney(gCharges, currency)}
                  </span>
                </span>
              </div>
              {!isCollapsed && (
                <table className="rec-table rec-inner">
                  <colgroup>
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '44px' }} />
                    <col style={{ width: '84px' }} />
                    <col style={{ width: '92px' }} />
                  </colgroup>
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
                        <td
                          className="rec-amt"
                          style={{ color: r.paid ? 'var(--success)' : undefined }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%' }}>
                            <p style={{ textAlign: 'left', width: '30%' }}>
                              {r.paid ? '−' : ''}
                              {formatMoney(Number(r.amount), currency)}
                            </p>
                          </div>
                        </td>
                        {actionCell(r)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              </div>
            </SwipeToDelete>
          )
        })
      )}

      <SpeedDial
        mainLabel={t('addRecord')}
        actions={[
          {
            key: 'add',
            icon: <Plus size={20} aria-hidden />,
            label: t('add'),
            onClick: openAdd,
          },
          {
            key: 'print',
            icon: <Printer size={20} aria-hidden />,
            label: t('printPdf'),
            onClick: handlePrint,
            disabled: printDisabled,
          },
        ]}
      />

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

          {day !== null && !form.id && (
            <div className="field" style={{ marginTop: 15 }}>
              <div className="switch-row">
                <label style={{ margin: 0 }}>{t('normalDay')}</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.normalDay}
                  className={`switch${form.normalDay ? ' on' : ''}`}
                  onClick={() =>
                    setForm({ ...form, normalDay: !form.normalDay })
                  }
                >
                  <span className="knob" />
                </button>
              </div>
              {!form.normalDay && (
                <p className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                  {t('normalDayHint')}
                </p>
              )}
            </div>
          )}

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
