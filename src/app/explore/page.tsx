"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Sparkles, TrendingUp, Users, Award, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme } from '../theme-provider'
import { motion, AnimatePresence } from 'framer-motion'
import StoriesBar from '@/components/StoriesBar'

const ExploreFeed = dynamic(() => import('@/components/ExploreFeed'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400 animate-pulse font-medium">Loading community feed...</p>
    </div>
  ),
})

export default function ExplorePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [stats, setStats] = useState({
    activeNow: 1248,
    dreamsMapped: 42890,
    completionRate: 94.2
  })

  // Simulate counter increments for a live feel
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeNow: prev.activeNow + (Math.random() > 0.5 ? 1 : -1),
        dreamsMapped: prev.dreamsMapped + (Math.random() > 0.7 ? 1 : 0)
      }))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      setIsLoggedIn(true)
      fetchNotifications()
      // Poll notifications every 15 seconds
      const interval = setInterval(fetchNotifications, 15000)
      return () => clearInterval(interval)
    }
  }, [])

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 font-sans ${
      isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Noise Overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none z-0" />
      
      {/* Glowing Mesh Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.2, 0.9, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] dark:bg-violet-600/5"
        />
        <motion.div 
          animate={{
            x: [0, -80, 50, 0],
            y: [0, 40, -80, 0],
            scale: [1, 0.9, 1.15, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 blur-[150px] dark:bg-indigo-500/5"
        />
        <motion.div 
          animate={{
            x: [0, 50, -30, 0],
            y: [0, 80, -40, 0],
            scale: [1, 1.1, 0.85, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-cyan-400/10 blur-[100px] dark:bg-cyan-400/5"
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl bg-white/70 border-slate-200/80 dark:border-white/5 dark:bg-[#030712]/70 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
              isDark 
                ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20' 
                : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          <div className="flex items-center gap-6 relative">
            <h1 className="text-sm font-extrabold tracking-[0.3em] uppercase bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
              Community Hub
            </h1>

            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-full transition-all duration-300 relative border flex items-center justify-center ${
                    isDark 
                      ? 'bg-slate-900 border-white/5 text-slate-300 hover:bg-slate-800' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white dark:ring-[#030712] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] py-3 border z-50 backdrop-blur-xl ${
                        isDark 
                          ? 'bg-slate-900/90 border-white/10 text-slate-100' 
                          : 'bg-white/95 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="px-4 pb-2 border-b flex justify-between items-center dark:border-white/5 border-slate-150">
                        <span className="font-bold text-xs tracking-wider uppercase text-slate-400">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-indigo-500 hover:text-indigo-400 font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto mt-2 space-y-1 px-2">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-500 font-medium">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-3 py-2.5 rounded-xl flex gap-2.5 transition-colors ${
                                !n.isRead 
                                  ? 'bg-indigo-500/5 dark:bg-indigo-500/10' 
                                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs leading-relaxed font-medium">
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {!n.isRead && (
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full self-center" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* PREMIUM HERO SECTION */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-cyan-500/5 backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 via-transparent to-cyan-500/10 opacity-30 pointer-events-none" />
          
          <div className="relative z-10 px-8 py-14 sm:px-12 sm:py-18 max-w-4xl mx-auto text-center space-y-6">
            {/* Tag Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isDark ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-violet-50 text-violet-700 border border-violet-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-violet-500" />
              Build Extraordinary Lives
            </motion.div>

            {/* Main Premium Typography Heading */}
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white font-display"
            >
              Connect. Learn. <br />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                Grow Together.
              </span>
            </motion.h2>

            {/* Subtitle description */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-650'
              }`}
            >
              Join ambitious creators documenting their journeys, sharing daily milestones, and unlocking their ultimate bucket lists.
            </motion.p>

            {/* Statistics Dashboard in Glass cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-3 gap-3 max-w-2xl mx-auto pt-6"
            >
              <div className={`p-4 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 hover:shadow-md'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-violet-500 mr-1.5" />
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Active</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-satoshi">
                  {stats.activeNow.toLocaleString()}
                </p>
              </div>

              <div className={`p-4 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 hover:shadow-md'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-500 mr-1.5" />
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Goals</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-satoshi">
                  {stats.dreamsMapped.toLocaleString()}
                </p>
              </div>

              <div className={`p-4 rounded-2xl border text-center transition-all ${
                isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-100 hover:shadow-md'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Award className="w-4 h-4 text-cyan-500 mr-1.5" />
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Rate</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-satoshi">
                  {stats.completionRate}%
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stories bar component */}
        <section className="relative z-20">
          <StoriesBar />
        </section>

        {/* Explore Feed component (now upgraded internally) */}
        <section className="relative z-10">
          <ExploreFeed />
        </section>
      </main>
    </div>
  )
}
