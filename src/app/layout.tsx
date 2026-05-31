import type { ReactNode } from 'react'
import '../index.css'
import { ThemeProvider } from './theme-provider'

export const metadata = {
  title: 'MYBUKO',
  description: 'Bucket list planner',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
