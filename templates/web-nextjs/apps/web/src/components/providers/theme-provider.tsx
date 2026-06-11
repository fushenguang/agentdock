'use client'

import { ThemeProvider as CustomThemeProvider } from './theme-context'
import { QueryProvider } from './query-provider'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <CustomThemeProvider>{children}</CustomThemeProvider>
    </QueryProvider>
  )
}
