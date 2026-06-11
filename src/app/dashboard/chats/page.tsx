"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../theme-provider'
import { 
  ArrowLeft, User, Globe, Search, MessageSquare, Sparkles, 
  Heart, Star, Bell, Plus, Settings, ShieldCheck, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatsListPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [chats, setChats] = useState<any[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [initiateError, setInitiateError] = useState('')
  const [initiating, setInitiating] = useState(false)

  // Categories and search state
  const [activeCategory, setActiveCategory] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!storedUser || !token) { router.push('/auth/login'); return }
    const parsed = JSON.parse(storedUser)
    setUser(parsed)

    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } })
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
          return
        }
        if (res.ok) {
          const data = await res.json()
          setChats(data.chats || [])
        }
      } catch (err) { 
        console.error(err) 
      } finally {
        setChatsLoading(false)
      }
    }

    const fetchMutuals = async () => {
      setContactsLoading(true)
      try {
        const resF = await fetch(`/api/users/${parsed.id}/followers`)
        const resG = await fetch(`/api/users/${parsed.id}/following`)
        if (resF.ok && resG.ok) {
          const fData = await resF.json()
          const gData = await resG.json()
          const followers = fData.followers || []
          const following = gData.following || []
          const mutuals = following.filter((f: any) => followers.some((fol: any) => fol.id === f.id))
          setMutualFollowers(mutuals)
        }
      } catch (err) {
        console.error('Failed to fetch mutual followers:', err)
      } finally {
        setContactsLoading(false)
      }
    }

    fetchChats()
    fetchMutuals()
  }, [router])

  const handleStartChat = async (participantId: string) => {
    if (initiating) return
    setInitiating(true)
    setInitiateError('')
    const token = localStorage.getItem('token')
    if (!token) {
      setInitiating(false)
      return
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/chats/${data.chat.id}`)
      } else {
        const errData = await res.json()
        setInitiateError(errData.error || 'Unable to start chat room.')
        setInitiating(false)
      }
    } catch (err) {
      console.error(err)
      setInitiateError('Network error starting chat.')
      setInitiating(false)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 dark:bg-slate-950 bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 animate-pulse font-medium">Synchronizing session...</p>
      </div>
    )
  }

  // Filtered Chats computed list
  const filteredChats = chats
    .filter(chat => {
      const other = chat.participants.find((p: any) => p.userId !== user.id)?.user
      if (!other) return false
      const nameMatch = other.name.toLowerCase().includes(searchQuery.toLowerCase())
      const emailMatch = other.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Match tabs categories
      if (activeCategory === 'unread') {
        // Mocking unread status check (e.g. if chat contains unread count)
        return (nameMatch || emailMatch) && chat.id.charCodeAt(0) % 2 === 0
      }
      if (activeCategory === 'favorites') {
        return (nameMatch || emailMatch) && chat.id.charCodeAt(0) % 3 === 0
      }
      if (activeCategory === 'groups') {
        return false // Single DM hub model primarily
      }
      return nameMatch || emailMatch
    })

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${
      isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Background Noise Overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none z-0" />
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />

      {/* Main Split Screen container */}
      <div className="max-w-7xl mx-auto px-4 py-6 h-[95vh] relative z-10 flex gap-6">
        
        {/* LEFT PANEL: Chat List Sidebar */}
        <aside className={`w-full lg:w-[380px] shrink-0 rounded-3xl border flex flex-col overflow-hidden transition-all duration-300 shadow-lg ${
          isDark 
            ? 'bg-[#0b0f19]/80 backdrop-blur-xl border-white/5 shadow-glow-violet' 
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          
          {/* Header area */}
          <div className="p-5 border-b dark:border-white/5 border-slate-150 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={`p-2.5 rounded-full border transition-all ${
                    isDark 
                      ? 'bg-slate-900 border-white/5 text-slate-350 hover:bg-slate-800' 
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 className="text-lg font-black tracking-tight leading-none">Chats</h1>
                  <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Online Hub
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/dashboard?tab=community"
                  className={`p-2 rounded-full border transition-all ${
                    isDark ? 'bg-slate-900 border-white/5 text-indigo-400 hover:bg-slate-850' : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'
                  }`}
                  title="Community Discovery"
                >
                  <Globe className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Real-time search filter */}
            <div className={`relative flex items-center rounded-2xl border px-3 py-2.5 ${
              isDark ? 'bg-slate-950/65 border-white/5' : 'bg-slate-100 border-slate-200'
            }`}>
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages or builders..."
                className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-500 text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:underline">Clear</button>
              )}
            </div>
            
            {/* Category tabs filters */}
            <div className="flex gap-1 bg-slate-100/50 dark:bg-slate-950/40 p-1 rounded-xl relative overflow-hidden">
              {(['all', 'unread', 'favorites', 'groups'] as const).map(tab => {
                const isActive = activeCategory === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveCategory(tab)}
                    className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all relative z-10 text-center"
                  >
                    <span className={isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-200'}>
                      {tab}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeCategoryIndicator"
                        className="absolute inset-0 bg-white dark:bg-[#0b0f19] rounded-lg -z-10 shadow-sm border dark:border-white/5 border-slate-150"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chats list area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-hide">
            {chatsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500">Retrieving chats...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="py-20 text-center space-y-2 text-xs text-slate-500 px-4">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                <p className="font-extrabold text-slate-400">No matching conversations</p>
                <p className="text-[10px] opacity-75">Start chats with active builders on the community feed.</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const other = chat.participants.find((p: any) => p.userId !== user.id)?.user
                const last = chat.messages?.[0]
                const isUnread = chat.id.charCodeAt(0) % 2 === 0 // Mocking unread status dynamically
                const isFavorite = chat.id.charCodeAt(0) % 3 === 0
                
                return (
                  <motion.div
                    whileHover={{ scale: 1.01, x: 2 }}
                    key={chat.id}
                    onClick={() => router.push(`/dashboard/chats/${chat.id}`)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      isDark 
                        ? 'bg-[#0f1423]/40 border-white/5 hover:bg-[#131b31]' 
                        : 'bg-white border-slate-150 hover:bg-slate-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with Online pulse */}
                      <div className="relative shrink-0">
                        {other?.profileImage ? (
                          <img src={other.profileImage} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="avatar" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-black text-xs">
                            {other?.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0b0f19] rounded-full" />
                      </div>

                      {/* Chat text description */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className={`text-xs font-black truncate text-slate-900 dark:text-white`}>
                            {other?.name || 'Dream Builder'}
                          </p>
                          {isFavorite && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                        </div>
                        
                        <p className={`text-[11px] truncate leading-normal mt-0.5 ${
                          isUnread ? 'font-black text-indigo-400' : 'text-slate-400'
                        }`}>
                          {last?.text ? last.text : 'No messages shared yet'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1.5 ml-2">
                      <span className="text-[9px] text-slate-500 font-semibold">
                        {last ? new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      {isUnread && (
                        <span className="h-4 min-w-[16px] px-1 rounded-full bg-indigo-600 text-[8px] font-black text-white flex items-center justify-center animate-pulse">
                          1
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: Desktop Empty State Onboarding */}
        <main className="hidden lg:flex lg:col-span-12 flex-1 rounded-3xl border overflow-hidden relative shadow-lg bg-[#0b0f19]/45 border-white/5 flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
          
          <div className="max-w-md space-y-5 relative z-10 flex flex-col items-center">
            {/* Ambient glowing orb */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 opacity-20 blur-xl animate-pulse mb-2" />
            
            {/* Empty State Vector/SVG Icon placeholder */}
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-indigo-400 shadow-xl mb-2">
              <MessageSquare className="w-8 h-8 animate-bounce-short" />
            </div>

            <h2 className="text-2xl font-black tracking-tight leading-none text-white font-display">
              Your conversations start here.
            </h2>
            <p className="text-xs text-slate-450 leading-relaxed max-w-sm">
              Connect with fellow builders to trade daily milestones, progress notebook updates, and keep your goals streak active.
            </p>

            <div className="w-full pt-4 border-t border-white/5">
              {initiateError && (
                <p className="text-rose-500 text-xs mb-3 font-semibold">⚠️ {initiateError}</p>
              )}

              {contactsLoading ? (
                <div className="py-4 flex gap-1 justify-center items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              ) : mutualFollowers.length > 0 ? (
                <div className="space-y-3 text-left">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Mutual Followers
                  </p>
                  <div className="grid gap-2.5 grid-cols-2">
                    {mutualFollowers.map((contact) => (
                      <button
                        key={contact.id}
                        disabled={initiating}
                        onClick={() => handleStartChat(contact.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                          initiating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 hover:-translate-y-0.5'
                        } bg-slate-950/40 border-white/5 text-slate-200`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-black text-xs">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-extrabold text-[11px] truncate text-white">{contact.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">Message</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-3 items-start text-left">
                    <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Dream Chats require mutual follows to unlock. Check out the community spotlights to follow peers.
                    </p>
                  </div>
                  
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-full font-black text-xs uppercase tracking-wider hover:shadow-lg transition-all"
                  >
                    Explore Community feed
                  </Link>
                </div>
              )}
            </div>

          </div>
        </main>

      </div>
    </div>
  )
}
