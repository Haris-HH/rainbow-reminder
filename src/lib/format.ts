import type { Currency } from '@/types/database'

// รองรับสกุลเงินเดียว: บาท (THB)
export function formatMoney(amount: number, _currency: Currency = 'THB'): string {
  const n = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `฿${n}`
}

export function mapsUrl(
  lat: number | null | undefined,
  lng: number | null | undefined,
  address?: string | null
): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  const q = encodeURIComponent(address ?? '')
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}
