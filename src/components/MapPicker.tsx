import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, LocateFixed } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

// พิกัดเริ่มต้น: กรุงเทพฯ (เผื่อยังไม่มีตำแหน่ง)
const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]

const pinIcon = L.divIcon({
  className: 'rr-pin',
  html: `<svg class="rr-pin-inner" viewBox="0 0 24 24" width="34" height="34" fill="none"
      stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 4.4-8 12-8 12s-8-7.6-8-12a8 8 0 0 1 16 0Z" fill="#af153e"/>
      <circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none"/>
    </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
})

export function MapPicker({ lat, lng, onChange }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const { t, lang } = useSettings()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [openList, setOpenList] = useState(false)

  function place(la: number, ln: number, fly = false) {
    if (!map.current) return
    if (marker.current) marker.current.setLatLng([la, ln])
    else marker.current = L.marker([la, ln], { icon: pinIcon }).addTo(map.current)
    if (fly) map.current.setView([la, ln], 16)
  }

  useEffect(() => {
    if (!el.current || map.current) return
    const hasPos = lat != null && lng != null
    const start: [number, number] = hasPos ? [lat!, lng!] : DEFAULT_CENTER
    const m = L.map(el.current, { attributionControl: false }).setView(
      start,
      hasPos ? 15 : 6
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(m)
    if (hasPos) marker.current = L.marker(start, { icon: pinIcon }).addTo(m)

    m.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: la, lng: ln } = e.latlng
      place(la, ln)
      onChangeRef.current(Number(la.toFixed(6)), Number(ln.toFixed(6)))
    })

    map.current = m
    const id = window.setTimeout(() => m.invalidateSize(), 250)
    return () => {
      window.clearTimeout(id)
      m.remove()
      map.current = null
      marker.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ค้นหาสถานที่ผ่าน Nominatim (debounce)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const id = window.setTimeout(async () => {
      setSearching(true)
      try {
        const url =
          'https://nominatim.openstreetmap.org/search?format=json&limit=5' +
          `&accept-language=${lang}&q=${encodeURIComponent(q)}`
        const res = await fetch(url, { signal: ctrl.signal })
        const data = (await res.json()) as SearchResult[]
        setResults(data)
        setOpenList(true)
      } catch {
        /* ยกเลิก/ผิดพลาด — ไม่ต้องทำอะไร */
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => {
      window.clearTimeout(id)
      ctrl.abort()
    }
  }, [query, lang])

  function pickResult(r: SearchResult) {
    const la = Number(Number(r.lat).toFixed(6))
    const ln = Number(Number(r.lon).toFixed(6))
    place(la, ln, true)
    onChangeRef.current(la, ln)
    setQuery(r.display_name)
    setOpenList(false)
    setResults([])
  }

  function locateMe() {
    if (!navigator.geolocation || !map.current) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = Number(pos.coords.latitude.toFixed(6))
        const ln = Number(pos.coords.longitude.toFixed(6))
        place(la, ln, true)
        onChangeRef.current(la, ln)
      },
      () => alert('ไม่สามารถเข้าถึงตำแหน่งได้')
    )
  }

  return (
    <div>
      <div className="map-search">
        <Search size={18} className="muted" aria-hidden />
        <input
          className="map-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpenList(true)}
          placeholder={t('searchPlace')}
        />
        {searching && <span className="map-search-spin">…</span>}
        {openList && results.length > 0 && (
          <ul className="map-results">
            {results.map((r, i) => (
              <li key={i} onClick={() => pickResult(r)}>
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
        {openList && !searching && query.trim().length >= 3 && results.length === 0 && (
          <ul className="map-results">
            <li className="muted">{t('noResults')}</li>
          </ul>
        )}
      </div>

      <div className="map-wrap">
        <div ref={el} className="map-picker" />
        <button
          type="button"
          className="btn btn-sm btn-action map-locate"
          onClick={locateMe}
        >
          <LocateFixed size={15} aria-hidden /> {t('myLocation')}
        </button>
      </div>
      <p className="muted" style={{ fontSize: '0.78rem', margin: '6px 2px 0' }}>
        {t('tapMapHint')}
      </p>
    </div>
  )
}
