"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
})

const THEME_KEY = 'theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null
    const nextTheme = storedTheme === 'dark' ? 'dark' : 'light'
    setThemeState(nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
