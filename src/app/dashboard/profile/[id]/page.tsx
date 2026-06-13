"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, Award, CheckCircle, MessageSquare, UserPlus, UserMinus, 
  ArrowLeft, Users, X, Flame, Shield, Trophy, Globe, Sparkles
} from 'lucide-react'
import { useTheme } from '../../../theme-provider'
import { motion, AnimatePresence } from 'framer-motion'

function formatJoinedDate(dateValue: string | undefined) {
  if (!dateValue) return 'recently'
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) return 'recently'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

// Relative time helper
const getRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'yesterday'
  return `${diffDay}d ago`
}

// Dynamic post date parser
const formatPostDate = (dateVal: any) => {
  if (!dateVal) return 'just now'
  if (typeof dateVal === 'string' && (dateVal.includes('ago') || dateVal.toLowerCase() === 'just now' || dateVal.toLowerCase() === 'yesterday')) {
    return dateVal
  }
  const date = new Date(dateVal)
  if (isNaN(date.getTime())) {
    const numVal = Number(dateVal)
    if (!isNaN(numVal)) {
      return getRelativeTime(new Date(numVal))
    }
    return String(dateVal)
  }
  return getRelativeTime(date)
}

type ActivityPost = {
  id: number | string
  author: string
  authorEmail?: string
  text: string
  date: string
  likes: number
  comments?: Array<{ id: number | string; author: string; text: string; date: string }>
}

