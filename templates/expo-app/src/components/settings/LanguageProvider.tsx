import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_INTERFACE_LANGUAGE,
  INTERFACE_LANGUAGES,
  TRANSLATIONS,
  isInterfaceLanguage,
  type InterfaceLanguage,
  type InterfaceTranslationKey,
} from '../../core/i18n/translations'
import { getMobileDataStore } from '../../infra/sqlite/dataStore'

const LANGUAGE_PREFERENCE_KEY = 'interface.language'

export interface LanguageContextValue {
  readonly language: InterfaceLanguage
  readonly languageReady: boolean
  setLanguage(language: InterfaceLanguage): void
  t(key: InterfaceTranslationKey, values?: Record<string, string | number>): string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function format(template: string, values: Record<string, string | number> | undefined): string {
  if (!values) return template
  return Object.entries(values).reduce(
    (output, [key, value]) => output.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<InterfaceLanguage>(DEFAULT_INTERFACE_LANGUAGE)
  const [languageReady, setLanguageReady] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadPreference = async () => {
      try {
        const store = await getMobileDataStore()
        const preference = await store.preferences.get(LANGUAGE_PREFERENCE_KEY)
        if (cancelled) return
        if (preference && isInterfaceLanguage(preference.value)) setLanguageState(preference.value)
      } catch (error) {
        console.warn('Failed to load language preference', error)
      } finally {
        if (!cancelled && mountedRef.current) setLanguageReady(true)
      }
    }

    void loadPreference()
    return () => {
      cancelled = true
    }
  }, [])

  const setLanguage = useCallback((nextLanguage: InterfaceLanguage) => {
    setLanguageState(nextLanguage)
    void (async () => {
      try {
        const store = await getMobileDataStore()
        await store.preferences.set({
          key: LANGUAGE_PREFERENCE_KEY,
          value: nextLanguage,
          updatedAt: new Date().toISOString(),
        })
      } catch (error: unknown) {
        console.warn('Failed to save language preference', error)
      }
    })()
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languageReady,
      setLanguage,
      t: (key, values) => format(TRANSLATIONS[language][key], values),
    }),
    [language, languageReady, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

export { INTERFACE_LANGUAGES }
