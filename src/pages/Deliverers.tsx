import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { ChevronRight } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/Modal'
import { Reveal } from '@/components/Reveal'
import { Fab } from '@/components/Fab'
import { useRealtime } from '@/hooks/useRealtime'
import { useDialog } from '@/contexts/DialogContext'
import type { Deliverer, DelivererMode } from '@/types/database'

interface FormState {
  id?: string
  name: string
  mode: DelivererMode
}

const blank = (): FormState => ({ name: '', mode: 'village' })

export function Deliverers() {
  const { t } = useSettings()
  const { confirm } = useDialog()
  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(blank())
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('deliverers')
      .select('*')
      .is('deleted_at', null)
      .order('name')
    setDeliverers((data as Deliverer[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime(['deliverers'], load)

  function openAdd() {
    setForm(blank())
    setOpen(true)
  }
  function openEdit(d: Deliverer) {
    setForm({ id: d.id, name: d.name, mode: d.mode })
    setOpen(true)
  }

  async function save() {
    setSaving(true)
    const payload = { name: form.name, mode: form.mode }
    if (form.id) {
      await supabase.from('deliverers').update(payload).eq('id', form.id)
    } else {
      await supabase.from('deliverers').insert(payload)
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function remove() {
    if (!form.id) return
    if (!(await confirm(t('confirmDelete')))) return
    await supabase
      .from('deliverers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', form.id)
    setOpen(false)
    load()
  }

  return (
    <Layout title={t('deliverers')}>
      {loading ? (
        <Loader label={t('loading')} />
      ) : deliverers.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : (
        <Reveal className="list-grid" deps={[deliverers.length]}>
          {deliverers.map((d) => (
            <div key={d.id} className="list-item" onClick={() => openEdit(d)}>
              <span className="avatar">{d.name.charAt(0)}</span>
              <span className="body">
                <span className="title">{d.name}</span>
                <span className="sub">
                  {d.mode === 'village' ? t('byVillage') : t('byDay')}
                </span>
              </span>
              <ChevronRight className="chev" size={20} aria-hidden />
            </div>
          ))}
        </Reveal>
      )}

      <Fab onClick={openAdd} />

      <Modal
        open={open}
        title={form.id ? t('edit') : t('add')}
        onClose={() => setOpen(false)}
      >
          <div className="field">
            <label>{t('delivererName')}</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>{t('deliverMode')}</label>
            <div className="segmented">
              <button
                type="button"
                className={form.mode === 'village' ? 'on' : ''}
                onClick={() => setForm({ ...form, mode: 'village' })}
              >
                {t('byVillage')}
              </button>
              <button
                type="button"
                className={form.mode === 'day' ? 'on' : ''}
                onClick={() => setForm({ ...form, mode: 'day' })}
              >
                {t('byDay')}
              </button>
            </div>
          </div>
          <div className="modal-actions">
            {form.id && (
              <button className="btn btn-danger" onClick={remove}>
                {t('delete')}
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {t('save')}
            </button>
          </div>
      </Modal>
    </Layout>
  )
}