export default function UserProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const targetUserId = params?.id as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileUser, setProfileUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Followers & Following Lists Modal States
  const [showModal, setShowModal] = useState<'followers' | 'following' | null>(null)
  const [modalUsersList, setModalUsersList] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  // Chat alert state
  const [dmError, setDmError] = useState('')
  const [isInitiatingChat, setIsInitiatingChat] = useState(false)

  // Feed posts for this user
  const [activityPosts, setActivityPosts] = useState<ActivityPost[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !targetUserId) return

    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!storedUser || !token) {
      router.push('/auth/login')
      return
    }

    const parsedCurrentUser = JSON.parse(storedUser)
    setCurrentUser(parsedCurrentUser)

    if (parsedCurrentUser.id === targetUserId) {
      router.replace('/dashboard/profile')
      return
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/users/${targetUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error('Failed to load profile details')
        }

        const data = await res.json()
        setProfileUser(data.user)

        // Load activity posts from database
        const postsRes = await fetch('/api/posts')
        if (postsRes.ok) {
          const postsData = await postsRes.json()
          const dbPosts = postsData.posts || []
          const userPosts = dbPosts.filter(
            (post: any) =>
              post.user.email === data.user.email || post.user.name === data.user.name
          )
          const mapped = userPosts.map((p: any) => ({
            id: p.id,
            author: p.user.name,
            authorEmail: p.user.email,
            text: p.text,
            date: p.createdAt,
            likes: p.likes?.length || 0,
            comments: (p.comments || []).map((c: any) => ({
              id: c.id,
              author: c.user?.name || 'Community Member',
              text: c.content,
              date: c.createdAt
            }))
          }))
          setActivityPosts(mapped)
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred loading the profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [targetUserId, router])

  const handleFollowToggle = async () => {
    if (!profileUser || !currentUser) return
    const token = localStorage.getItem('token')
    if (!token) return

    const currentlyFollowing = profileUser.isFollowing
    const updatedCount = currentlyFollowing
      ? Math.max(0, profileUser.followersCount - 1)
      : profileUser.followersCount + 1

    // Optimistic UI Update
    setProfileUser((prev: any) => ({
      ...prev,
      isFollowing: !currentlyFollowing,
      followersCount: updatedCount,
    }))

    try {
      if (currentlyFollowing) {
        const res = await fetch(`/api/follow?followingId=${encodeURIComponent(targetUserId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Unfollow request failed')
      } else {
        const res = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ followingId: targetUserId }),
        })
        if (!res.ok) throw new Error('Follow request failed')
      }

      const resSync = await fetch(`/api/users/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resSync.ok) {
        const syncData = await resSync.json()
        setProfileUser(syncData.user)
      }
    } catch (err) {
      console.error(err)
      setProfileUser((prev: any) => ({
        ...prev,
        isFollowing: currentlyFollowing,
        followersCount: profileUser.followersCount,
      }))
    }
  }

  const handleOpenListModal = async (type: 'followers' | 'following') => {
    setShowModal(type)
    setModalLoading(true)
    setModalUsersList([])

    try {
      const url = `/api/users/${targetUserId}/${type}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setModalUsersList(data[type] || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setModalLoading(false)
    }
  }

  const handleStartChat = async () => {
    if (isInitiatingChat) return
    setIsInitiatingChat(true)
    setDmError('')
    const token = localStorage.getItem('token')
    if (!token) {
      setIsInitiatingChat(false)
      return
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: targetUserId }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/chats/${data.chat.id}`)
      } else if (res.status === 403) {
        setDmError('Chat is only allowed between mutual followers. Make sure you follow each other!')
        setIsInitiatingChat(false)
      } else {
        const errData = await res.json()
        setDmError(errData.error || 'Unable to start chat room.')
        setIsInitiatingChat(false)
      }
    } catch (err) {
      console.error(err)
      setDmError('Network error starting chat.')
      setIsInitiatingChat(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-[#030712] text-slate-200`}>
        <p className="text-lg font-semibold animate-pulse">Loading User Profile...</p>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className={`min-h-screen p-8 bg-[#030712] text-slate-200`}>
        <div className="max-w-md mx-auto text-center py-16">
          <p className="text-rose-500 font-bold text-xl mb-4">Error Loading Profile</p>
          <p className="mb-6">{error || 'User not found.'}</p>
          <Link href="/dashboard?tab=community" className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700">
            Back to Community
          </Link>
        </div>
      </div>
    )
  }

  const joinedDate = formatJoinedDate(profileUser.createdAt)
  const stats = profileUser.stats || { totalGoals: 0, completedGoals: 0, inProgressGoals: 0, completionRate: 0 }
  
  const goalSetterUnlocked = stats.totalGoals > 0
  const firstVictoryUnlocked = stats.completedGoals > 0
  const powerUserUnlocked = stats.completedGoals >= 10

  const publicAchievements = [
    { id: 'goal_setter', name: 'Goal Setter', icon: '🎯', unlocked: goalSetterUnlocked, desc: 'Created at least one goal', rarity: 'Common' },
    { id: 'first_victory', name: 'First Victory', icon: '✅', unlocked: firstVictoryUnlocked, desc: 'Completed at least one goal', rarity: 'Rare' },
    { id: 'power_user', name: 'Power User', icon: '🏆', unlocked: powerUserUnlocked, desc: 'Completed 10 or more goals', rarity: 'Legendary' }
  ]

  // Dynamic public dream title
  const dreamTitle = (() => {
    if (stats.completedGoals >= 5) return 'Goal Master'
    if (stats.completedGoals >= 2) return 'Dream Chaser'
    return 'Dream Explorer'
  })()

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen relative overflow-hidden pb-12 transition-colors duration-300 font-sans ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Noise Texture Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-[0.02] ${isDark ? 'bg-[radial-gradient(#ffffff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000000_1px,transparent_1px)]'} [background-size:16px_16px] z-10`} />

      {/* Atmospheric Glowing Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-20%] left-[-20%] w-[60vw] h-[60vh] ${isDark ? 'bg-indigo-700/10' : 'bg-indigo-400/5'} rounded-full blur-[140px]`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] ${isDark ? 'bg-violet-700/10' : 'bg-violet-400/5'} rounded-full blur-[140px]`} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 z-20">
        
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard?tab=community"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-slate-900/60 text-slate-300 border-white/5 hover:bg-slate-800' 
                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
        </div>

        {/* Profile Card & Info grid */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr,1.8fr]">
          
          {/* Left Column: Avatar & Bio */}
          <div className="space-y-8">
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`rounded-3xl border p-8 text-center flex flex-col items-center ${
                isDark ? 'bg-[#0b1329]/50 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
              }`}
            >
              {/* Profile Image Frame */}
              <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center p-1 border-4 shadow-xl border-[#030712] mb-4">
                <div className="h-full w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center relative">
                  {profileUser.profileImage ? (
                    <img src={profileUser.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-14 h-14 text-slate-350" />
                  )}
                </div>
              </div>

              <h2 className={`text-2xl font-extrabold tracking-tight font-display ${isDark ? 'text-slate-100' : 'text-slate-905'}`}>{profileUser.name}</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{profileUser.email}</p>
              
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`text-[11px] font-semibold px-3 py-0.5 rounded-full border uppercase tracking-wider ${
                  isDark 
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                    : 'bg-indigo-50 border-indigo-200 text-indigo-750'
                }`}>
                  {dreamTitle}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Joined {joinedDate}</span>
              </div>

              {/* Biography display */}
              <div className="mt-6 w-full text-left">
                <h4 className={`text-[10px] font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Biography</h4>
                <p className={`text-xs leading-relaxed italic p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-950/40 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  {profileUser.bio || "No biography provided yet."}
                </p>
              </div>

              {/* Message / Chat alerts */}
              {dmError && (
                <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-[11px] text-rose-450 text-left w-full">
                  {dmError}
                </div>
              )}

              {/* Follow and Chat actions */}
              <div className="mt-6 flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 ${
                    profileUser.isFollowing 
                      ? 'border border-white/5 bg-slate-800 text-slate-200 hover:bg-slate-750' 
                      : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:opacity-95 shadow-md shadow-indigo-600/15'
                  }`}
                >
                  {profileUser.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isInitiatingChat}
                  onClick={handleStartChat}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider border transition-all duration-300 hover:scale-105 ${
                    isInitiatingChat ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isDark 
                      ? 'bg-slate-900 border-white/5 text-slate-100 hover:bg-slate-800' 
                      : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>

            </motion.div>

          </div>

          {/* Right Column: Statistics, Socials, Achievements, explore Feed */}
          <div className="space-y-8">
            
            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Goals', val: stats.totalGoals, color: 'text-indigo-550', spark: [3, 6, 8, 12, 16] },
                { label: 'Completed', val: stats.completedGoals, color: 'text-emerald-555', spark: [1, 2, 2, 3, 5] },
                { label: 'In Progress', val: stats.inProgressGoals, color: 'text-orange-550', spark: [2, 4, 6, 8, 11] },
                { label: 'Completion', val: `${stats.completionRate}%`, color: 'text-cyan-555', spark: [15, 30, 40, 50, 65] }
              ].map((card, i) => (
                <div 
                  key={i}
                  className={`rounded-2xl border p-4 flex flex-col justify-between h-28 ${
                    isDark ? 'bg-[#0b1329]/40 border-white/5' : 'bg-white border-slate-200 shadow-sm text-slate-900'
                  }`}
                >
                  <div>
                    <span className={`text-[9px] font-black block mb-0.5 uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</span>
                    <span className={`text-xl font-extrabold font-display ${card.color}`}>{card.val}</span>
                  </div>

                  {/* SVG Sparkline placeholder */}
                  <div className="w-full h-6 opacity-30 mt-2">
                    <svg viewBox="0 0 100 30" className="w-full h-full">
                      <polyline
                        fill="none"
                        className={isDark ? 'stroke-indigo-400' : 'stroke-indigo-600'}
                        strokeWidth="1.5"
                        points={card.spark.map((v, idx) => `${idx * 25},${30 - (v * 1.5)}`).join(' ')}
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Social directory */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-450" />
                  Social Directory
                </h3>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Connections</span>
              </div>

              <div className="flex items-center gap-8">
                <button
                  type="button"
                  onClick={() => handleOpenListModal('followers')}
                  className="text-left group focus:outline-none"
                >
                  <p className={`text-2xl font-black group-hover:underline ${isDark ? 'text-indigo-400' : 'text-indigo-750'}`}>{profileUser.followersCount}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Followers</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenListModal('following')}
                  className="text-left group focus:outline-none"
                >
                  <p className={`text-2xl font-black group-hover:underline ${isDark ? 'text-indigo-400' : 'text-indigo-750'}`}>{profileUser.followingCount}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Following</p>
                </button>
              </div>
            </div>

            {/* Achievements collectible badges */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
            }`}>
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5.5 h-5.5 text-indigo-450" />
                <h3 className="text-lg font-bold font-display">Achievements</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {publicAchievements.map((badge) => (
                  <div 
                    key={badge.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden group ${
                      badge.unlocked 
                        ? isDark
                          ? 'bg-gradient-to-br from-slate-900/60 to-indigo-950/40 border-indigo-500/25' 
                          : 'bg-gradient-to-br from-slate-50 to-indigo-50/50 border-slate-200 shadow-sm'
                        : isDark
                          ? 'bg-slate-950/40 border-white/5 grayscale opacity-40'
                          : 'bg-slate-100/50 border-slate-200 grayscale opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl">{badge.icon}</span>
                      {badge.unlocked && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>

                    <div className="mt-3">
                      <h4 className={`text-xs font-black leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{badge.name}</h4>
                      <p className={`text-[10px] mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{badge.desc}</p>
                    </div>

                    <span className={`absolute top-2 right-2 text-[8px] font-black uppercase px-1.5 rounded-full ${
                      badge.rarity === 'Legendary' ? 'bg-amber-500/10 text-amber-550' :
                      badge.rarity === 'Rare' ? 'bg-emerald-500/10 text-emerald-555' :
                      'bg-blue-500/10 text-blue-555'
                    }`}>
                      {badge.rarity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* explore Feed / Stories */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md text-slate-900'
            }`}>
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5.5 h-5.5 text-indigo-400" />
                <h3 className="text-lg font-bold font-display">Shared Community Feed</h3>
              </div>

              {activityPosts.length > 0 ? (
                <div className="space-y-4">
                  {activityPosts.map((post) => (
                    <div key={post.id} className={`rounded-2xl border p-5 ${
                      isDark ? 'bg-slate-950/50 border-white/5' : 'bg-slate-105/50 border-slate-250 shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black ${
                            isDark 
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {post.author.split(' ').map((s: string) => s[0]).join('').slice(0, 2)}
                          </div>
                          <p className={`text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>{post.author}</p>
                        </div>
                        <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          {formatPostDate(post.date)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>{post.text}</p>
                      
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className={`rounded-full border px-2.5 py-0.5 ${
                          isDark 
                            ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' 
                            : 'bg-emerald-50 text-emerald-750 border-emerald-200'
                        }`}>{post.likes} likes</span>
                        <span className={`rounded-full border px-2.5 py-0.5 ${
                          isDark 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                            : 'bg-indigo-50 text-indigo-750 border-indigo-200'
                        }`}>{post.comments?.length ?? 0} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-slate-500 py-4 text-center">
                  No community posts shared by this user yet.
                </p>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Followers / Following Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-[32px] overflow-hidden border shadow-2xl transition-all ${isDark ? 'bg-slate-950 border-white/10 text-slate-200' : 'bg-white border-gray-200 text-gray-900'}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-opacity-50 dark:border-white/5 border-gray-200">
              <h3 className="text-lg font-bold capitalize font-display">{showModal} List</h3>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className={`p-2 rounded-full transition-all ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4 scrollbar-thin">
              {modalLoading ? (
                <p className="text-center text-slate-400 animate-pulse text-xs">Fetching list details...</p>
              ) : modalUsersList.length === 0 ? (
                <p className="text-center text-slate-450 text-xs">No users found.</p>
              ) : (
                modalUsersList.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => {
                      setShowModal(null)
                      if (usr.id === currentUser?.id) {
                        router.push('/dashboard/profile')
                      } else {
                        router.push(`/dashboard/profile/${usr.id}`)
                      }
                    }}
                    className={`flex items-center gap-4 p-3 rounded-2xl border transition cursor-pointer ${isDark ? 'bg-slate-900/60 border-white/5 hover:bg-slate-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100/60'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black">
                      {usr.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-extrabold truncate text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{usr.name}</p>
                      <p className={`text-[10px] truncate ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>{usr.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </motion.div>
  )
}
