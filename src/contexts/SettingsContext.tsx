import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Currency, Lang, Theme } from '@/types/database'
import { t as translate, type StringKey } from '@/i18n/strings'

interface SettingsValue {
  theme: Theme
  lang: Lang
  currency: Currency
  setTheme: (v: Theme) => void
  setLang: (v: Lang) => void
  setCurrency: (v: Currency) => void
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
  const [currency, setCurrencyState] = useState<Currency>(() =>
    read('currency', 'THB')
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('lang', lang)
  }, [theme, lang])

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

  const value = useMemo<SettingsValue>(
    () => ({
      theme,
      lang,
      currency,
      setTheme,
      setLang,
      setCurrency,
      t: (key) => translate(key, lang),
    }),
    [theme, lang, currency]
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
