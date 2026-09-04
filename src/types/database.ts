export type Currency = 'THB' | 'MMK'
export type AppRole = 'admin' | 'staff'
export type DelivererMode = 'village' | 'day'
export type Lang = 'th' | 'my'
export type Theme = 'light' | 'dark'

export interface Profile {
  id: string
  username: string | null
  full_name: string
  role: AppRole
  lang: Lang
  currency: Currency
  theme: Theme
  created_at: string
}

export interface Village {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  created_at: string
  deleted_at: string | null
}

export interface Deliverer {
  id: string
  name: string
  mode: DelivererMode
  created_at: string
  deleted_at: string | null
}

export interface DelivererVillage {
  deliverer_id: string
  village_id: string
}

export interface DeliveryRecord {
  id: string
  deliverer_id: string
  village_id: string | null
  day_of_week: number | null
  house_no: string
  quantity: number
  amount: number
  currency: Currency
  paid: boolean
  note: string | null
  delivered_at: string
  created_at: string
  deleted_at: string | null
}
