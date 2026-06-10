'use client'

import { ThemeProvider as CustomThemeProvider } from './theme-context'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <CustomThemeProvider>{children}</CustomThemeProvider>
}
