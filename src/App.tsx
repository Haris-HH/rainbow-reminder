import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { DelivererDetail } from '@/pages/DelivererDetail'
import { RecordList } from '@/pages/RecordList'
import { Villages } from '@/pages/Villages'
import { Deliverers } from '@/pages/Deliverers'
import { Settings } from '@/pages/Settings'
import { Users } from '@/pages/Users'

export default function App() {
  const { session, loading } = useAuth()
  const { t } = useSettings()

  if (loading) {
    return <div className="center">{t('loading')}</div>
  }

  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/deliverer/:id" element={<DelivererDetail />} />
      <Route path="/deliverer/:id/records" element={<RecordList />} />
      <Route path="/villages" element={<Villages />} />
      <Route path="/deliverers" element={<Deliverers />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/users" element={<Users />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
