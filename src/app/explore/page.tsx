"use client"

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useTheme } from '../theme-provider'
import ExploreFeed from '@/components/ExploreFeed'

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
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Community Feed</p>
          <h2 className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">Stories from fellow goal-builders</h2>
          <p className="mt-3 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Discover inspiration, learn from others, and join conversations just like a modern feed experience.
          </p>
        </div>

        <ExploreFeed />
      </main>
    </div>
  )
}
