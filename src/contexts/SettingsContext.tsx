import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Currency, Lang, Style, Theme } from '@/types/database'
import { t as translate, type StringKey } from '@/i18n/strings'

interface SettingsValue {
  theme: Theme
  lang: Lang
  currency: Currency
  style: Style
  setTheme: (v: Theme) => void
  setLang: (v: Lang) => void
  setCurrency: (v: Currency) => void
  setStyle: (v: Style) => void
  t: (key: StringKey) => string
}

const SettingsContext = createContext<SettingsValue | null>(null)

function read<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) ?? fallback
  } catch {
    return fallback
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => read('theme', 'light'))
  const [lang, setLangState] = useState<Lang>(() => read('lang', 'th'))
  // รองรับสกุลเงินเดียว: THB (บังคับเสมอ ล้างค่าเก่าที่อาจเป็น MMK)
  const [currency, setCurrencyState] = useState<Currency>('THB')
  // default สไตล์ = Glassmorphism / iOS
  const [style, setStyleState] = useState<Style>(() => read('style', 'glass'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-style', style)
    document.documentElement.setAttribute('lang', lang)
  }, [theme, lang, style])

  const setTheme = (v: Theme) => {
    setThemeState(v)
    try {
      localStorage.setItem('theme', v)
    } catch {
      /* ignore */
    }
  }
  const setLang = (v: Lang) => {
    setLangState(v)
    try {
      localStorage.setItem('lang', v)
    } catch {
      /* ignore */
    }
  }
  const setCurrency = (v: Currency) => {
    setCurrencyState(v)
    try {
      localStorage.setItem('currency', v)
    } catch {
      /* ignore */
    }
  }
  const setStyle = (v: Style) => {
    setStyleState(v)
    try {
      localStorage.setItem('style', v)
    } catch {
      /* ignore */
    }
  }

  const value = useMemo<SettingsValue>(
    () => ({
      theme,
      lang,
      currency,
      style,
      setTheme,
      setLang,
      setCurrency,
      setStyle,
      t: (key) => translate(key, lang),
    }),
    [theme, lang, currency, style]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
