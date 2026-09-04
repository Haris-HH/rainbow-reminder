import type { Currency } from '@/types/database'

const symbols: Record<Currency, string> = {
  THB: '฿',
  MMK: 'K',
}

export function formatMoney(amount: number, currency: Currency): string {
  const n = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return currency === 'THB' ? `${symbols.THB}${n}` : `${n} ${symbols.MMK}`
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
