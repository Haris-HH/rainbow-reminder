import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Users as UsersIcon, ChevronRight, LogOut, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/Layout'
import type { Style } from '@/types/database'

const STYLES: { value: Style; key: 'styleGlass' | 'styleSolid' | 'styleVibrant' }[] = [
  { value: 'glass', key: 'styleGlass' },
  { value: 'solid', key: 'styleSolid' },
  { value: 'vibrant', key: 'styleVibrant' },
]

export function Settings() {
  const { t, theme, setTheme, lang, setLang, style, setStyle } = useSettings()
  const { signOut, isAdmin, profile } = useAuth()
  const navigate = useNavigate()

  // ซิงก์ค่ากับ profile ใน DB ด้วย (best-effort)
  function persist(patch: Record<string, string>) {
    if (profile) supabase.from('profiles').update(patch).eq('id', profile.id)
  }

  return (
    <Layout title={t('settings')}>
      <div className="card">
        <div className="field">
          <label>{t('style')}</label>
          <div className="style-list">
            {STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`style-opt${style === s.value ? ' on' : ''}`}
                onClick={() => setStyle(s.value)}
              >
                <Sparkles size={17} aria-hidden />
                <span className="style-opt-label">{t(s.key)}</span>
                <span className="style-radio" aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('theme')}</label>
          <div className="segmented">
            <button
              className={theme === 'light' ? 'on' : ''}
              onClick={() => {
                setTheme('light')
                persist({ theme: 'light' })
              }}
            >
              <Sun size={16} aria-hidden /> {t('light')}
            </button>
            <button
              className={theme === 'dark' ? 'on' : ''}
              onClick={() => {
                setTheme('dark')
                persist({ theme: 'dark' })
              }}
            >
              <Moon size={16} aria-hidden /> {t('dark')}
            </button>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>{t('language')}</label>
          <div className="segmented">
            <button
              className={lang === 'th' ? 'on' : ''}
              onClick={() => {
                setLang('th')
                persist({ lang: 'th' })
              }}
            >
              ไทย
            </button>
            <button
              className={lang === 'my' ? 'on' : ''}
              onClick={() => {
                setLang('my')
                persist({ lang: 'my' })
              }}
            >
              မြန်မာ
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <button
          className="list-item"
          onClick={() => navigate('/users')}
          style={{ marginTop: 4 }}
        >
          <span className="avatar">
            <UsersIcon size={22} aria-hidden />
          </span>
          <span className="body">
            <span className="title">{t('users')}</span>
            <span className="sub">{t('adminOnly')}</span>
          </span>
          <ChevronRight className="chev" size={20} aria-hidden />
        </button>
      )}

      <button
        className="btn btn-danger btn-block"
        style={{ marginTop: 16 }}
        onClick={signOut}
      >
        <LogOut size={17} aria-hidden /> {t('logout')}
      </button>

      {profile && (
        <p className="muted" style={{ textAlign: 'center', marginTop: 16 }}>
          {profile.full_name} ·{' '}
          {profile.role === 'admin' ? t('admin') : t('staff')}
        </p>
      )}
    </Layout>
  )
}
