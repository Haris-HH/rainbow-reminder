import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { Building2, MapPin, Search } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/Modal'
import { MapPicker } from '@/components/MapPicker'
import { Reveal } from '@/components/Reveal'
import { Fab } from '@/components/Fab'
import { useRealtime } from '@/hooks/useRealtime'
import { useDialog } from '@/contexts/DialogContext'
import { mapsUrl } from '@/lib/format'
import type { Village } from '@/types/database'

interface FormState {
  id?: string
  name: string
  address: string
  lat: string
  lng: string
}

const blank = (): FormState => ({ name: '', address: '', lat: '', lng: '' })

export function Villages() {
  const { t } = useSettings()
  const { confirm } = useDialog()
  const [villages, setVillages] = useState<Village[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(blank())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase
      .from('villages')
      .select('*')
      .is('deleted_at', null)
      .order('name')
    setVillages((data as Village[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime(['villages'], load)

  function openAdd() {
    setForm(blank())
    setOpen(true)
  }
  function openEdit(v: Village) {
    setForm({
      id: v.id,
      name: v.name,
      address: v.address ?? '',
      lat: v.lat != null ? String(v.lat) : '',
      lng: v.lng != null ? String(v.lng) : '',
    })
    setOpen(true)
  }

  async function save() {
    setSaving(true)
    const payload = {
      name: form.name,
      address: form.address,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
    }
    if (form.id) {
      await supabase.from('villages').update(payload).eq('id', form.id)
    } else {
      await supabase.from('villages').insert(payload)
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function remove() {
    if (!form.id) return
    if (!(await confirm(t('confirmDelete')))) return
    await supabase
      .from('villages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', form.id)
    setOpen(false)
    load()
  }

  const filtered = villages.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title={t('villages')}>
      <div className="search-bar">
        <Search size={18} className="muted" aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
        />
      </div>

      {loading ? (
        <Loader label={t('loading')} />
      ) : filtered.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : (
        <Reveal className="list-grid" deps={[filtered.length]}>
          {filtered.map((v) => (
            <div key={v.id} className="list-item" onClick={() => openEdit(v)}>
              <span className="avatar">
                <Building2 size={22} aria-hidden />
              </span>
              <span className="body">
                <span className="title">{v.name}</span>
                {v.address && <span className="sub">{v.address}</span>}
              </span>
              {(v.lat != null || v.address) && (
                <a
                  className="btn btn-sm btn-action"
                  href={mapsUrl(v.lat, v.lng, v.address)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPin size={15} aria-hidden /> {t('map')}
                </a>
              )}
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
            <label>{t('villageName')}</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>{t('address')}</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="field">
            <label>
              {t('map')} — {t('lat')}/{t('lng')}
            </label>
            <MapPicker
              lat={form.lat ? Number(form.lat) : null}
              lng={form.lng ? Number(form.lng) : null}
              onChange={(la, ln) =>
                setForm((f) => ({ ...f, lat: String(la), lng: String(ln) }))
              }
            />
          </div>
          <div className="row">
            <div className="field">
              <label>{t('lat')}</label>
              <input
                className="input"
                inputMode="decimal"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('lng')}</label>
              <input
                className="input"
                inputMode="decimal"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
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
