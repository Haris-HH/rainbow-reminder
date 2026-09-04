import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Building2, Truck, Settings, ChevronLeft } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import logo from '@/assets/rainbow-logo.jpg'

interface Props {
  title?: string
  back?: boolean
  children: ReactNode
}

export function Layout({ title, back, children }: Props) {
  const { t } = useSettings()
  const navigate = useNavigate()

  return (
    <div className="app">
      <header className="topbar">
        {back ? (
          <button className="back" onClick={() => navigate(-1)} aria-label="back">
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
        ) : (
          <img src={logo} alt="Rainbow" />
        )}
        <h1>{title ?? t('appName')}</h1>
      </header>

      <main className="content">{children}</main>

      <nav className="bottomnav">
        <NavLink to="/" end>
          <Home className="icon" size={22} strokeWidth={2} aria-hidden />
          {t('dashboard')}
        </NavLink>
        <NavLink to="/villages">
          <Building2 className="icon" size={22} strokeWidth={2} aria-hidden />
          {t('villages')}
        </NavLink>
        <NavLink to="/deliverers">
          <Truck className="icon" size={22} strokeWidth={2} aria-hidden />
          {t('deliverers')}
        </NavLink>
        <NavLink to="/settings">
          <Settings className="icon" size={22} strokeWidth={2} aria-hidden />
          {t('settings')}
        </NavLink>
      </nav>
    </div>
  )
}
