import { useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { usernameToEmail } from '@/lib/auth'
import { gsap, useGSAP, EASE, skipAnimation } from '@/lib/motion'
import logo from '@/assets/rainbow-logo.jpg'

export function Login() {
  const { signIn } = useAuth()
  const { t, lang, setLang } = useSettings()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (skipAnimation()) return
      const tl = gsap.timeline()
      tl.fromTo(
        '.login-logo',
        { scale: 0.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: EASE.popBig, clearProps: 'scale' }
      )
        .fromTo(
          '.login-title',
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: EASE.out, clearProps: 'transform' },
          '-=0.2'
        )
        .fromTo(
          '.login-anim',
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            ease: EASE.out,
            stagger: 0.08,
            clearProps: 'transform',
          },
          '-=0.2'
        )
    },
    { scope }
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await signIn(usernameToEmail(username), password)
    if (error) setError(t('loginFailed'))
    setBusy(false)
  }

  return (
    <div
      ref={scope}
      style={{
        minHeight: '100vh',
        maxWidth: 440,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <img
          className="login-logo"
          src={logo}
          alt="Rainbow"
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            boxShadow: 'var(--sh-2)',
          }}
        />
        <h1 className="login-title" style={{ marginTop: 16, color: 'var(--primary)' }}>
          {t('appName')}
        </h1>
      </div>

      <form onSubmit={submit} className="card login-anim">
        <div className="field">
          <label>{t('username')}</label>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
          />
        </div>
        <div className="field">
          <label>{t('password')}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={busy}
          style={{ marginTop: 8 }}
        >
          {busy ? t('signingIn') : t('login')}
        </button>
      </form>

      <div className="segmented login-anim" style={{ marginTop: 16 }}>
        <button
          className={lang === 'th' ? 'on' : ''}
          onClick={() => setLang('th')}
          type="button"
        >
          ไทย
        </button>
        <button
          className={lang === 'my' ? 'on' : ''}
          onClick={() => setLang('my')}
          type="button"
        >
          မြန်မာ
        </button>
      </div>
    </div>
  )
}
