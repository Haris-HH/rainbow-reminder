import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronRight } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Modal } from '@/components/Modal'
import { Reveal } from '@/components/Reveal'
import { Fab } from '@/components/Fab'
import type { AppRole, Profile } from '@/types/database'

interface FormState {
  id?: string
  username: string
  full_name: string
  role: AppRole
  password: string
}

const blank = (): FormState => ({
  username: '',
  full_name: '',
  role: 'staff',
  password: '',
})

// เรียก edge function admin-users
async function callAdmin(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body,
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

export function Users() {
  const { t } = useSettings()
  const { isAdmin, profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(blank())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at')
    setUsers((data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  if (!isAdmin) return <Navigate to="/" replace />

  function openAdd() {
    setForm(blank())
    setError('')
    setOpen(true)
  }
  function openEdit(u: Profile) {
    setForm({
      id: u.id,
      username: u.username ?? '',
      full_name: u.full_name,
      role: u.role,
      password: '',
    })
    setError('')
    setOpen(true)
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      if (form.id) {
        await callAdmin({
          action: 'update',
          user_id: form.id,
          full_name: form.full_name,
          role: form.role,
          password: form.password || undefined,
        })
      } else {
        await callAdmin({
          action: 'create',
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        })
      }
      setOpen(false)
      load()
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!form.id) return
    if (!confirm(t('confirmDelete'))) return
    setSaving(true)
    setError('')
    try {
      await callAdmin({ action: 'delete', user_id: form.id })
      setOpen(false)
      load()
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout back title={t('users')}>
      {loading ? (
        <div className="center">{t('loading')}</div>
      ) : (
        <Reveal className="list-grid" deps={[users.length]}>
          {users.map((u) => (
          <div key={u.id} className="list-item" onClick={() => openEdit(u)}>
            <span className="avatar">
              {(u.username || u.full_name || '?').charAt(0).toUpperCase()}
            </span>
            <span className="body">
              <span className="title">
                {u.username || u.full_name || '(no name)'}
                {u.id === profile?.id && ' *'}
              </span>
              <span className="sub">
                {u.full_name ? `${u.full_name} · ` : ''}
                <span className="badge role">
                  {u.role === 'admin' ? t('admin') : t('staff')}
                </span>
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
          {!form.id && (
            <div className="field">
              <label>{t('username')}</label>
              <input
                className="input"
                type="text"
                autoCapitalize="none"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="เช่น nick"
              />
            </div>
          )}
          <div className="field">
            <label>{t('name')}</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>{t('role')}</label>
            <div className="segmented">
              <button
                type="button"
                className={form.role === 'staff' ? 'on' : ''}
                onClick={() => setForm({ ...form, role: 'staff' })}
              >
                {t('staff')}
              </button>
              <button
                type="button"
                className={form.role === 'admin' ? 'on' : ''}
                onClick={() => setForm({ ...form, role: 'admin' })}
              >
                {t('admin')}
              </button>
            </div>
          </div>
          <div className="field">
            <label>{form.id ? t('newPassword') : t('password')}</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="modal-actions">
            {form.id && form.id !== profile?.id && (
              <button
                className="btn btn-danger"
                onClick={remove}
                disabled={saving}
              >
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
