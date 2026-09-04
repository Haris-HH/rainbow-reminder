import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { ChevronRight } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Reveal } from '@/components/Reveal'
import type { Deliverer } from '@/types/database'

export function Dashboard() {
  const { t } = useSettings()
  const navigate = useNavigate()
  const [deliverers, setDeliverers] = useState<Deliverer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('deliverers')
      .select('*')
      .is('deleted_at', null)
      .order('name')
      .then(({ data }) => {
        setDeliverers((data as Deliverer[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <Layout>
      <div className="page-head">
        <h2>{t('deliverers')}</h2>
      </div>

      {loading ? (
        <div className="center">{t('loading')}</div>
      ) : deliverers.length === 0 ? (
        <div className="center">{t('empty')}</div>
      ) : (
        <Reveal className="list-grid" deps={[deliverers.length]}>
          {deliverers.map((d) => (
            <button
              key={d.id}
              className="list-item"
              onClick={() => navigate(`/deliverer/${d.id}`)}
            >
              <span className="avatar">{d.name.charAt(0)}</span>
              <span className="body">
                <span className="title">{d.name}</span>
                <span className="sub">
                  {d.mode === 'village' ? t('byVillage') : t('byDay')}
                </span>
              </span>
              <ChevronRight className="chev" size={20} aria-hidden />
            </button>
          ))}
        </Reveal>
      )}
    </Layout>
  )
}
