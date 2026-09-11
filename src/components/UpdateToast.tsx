import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'

export function UpdateToast() {
  const { t } = useSettings()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    const id = setTimeout(() => setOfflineReady(false), 3000)
    return () => clearTimeout(id)
  }, [offlineReady, setOfflineReady])

  if (needRefresh) {
    return (
      <div className="update-toast" role="status">
        <RefreshCw size={18} aria-hidden />
        <span>{t('updateAvailable')}</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => updateServiceWorker(true)}
        >
          {t('updateNow')}
        </button>
        <button
          className="update-toast-close"
          aria-label={t('cancel')}
          onClick={() => setNeedRefresh(false)}
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="update-toast" role="status">
        <RefreshCw size={18} aria-hidden />
        <span>{t('offlineReady')}</span>
      </div>
    )
  }

  return null
}
