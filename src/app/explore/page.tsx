"use client"

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme } from '../theme-provider'

import StoriesBar from '@/components/StoriesBar'

const ExploreFeed = dynamic(() => import('@/components/ExploreFeed'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-10">
      Loading community feed...
    </div>
  ),
})

export default function ExplorePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen transition-colors duration-300`}>
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Preview Community</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <StoriesBar />
        <ExploreFeed />
      </main>
    </div>
  )
}
