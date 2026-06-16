"use client"

import { useEffect, useRef, useState } from 'react'
import { 
  User, Award, CheckCircle, Pencil, Check, X, ArrowLeft, MessageSquare, 
  Globe, Flame, Activity, Calendar, Sun, Moon, Sparkles, TrendingUp, 
  Trophy, Compass, Camera, UploadCloud, Heart, Bookmark, ChevronRight, 
  Share2, Star, Trash2, Shield, Plus
} from 'lucide-react'
import { useTheme } from '../../theme-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

function formatJoinedDate(dateValue: string | undefined) {
  if (!dateValue) return 'recently'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'recently'
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
  if (Number.isNaN(date.getTime())) {
    const numVal = Number(dateVal)
    if (!Number.isNaN(numVal)) {
      return getRelativeTime(new Date(numVal))
    }
    return String(dateVal)
  }
  return getRelativeTime(date)
}

type ExploreActivityPost = {
  id: number | string
  author: string
  authorEmail?: string
  text: string
  date: string
  likes: number
  comments?: Array<{ id: number | string; author: string; text: string; date: string }>
}

type MemoryItem = {
  goalId: string
  goalTitle: string
  imageUrl: string
  caption: string
  date: string
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [streak, setStreak] = useState<number>(0)
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    completionRate: 0
  })
  const [isLoaded, setIsLoaded] = useState(false)
  
  const [bio, setBio] = useState('')
  const [bioDraft, setBioDraft] = useState('')
  const [isBioEditing, setIsBioEditing] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string>('')
  const [activityPosts, setActivityPosts] = useState<ExploreActivityPost[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [followingList, setFollowingList] = useState<any[]>([])
  const [saveMessage, setSaveMessage] = useState('')
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null)

  // Followers & Following Lists Modal States
  const [showModal, setShowModal] = useState<'followers' | 'following' | null>(null)
  const [modalUsersList, setModalUsersList] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  // Pinned badge states
  const [pinnedBadgeId, setPinnedBadgeId] = useState<string | null>(null)

  // Memory gallery states
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [uploadingForGoalId, setUploadingForGoalId] = useState<string | null>(null)
  const memoryFileInputRef = useRef<HTMLInputElement | null>(null)
  const [editingMemoryCaptionId, setEditingMemoryCaptionId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')

  // Quote state
  const [quoteIdx, setQuoteIdx] = useState(0)

  // Timeline filter state
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'milestones' | 'goals' | 'notes'>('all')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    setBio(parsedUser.bio || '')
    setBioDraft(parsedUser.bio || '')
    setProfilePicture(parsedUser.profilePicture || '')

    // Load pinned achievement
    const savedPinnedBadge = localStorage.getItem(`mybuko-pinned-badge-${parsedUser.id}`)
    if (savedPinnedBadge) {
      setPinnedBadgeId(savedPinnedBadge)
    }

    // Load memory gallery
    const savedMemories = localStorage.getItem(`mybuko-memories-${parsedUser.id}`)
    if (savedMemories) {
      try {
        setMemories(JSON.parse(savedMemories))
      } catch (e) {
        console.error(e)
      }
    }

    // Set daily quote index
    setQuoteIdx(new Date().getDate() % motivationalQuotes.length)

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${parsedUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            const updatedUserData = {
              ...parsedUser,
              name: data.user.name,
              email: data.user.email,
              bio: data.user.bio || '',
              profilePicture: data.user.profileImage || '',
              createdAt: data.user.createdAt, // real creation join date
            }
            localStorage.setItem('user', JSON.stringify(updatedUserData))
            setUser(updatedUserData)
            setBio(data.user.bio || '')
            setBioDraft(data.user.bio || '')
            setProfilePicture(data.user.profileImage || '')
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err)
      }
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/goals', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
          return
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => '')
          console.error(`Failed to fetch goals for profile stats: ${res.status} ${errText}`)
          return
        }

        const goalsData = await res.json()
        let merged = goalsData
        try {
          const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
          if (joinedRaw) {
            const joined = JSON.parse(joinedRaw) as any[]
            const userJoined = joined.filter(j => j.ownerEmail === parsedUser?.email || j.ownerName === parsedUser?.name)
            const unique = userJoined.filter(j => !goalsData.some((d: any) => String(d.id) === String(j.id) || d.title === j.title))
            merged = [...goalsData, ...unique]
          }
        } catch {
          // ignore
        }
        setGoals(merged)

        const totalGoals = merged.length
        const completedGoals = merged.filter((goal: any) => goal.status === 'Completed').length
        const inProgressGoals = merged.filter((goal: any) => goal.status === 'In Progress').length
        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

        setStats({
          totalGoals,
          completedGoals,
          inProgressGoals,
          completionRate
        })
        const calculatedStreak = merged.length > 0 ? Math.min(60, merged.length * 4 + completedGoals * 6) : 0
        setStreak(calculatedStreak)
        localStorage.setItem('mybuko-streak', String(calculatedStreak))
        setIsLoaded(true)
      } catch (error) {
        console.error('Error fetching profile stats:', error)
      }
    }

    const fetchFollows = async () => {
      try {
        const resF = await fetch(`/api/users/${parsedUser.id}/followers`)
        if (resF.ok) {
          const data = await resF.json()
          setFollowers(data.followers || [])
        }

        const resG = await fetch(`/api/users/${parsedUser.id}/following`)
        if (resG.ok) {
          const data = await resG.json()
          setFollowingList(data.following || [])
        }
      } catch (err) {
        console.error('Failed to fetch followers/following', err)
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mybuko-streak')
      if (saved) {
        setStreak(parseInt(saved, 10))
      } else {
        setStreak(0)
      }
    }

    fetchProfile()
    fetchStats()
    fetchFollows()
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return

    const fetchUserPosts = async () => {
      try {
        const res = await fetch('/api/posts')
        if (res.ok) {
          const data = await res.json()
          const dbPosts = data.posts || []
          const filtered = dbPosts.filter((post: any) => {
            return post.user.email === user.email || post.user.name === user.name
          })
          const mapped = filtered.map((p: any) => ({
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
      } catch (err) {
        console.error('Failed to fetch user posts:', err)
      }
    }

    fetchUserPosts()
  }, [user])

  if (!user) return <div className="flex items-center justify-center min-h-screen bg-[#030712] text-slate-200">Loading...</div>

  const isDark = theme === 'dark'
  const joinedDate = formatJoinedDate(user.createdAt)

  // Calculations for profile metrics
  const totalMilestones = goals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0)
  const completedMilestones = goals.reduce((acc, g) => acc + (g.milestones?.filter((m: any) => m.completed).length || 0), 0)
  const totalNotes = goals.reduce((acc, g) => acc + (g.notes?.length || 0), 0)

  const hasExplorer = goals.some(g => g.category === 'Travel' || g.category === 'Adventure')
  const hasAdventurer = goals.some(g => g.category === 'Adventure' && g.status === 'Completed')
  const hasPlanner = totalMilestones >= 5
  const hasDreamChaser = stats.completedGoals >= 2
  const hasGoalMaster = stats.completedGoals >= 5

  const achievementsList = [
    { id: 'explorer', name: 'Explorer', icon: '🧭', unlocked: hasExplorer, desc: 'Added Travel or Adventure dream', rarity: 'Common', color: 'from-blue-500 to-indigo-500' },
    { id: 'adventurer', name: 'Adventurer', icon: '🧗', unlocked: hasAdventurer, desc: 'Completed an Adventure goal', rarity: 'Rare', color: 'from-emerald-500 to-teal-500' },
    { id: 'planner', name: 'Planner', icon: '📝', unlocked: hasPlanner, desc: 'Created 5+ milestones', rarity: 'Rare', color: 'from-cyan-500 to-blue-500' },
    { id: 'dream_chaser', name: 'Dream Chaser', icon: '✨', unlocked: hasDreamChaser, desc: 'Completed 2+ goals', rarity: 'Epic', color: 'from-violet-500 to-fuchsia-500' },
    { id: 'goal_master', name: 'Goal Master', icon: '🏆', unlocked: hasGoalMaster, desc: 'Completed 5+ goals', rarity: 'Legendary', color: 'from-amber-500 to-rose-500' }
  ]

  const pinnedBadge = achievementsList.find(b => b.id === pinnedBadgeId)

  // Dynamic Recent Activity Timeline logs
  const activityLogs = (() => {
    const logs: any[] = []
    goals.forEach(g => {
      if (g.createdAt) {
        logs.push({
          id: `create-${g.id}`,
          text: `Logged a new dream: "${g.title}"`,
          date: new Date(g.createdAt),
          icon: '🎯',
          type: 'goals'
        })
      }
      (g.notes || []).forEach((n: any) => {
        logs.push({
          id: `note-${n.id}`,
          text: `Added a note to "${g.title}"`,
          date: new Date(n.createdAt || g.createdAt),
          icon: '📝',
          type: 'notes'
        })
      });
      (g.milestones || []).forEach((m: any) => {
        if (m.completed) {
          logs.push({
            id: `milestone-${m.id}`,
            text: `Achieved milestone: "${m.title}" in "${g.title}"`,
            date: new Date(m.createdAt || g.createdAt),
            icon: '✅',
            type: 'milestones'
          })
        }
      })
    })
    return logs.sort((a, b) => b.date.getTime() - a.date.getTime())
  })()

  // Filtered timeline logs
  const filteredActivityLogs = activityLogs.filter(log => {
    if (timelineFilter === 'all') return true
    return log.type === timelineFilter
  }).slice(0, 7)

  // Calculate Dream Score
  const goalsCompletedPoints = stats.completedGoals * 150
  const goalsInProgressPoints = stats.inProgressGoals * 40
  const milestonesCompletedPoints = completedMilestones * 15
  const streakPoints = streak * 30
  const followersPoints = followers.length * 20
  const pinnedPoints = pinnedBadgeId ? 100 : 0
  
  const totalDreamScore = goalsCompletedPoints + goalsInProgressPoints + milestonesCompletedPoints + streakPoints + followersPoints + pinnedPoints
  const currentLevel = Math.max(1, Math.floor(totalDreamScore / 400) + 1)
  const scoreNeededForNextLevel = currentLevel * 400
  const scoreInCurrentLevel = totalDreamScore % 400
  const levelProgressPercent = isLoaded 
    ? Math.min(100, Math.round((scoreInCurrentLevel / 400) * 100))
    : 0

  const rankLabel = (() => {
    if (totalDreamScore < 400) return 'Beginner'
    if (totalDreamScore < 1000) return 'Explorer'
    if (totalDreamScore < 2200) return 'Adventurer'
    if (totalDreamScore < 4000) return 'Dream Chaser'
    if (totalDreamScore < 7000) return 'Goal Master'
    return 'Legend'
  })()

  // Calculate Dream Title
  const dreamTitle = (() => {
    const categories = goals.map(g => g.category)
    const travelCount = categories.filter(c => c === 'Travel').length
    const adventureCount = categories.filter(c => c === 'Adventure').length
    const skillsCount = categories.filter(c => c === 'Skills').length
    
    if (totalDreamScore >= 5000) return 'Goal Master'
    if (travelCount >= 3) return 'World Traveler'
    if (adventureCount >= 3) return 'Adventure Seeker'
    if (skillsCount >= 3) return 'Skill Craftsman'
    return 'Dream Explorer'
  })()

  // Profile Completeness Tracker
  const completenessItems = [
    { label: 'Profile Picture Uploaded', completed: !!profilePicture, weight: 25 },
    { label: 'Biography Added', completed: bio.length > 5, weight: 25 },
    { label: 'Create 2+ Dreams', completed: stats.totalGoals >= 2, weight: 25 },
    { label: 'Add 1+ Community Activity', completed: activityPosts.length >= 1, weight: 25 }
  ]
  const profileCompleteness = completenessItems.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0)

  // Weekly Calendar Tracker (Sun-Sat)
  const getWeeklyCalendar = () => {
    const today = new Date()
    const currentDayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDayOfWeek)

    const days = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek)
      currentDate.setDate(startOfWeek.getDate() + i)
      currentDate.setHours(0, 0, 0, 0)

      let active = false
      goals.forEach(g => {
        const createD = g.createdAt ? new Date(g.createdAt) : null
        if (createD) {
          createD.setHours(0, 0, 0, 0)
          if (createD.getTime() === currentDate.getTime()) active = true
        }

        (g.milestones || []).forEach((m: any) => {
          const milestoneD = m.createdAt ? new Date(m.createdAt) : (g.createdAt ? new Date(g.createdAt) : null)
          if (milestoneD && m.completed) {
            milestoneD.setHours(0, 0, 0, 0)
            if (milestoneD.getTime() === currentDate.getTime()) active = true
          }
        })
      })

      days.push({
        name: dayNames[i],
        date: currentDate,
        isToday: currentDate.toDateString() === today.toDateString(),
        active,
        isPast: currentDate < today
      })
    }
    return days
  }
  const weeklyCalendarDays = getWeeklyCalendar()

  // Goal Completion Heatmap Data (last 16 weeks)
  const getHeatmapData = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const data = []
    
    const daysToShow = 112 // 16 weeks
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - daysToShow + 1)
    
    const activityMap: Record<string, number> = {}
    
    goals.forEach(g => {
      if (g.createdAt) {
        const dStr = new Date(g.createdAt).toDateString()
        activityMap[dStr] = (activityMap[dStr] || 0) + 1
      }
      if (g.status === 'Completed' && g.updatedAt) {
        const dStr = new Date(g.updatedAt).toDateString()
        activityMap[dStr] = (activityMap[dStr] || 0) + 2
      }
      (g.milestones || []).forEach((m: any) => {
        if (m.completed) {
          const mDate = m.createdAt ? new Date(m.createdAt) : (g.createdAt ? new Date(g.createdAt) : null)
          if (mDate) {
            const dStr = new Date(mDate).toDateString()
            activityMap[dStr] = (activityMap[dStr] || 0) + 1
          }
        }
      })
    })

    for (let i = 0; i < daysToShow; i++) {
      const curr = new Date(startDate)
      curr.setDate(startDate.getDate() + i)
      const dStr = curr.toDateString()
      const count = activityMap[dStr] || 0
      
      let level = 0
      if (count > 0 && count <= 1) level = 1
      else if (count > 1 && count <= 2) level = 2
      else if (count > 2 && count <= 4) level = 3
      else if (count > 4) level = 4

      data.push({
        date: curr,
        level,
        count
      })
    }
    return data
  }
  const heatmapData = getHeatmapData()

  // Monthly Recap calculation
  const getMonthlyRecap = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    let completedThisMonth = 0
    let milestonesThisMonth = 0
    
    goals.forEach(g => {
      if (g.status === 'Completed' && g.updatedAt) {
        const uD = new Date(g.updatedAt)
        if (uD.getMonth() === currentMonth && uD.getFullYear() === currentYear) {
          completedThisMonth++
        }
      }
      (g.milestones || []).forEach((m: any) => {
        if (m.completed && m.createdAt) {
          const mD = new Date(m.createdAt)
          if (mD.getMonth() === currentMonth && mD.getFullYear() === currentYear) {
            milestonesThisMonth++
          }
        }
      })
    })
    
    return {
      completedThisMonth,
      milestonesThisMonth,
      monthName: today.toLocaleString('default', { month: 'long' })
    }
  }
  const monthlyRecap = getMonthlyRecap()

  // Community ranking percentile calculation
  const communityRanking = (() => {
    if (totalDreamScore > 4000) return { percentile: 'Top 2%', status: 'Elite Planner' }
    if (totalDreamScore > 2000) return { percentile: 'Top 10%', status: 'Top Dreamer' }
    if (totalDreamScore > 1000) return { percentile: 'Top 25%', status: 'Most Active Planner' }
    return { percentile: 'Top 50%', status: 'Rising Explorer' }
  })()

  // Handle badge pinning/unpinning
  const handleBadgeClick = (badgeId: string, unlocked: boolean) => {
    if (!unlocked) return
    let nextPinned: string | null = badgeId
    if (pinnedBadgeId === badgeId) {
      nextPinned = null
    }
    setPinnedBadgeId(nextPinned)
    if (user) {
      if (nextPinned) {
        localStorage.setItem(`mybuko-pinned-badge-${user.id}`, nextPinned)
      } else {
        localStorage.removeItem(`mybuko-pinned-badge-${user.id}`)
      }
    }
  }

  // Memory uploading
  const triggerMemoryUpload = (goalId: string) => {
    setUploadingForGoalId(goalId)
    setTimeout(() => {
      memoryFileInputRef.current?.click()
    }, 100)
  }

  const handleMemoryFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !uploadingForGoalId) return

    const goal = goals.find(g => g.id === uploadingForGoalId)
    const goalTitle = goal ? goal.title : 'My Bucket Goal'

    setSaveMessage('Uploading photo...')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      const data = await uploadRes.json()
      if (data.url) {
        const newMemory: MemoryItem = {
          goalId: uploadingForGoalId,
          goalTitle,
          imageUrl: data.url,
          caption: 'My memory snapshot!',
          date: new Date().toLocaleDateString()
        }
        
        const updatedMemories = memories.filter(m => m.goalId !== uploadingForGoalId)
        updatedMemories.unshift(newMemory)
        setMemories(updatedMemories)
        
        if (user) {
          localStorage.setItem(`mybuko-memories-${user.id}`, JSON.stringify(updatedMemories))
        }
        setSaveMessage('Memory photo uploaded!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (err) {
      console.error(err)
      setSaveMessage('Upload failed')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setUploadingForGoalId(null)
      if (memoryFileInputRef.current) memoryFileInputRef.current.value = ''
    }
  }

  const startEditingCaption = (memory: MemoryItem) => {
    setEditingMemoryCaptionId(memory.goalId)
    setCaptionDraft(memory.caption)
  }

  const saveMemoryCaption = (goalId: string) => {
    const updated = memories.map(m => {
      if (m.goalId === goalId) {
        return { ...m, caption: captionDraft }
      }
      return m
    })
    setMemories(updated)
    if (user) {
      localStorage.setItem(`mybuko-memories-${user.id}`, JSON.stringify(updated))
    }
    setEditingMemoryCaptionId(null)
  }

  const handleDeleteMemory = (goalId: string) => {
    const updated = memories.filter(m => m.goalId !== goalId)
    setMemories(updated)
    if (user) {
      localStorage.setItem(`mybuko-memories-${user.id}`, JSON.stringify(updated))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/')
  }

  const updateUserProfile = async (updates: Partial<any>) => {
    if (!user) return
    const token = localStorage.getItem('token')
    if (!token) return

    const updatedUser = { ...user, ...updates }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    if (updates.bio !== undefined) {
      setBio(updates.bio)
      setBioDraft(updates.bio)
    }
    if (updates.profilePicture !== undefined) setProfilePicture(updates.profilePicture)

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!res.ok) {
        throw new Error('Failed to save profile changes to database')
      }

      const data = await res.json()
      if (data.user) {
        const finalUser = {
          ...updatedUser,
          name: data.user.name,
          email: data.user.email,
          bio: data.user.bio || '',
          profilePicture: data.user.profileImage || '',
          createdAt: data.user.createdAt, // Real Join Date
        }
        localStorage.setItem('user', JSON.stringify(finalUser))
        setUser(finalUser)
        setBio(data.user.bio || '')
        setBioDraft(data.user.bio || '')
        setProfilePicture(data.user.profileImage || '')
      }

      setSaveMessage('Profile saved')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setSaveMessage('Failed to save to database')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const triggerFileInput = () => {
    hiddenFileInputRef.current?.click()
  }

  const handlePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSaveMessage('Uploading picture...')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      const data = await uploadRes.json()
      if (data.url) {
        await updateUserProfile({ profilePicture: data.url })
      } else {
        throw new Error('No url returned')
      }
    } catch (err) {
      console.error(err)
      setSaveMessage('Upload failed')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const startBioEditing = () => {
    setBioDraft(bio)
    setIsBioEditing(true)
  }

  const cancelBioEditing = () => {
    setBioDraft(bio)
    setIsBioEditing(false)
  }

  const saveBio = () => {
    updateUserProfile({ bio: bioDraft })
    setIsBioEditing(false)
  }

  const handleOpenListModal = async (type: 'followers' | 'following') => {
    if (!user) return
    setShowModal(type)
    setModalLoading(true)
    setModalUsersList([])

    try {
      const url = `/api/users/${user.id}/${type}`
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

  const handleFollowToggleInModal = async (targetId: string, isCurrentlyFollowing: boolean) => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (isCurrentlyFollowing) {
      setFollowingList((prev) => prev.filter((item) => item.id !== targetId))
    } else {
      const usr = modalUsersList.find((u) => u.id === targetId) || followers.find((u) => u.id === targetId)
      if (usr) {
        setFollowingList((prev) => [...prev, usr])
      }
    }

    try {
      if (isCurrentlyFollowing) {
        const res = await fetch(`/api/follow?followingId=${encodeURIComponent(targetId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ followingId: targetId })
        })
        if (!res.ok) throw new Error()
      }
      
      if (user) {
        const resF = await fetch(`/api/users/${user.id}/followers`)
        if (resF.ok) {
          const data = await resF.json()
          setFollowers(data.followers || [])
        }
        const resG = await fetch(`/api/users/${user.id}/following`)
        if (resG.ok) {
          const data = await resG.json()
          setFollowingList(data.following || [])
          if (showModal === 'following') {
            setModalUsersList(data.following || [])
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

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
        <div className={`absolute top-[40%] right-[10%] w-[45vw] h-[45vh] ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-400/3'} rounded-full blur-[110px]`} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 z-20">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-slate-900/60 text-slate-350 border-white/5 hover:bg-slate-800' 
                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/chats"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'bg-slate-900/60 text-slate-350 border-white/5 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Chats
            </Link>
            <Link
              href="/dashboard?tab=community"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'bg-slate-900/60 text-slate-350 border-white/5 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <Globe className="w-4 h-4 text-cyan-500" />
              Community
            </Link>

            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2.5 rounded-full border transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'bg-slate-900/60 text-yellow-400 border-white/5 hover:bg-slate-800' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
              }`}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* PROFILE HERO BANNER */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className={`relative rounded-[32px] overflow-hidden border mb-8 ${
            isDark ? 'bg-[#0b1329]/50 border-white/5 text-slate-100' : 'bg-white border-slate-200/80 text-slate-900 shadow-xl'
          }`}
        >
          {/* Hero Banner Gradient Backdrop */}
          <div className="absolute inset-0 h-44 bg-gradient-to-r from-indigo-700 via-violet-700 to-cyan-500 opacity-80 z-0">
            <div className="absolute inset-0 noise-overlay mix-blend-overlay" />
          </div>

          <div className="relative px-8 pb-8 pt-24 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
              {/* Profile Avatar Frame */}
              <div className="relative w-36 h-36 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center p-1 border-4 shadow-xl border-[#030712] animate-bounce-slow">
                <div className="h-full w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center relative group">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-300" />
                  )}
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                    aria-label="Edit profile picture"
                  >
                    <Camera className="w-7 h-7 text-white" />
                  </button>
                  <input
                    ref={hiddenFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className={`text-3xl font-extrabold tracking-tight font-display ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user.name}</h2>
                  {pinnedBadge && (
                    <motion.div 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        isDark 
                          ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400 shadow-glow-yellow' 
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                      }`}
                      title={`Favorite Pinned Achievement: ${pinnedBadge.name}`}
                    >
                      <Star className={`w-3 h-3 ${isDark ? 'fill-yellow-400' : 'fill-amber-600'}`} />
                      <span>{pinnedBadge.name}</span>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1.5">
                  <span className={`text-sm font-semibold font-display px-3 py-0.5 rounded-full border ${
                    isDark 
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' 
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {dreamTitle}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Joined {joinedDate}</span>
                </div>

                <p className={`text-xs max-w-sm mt-3 italic font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  "Turning dreams into reality, one milestone at a time."
                </p>
              </div>
            </div>

            {/* Premium Dream Score Circle */}
            <div className={`flex items-center justify-center gap-5 backdrop-blur-md rounded-3xl p-5 border max-w-sm ${
              isDark ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50/80 border-slate-200 shadow-sm'
            }`}>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="38" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="8" fill="transparent" />
                  <motion.circle 
                    cx="48" 
                    cy="48" 
                    r="38" 
                    className="stroke-indigo-500" 
                    strokeWidth="8" 
                    fill="transparent"
                    strokeDasharray="238.7"
                    initial={{ strokeDashoffset: 238.7 }}
                    animate={{ strokeDashoffset: 238.7 - (238.7 * levelProgressPercent) / 100 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className={`text-xl font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{totalDreamScore}</span>
                  <p className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>SCORE</p>
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>Level {currentLevel}</p>
                <h4 className={`text-base font-extrabold font-display leading-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{rankLabel}</h4>
                <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>{scoreNeededForNextLevel - totalDreamScore} points to next rank</p>
              </div>
            </div>

          </div>
        </motion.div>

        {/* GRID LAYOUT */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr,1.8fr]">
          
          {/* LEFT COLUMN: BIO, STREAKS, MEMORIES */}
          <div className="space-y-8">
            
            {/* BIO & QUICK DETAILS */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`rounded-3xl border p-6 ${
                isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" />
                  About Me
                </h3>
                
                <div className="flex items-center gap-2">
                  {isBioEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveBio}
                        className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-455 hover:bg-emerald-500/20 transition-all"
                        aria-label="Save bio"
                      >
                        <Check className="w-4.5 h-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelBioEditing}
                        className="p-1.5 rounded-full bg-rose-500/10 text-rose-455 hover:bg-rose-500/20 transition-all"
                        aria-label="Cancel editing"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startBioEditing}
                      className={`p-1.5 rounded-full transition-all ${
                        isDark ? 'hover:bg-slate-800 text-slate-350' : 'hover:bg-gray-100 text-slate-600'
                      }`}
                      aria-label="Edit bio"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isBioEditing ? (
                <textarea
                  value={bioDraft}
                  onChange={(event) => setBioDraft(event.target.value)}
                  rows={4}
                  placeholder="Tell us something about your dream journey..."
                  className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 ${
                    isDark ? 'bg-slate-950 border-white/10 text-slate-100' : 'bg-slate-50 border-gray-200 text-gray-900'
                  }`}
                />
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {bio || "Tell us something about yourself and your dream planning journey."}
                </p>
              )}

              {saveMessage && <p className="text-xs text-indigo-550 mt-3 font-semibold">{saveMessage}</p>}
            </motion.div>

            {/* PROFILE COMPLETENESS WIDGET */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <h3 className="text-base font-bold font-display flex items-center gap-2 mb-3">
                <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
                Profile Completeness
              </h3>
              
              <div className="flex items-center justify-between text-xs font-bold text-slate-405 mb-2">
                <span>Completed Tasks</span>
                <span className="text-cyan-505">{profileCompleteness}%</span>
              </div>
              <div className="w-full bg-slate-950/20 dark:bg-slate-950/60 rounded-full h-2 overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompleteness}%` }}
                  transition={{ duration: 0.8 }}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full"
                />
              </div>

              <div className="space-y-2.5">
                {completenessItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-405 dark:border-slate-600 shrink-0" />
                    )}
                    <span className={item.completed 
                      ? `line-through ${isDark ? 'text-slate-450' : 'text-slate-400'}` 
                      : `${isDark ? 'text-slate-200' : 'text-slate-700'}`
                    }>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* STREAK STATUS WIDGET */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                  Dreaming Streak
                </h3>
                <span className="text-xs text-orange-605 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  {streak} Days strong
                </span>
              </div>

              <div className={`flex items-center gap-4 rounded-2xl p-4 border mb-4 ${
                isDark ? 'bg-slate-950/30 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                  <Flame className="w-7 h-7 animate-bounce-slow" />
                </div>
                <div>
                  <h4 className={`font-extrabold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Planning Streak</h4>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Return daily to update active goals and grow your planning momentum.</p>
                </div>
              </div>

              {/* Weekly active calendar */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {weeklyCalendarDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                      day.active 
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-550' 
                        : day.isToday 
                          ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-650' 
                          : `${isDark ? 'bg-slate-950/40 border-white/5 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'}`
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase">{day.name}</span>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black">
                      {day.active ? (
                        <Flame className="w-4 h-4 fill-orange-500 stroke-none" />
                      ) : (
                        day.date.getDate()
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MEMORY GALLERY */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-500" />
                  Memory Gallery
                </h3>
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Polaroid Moments</span>
              </div>

              {/* Upload area for completed goals */}
              {goals.filter(g => g.status === 'Completed' && !memories.some(m => m.goalId === g.id)).length > 0 && (
                <div className={`mb-4 border border-dashed rounded-2xl p-4 flex flex-col items-center text-center ${
                  isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'
                }`}>
                  <UploadCloud className={`w-7 h-7 mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Capture Completed Dreams</p>
                  <p className={`text-[10px] mt-1 max-w-[200px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select a completed dream to upload a snapshot memory photo.</p>
                  
                  <div className="mt-3 w-full max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {goals.filter(g => g.status === 'Completed' && !memories.some(m => m.goalId === g.id)).map(g => (
                      <button
                        key={g.id}
                        onClick={() => triggerMemoryUpload(g.id)}
                        className={`w-full text-left text-[11px] font-bold py-1.5 px-3.5 rounded-lg border transition-all flex items-center justify-between ${
                          isDark 
                            ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/20' 
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border-indigo-200'
                        }`}
                      >
                        <span className="truncate">{g.title}</span>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                  <input
                    ref={memoryFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMemoryFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Memory List Carousel / Grid */}
              {memories.length === 0 ? (
                <div className={`text-center py-8 border rounded-2xl ${
                  isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-100/50 border-slate-200'
                }`}>
                  <Camera className="w-8 h-8 text-slate-550 mx-auto mb-2 opacity-50" />
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No memories cataloged yet.</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Upload memory snapshots for completed dreams.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {memories.map((m, idx) => (
                    <motion.div 
                      key={m.goalId}
                      whileHover={{ scale: 1.03, rotate: idx % 2 === 0 ? 1.5 : -1.5 }}
                      className="bg-white p-3 shadow-lg border border-slate-200 text-slate-800 rounded-lg relative group transition-all"
                    >
                      {/* Photo Area */}
                      <div className="aspect-square bg-slate-100 rounded-sm overflow-hidden relative border border-slate-250">
                        <img src={m.imageUrl} alt={m.goalTitle} className="h-full w-full object-cover" />
                        <button
                          onClick={() => handleDeleteMemory(m.goalId)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete memory"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Handwritten Polaroid Caption */}
                      <div className="pt-2 text-center text-xs font-semibold font-sans tracking-wide">
                        <p className="text-[10px] font-black text-slate-400 truncate">{m.goalTitle}</p>
                        
                        {editingMemoryCaptionId === m.goalId ? (
                          <div className="flex items-center gap-1 mt-1">
                            <input
                              type="text"
                              value={captionDraft}
                              onChange={(e) => setCaptionDraft(e.target.value)}
                              className="text-[10px] font-medium border border-slate-300 rounded px-1 py-0.5 w-full focus:outline-none"
                              autoFocus
                              onBlur={() => saveMemoryCaption(m.goalId)}
                              onKeyDown={(e) => e.key === 'Enter' && saveMemoryCaption(m.goalId)}
                            />
                          </div>
                        ) : (
                          <p 
                            onClick={() => startEditingCaption(m)}
                            className="mt-1 text-[11px] font-bold text-slate-800 cursor-pointer hover:bg-slate-100 rounded py-0.5 truncate italic"
                            title="Click to edit caption"
                          >
                            {m.caption}
                          </p>
                        )}
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">{m.date}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* DAILY MOTIVATION WIDGET */}
            <div className={`rounded-3xl border p-6 relative overflow-hidden ${
              isDark ? 'bg-gradient-to-br from-indigo-900/20 via-violet-900/20 to-slate-900/20 border-white/5' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
              <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? 'text-indigo-400' : 'text-indigo-650'}`}>Daily Inspiration</h3>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={quoteIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <p className={`text-sm font-bold leading-relaxed font-display ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    "{motivationalQuotes[quoteIdx].text}"
                  </p>
                  <p className={`text-[10px] font-extrabold text-right ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                    — {motivationalQuotes[quoteIdx].author}
                  </p>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() => setQuoteIdx((prev) => (prev + 1) % motivationalQuotes.length)}
                className={`mt-4 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                  isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-700 hover:text-indigo-850'
                }`}
              >
                <span>Rotate Daily Motivation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: STATS, BADGES, VISION BOARD, TIMELINES */}
          <div className="space-y-8">
            
            {/* STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Goals', val: stats.totalGoals, color: 'text-indigo-550', spark: [5, 10, 8, 14, 18], trend: '+3 new' },
                { label: 'Completed', val: stats.completedGoals, color: 'text-emerald-555', spark: [1, 2, 2, 4, 6], trend: '100% path' },
                { label: 'Active Goals', val: stats.inProgressGoals, color: 'text-orange-550', spark: [4, 8, 6, 10, 12], trend: 'Progressing' },
                { label: 'Completion', val: `${stats.completionRate}%`, color: 'text-cyan-555', spark: [20, 35, 45, 60, 75], trend: '+12% rate' }
              ].map((card, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className={`rounded-2xl border p-4 flex flex-col justify-between h-32 relative overflow-hidden group ${
                    isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div>
                    <span className={`text-[10px] font-bold block mb-1 uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</span>
                    <span className={`text-2xl font-extrabold font-display ${card.color}`}>{card.val}</span>
                  </div>

                  {/* Sparkline visualization */}
                  <div className="w-full h-8 opacity-45 group-hover:opacity-75 transition-opacity">
                    <svg viewBox="0 0 100 30" className="w-full h-full">
                      <polyline
                        fill="none"
                        className={isDark ? 'stroke-indigo-400' : 'stroke-indigo-600'}
                        strokeWidth="2"
                        points={card.spark.map((v, idx) => `${idx * 25},${30 - (v * 1.5)}`).join(' ')}
                      />
                    </svg>
                  </div>
                  
                  <div className={`flex items-center justify-between text-[9px] font-bold mt-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span>{card.trend}</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* COLLECTIBLE ACHIEVEMENTS / BADGES */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award className="w-5.5 h-5.5 text-indigo-455" />
                  <h3 className="text-lg font-bold font-display">Collectible Achievements</h3>
                </div>
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Click to Pin Favorite</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {achievementsList.map((badge) => {
                  const isPinned = pinnedBadgeId === badge.id
                  return (
                    <motion.div 
                      key={badge.id}
                      onClick={() => handleBadgeClick(badge.id, badge.unlocked)}
                      className={`relative group aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all p-3 cursor-pointer select-none ${
                        badge.unlocked 
                          ? isPinned
                            ? 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-yellow-500/70 shadow-glow-yellow'
                            : `${isDark ? 'bg-gradient-to-br from-slate-900/60 to-indigo-955/40 border-indigo-500/25 hover:border-indigo-400' : 'bg-gradient-to-br from-slate-50 to-indigo-50/30 border-slate-200 hover:border-indigo-400'} hover:scale-105 shadow-sm`
                          : `${isDark ? 'bg-slate-950/40 border-white/5' : 'bg-slate-100/50 border-slate-200'} grayscale opacity-30 cursor-not-allowed`
                      }`}
                    >
                      {/* Favorite Pinned Star Badge indicator */}
                      {isPinned && (
                        <div className="absolute top-1.5 right-1.5">
                          <Star className={`w-3.5 h-3.5 fill-yellow-400 stroke-none ${isDark ? 'text-yellow-400' : 'text-amber-500'}`} />
                        </div>
                      )}

                      <span className="text-3.5xl mb-1.5 animate-pulse-slow">{badge.icon}</span>
                      <span className={`text-[10px] font-black tracking-tight text-center ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{badge.name}</span>
                      
                      {/* Rarity label */}
                      <span className={`text-[8px] font-black uppercase tracking-wider mt-1.5 px-1.5 rounded-full ${
                        badge.rarity === 'Legendary' ? 'bg-amber-500/10 text-amber-550' :
                        badge.rarity === 'Epic' ? 'bg-violet-500/10 text-violet-550' :
                        badge.rarity === 'Rare' ? 'bg-emerald-500/10 text-emerald-550' :
                        'bg-blue-500/10 text-blue-555'
                      }`}>
                        {badge.rarity}
                      </span>

                      {/* Premium hovering descriptions tooltip */}
                      <div className={`absolute bottom-full mb-2.5 hidden group-hover:block w-40 border rounded-xl p-2.5 text-[10px] font-bold text-center z-30 shadow-2xl pointer-events-none ${
                        isDark ? 'bg-slate-950 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                      }`}>
                        <p className={`font-extrabold leading-tight ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{badge.name}</p>
                        <p className="text-[8px] uppercase tracking-wider text-slate-500 mt-0.5">{badge.rarity} Badge</p>
                        <p className={`mt-1 font-semibold leading-relaxed ${isDark ? 'text-slate-350' : 'text-slate-650'}`}>{badge.desc}</p>
                        {badge.unlocked ? (
                          <p className="text-emerald-555 text-[9px] mt-1.5 font-bold flex items-center justify-center gap-0.5">
                            <Check className="w-3.5 h-3.5" /> Pin Selected
                          </p>
                        ) : (
                          <p className="text-rose-500 text-[9px] mt-1.5 font-bold">Locked</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* DREAM VISION BOARD (PINTEREST STYLE GRID) */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  Dream Vision Board
                </h3>
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Future Plans</span>
              </div>

              {goals.filter(g => g.status !== 'Completed').length === 0 ? (
                <div className={`text-center py-8 border rounded-2xl ${
                  isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-100/50 border-slate-200'
                }`}>
                  <Compass className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>No active goals on your vision board.</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Add active dreams from the dashboard to display here.</p>
                </div>
              ) : (
                <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                  {goals.filter(g => g.status !== 'Completed').map((g) => {
                    const progressRate = g.progress || 0
                    return (
                      <div 
                        key={g.id} 
                        className={`break-inside-avoid rounded-2xl border p-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                          isDark ? 'bg-slate-950/50 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-205 hover:bg-slate-100/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded-full ${
                            isDark 
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' 
                              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          }`}>
                            {g.category}
                          </span>
                          <span className={`text-[9px] font-extrabold ${isDark ? 'text-slate-550' : 'text-slate-500'}`}>
                            {g.priority} Priority
                          </span>
                        </div>
                        <h4 className={`text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{g.title}</h4>
                        <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{g.description || "No description logged yet."}</p>
                        
                        <div className="mt-3">
                          <div className={`flex items-center justify-between text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span>Completeness</span>
                            <span>{progressRate}%</span>
                          </div>
                          <div className={`w-full rounded-full h-1 overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
                            <div className="bg-indigo-550 h-full rounded-full" style={{ width: `${progressRate}%` }} />
                          </div>
                        </div>

                        {g.targetDate && (
                          <div className={`mt-3 pt-2.5 border-t text-[9px] font-bold flex items-center justify-between ${
                            isDark ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-500'
                          }`}>
                            <span>Deadline path</span>
                            <span>{new Date(g.targetDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* DYNAMIC DREAM JOURNEY TIMELINE */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5.5 h-5.5 text-indigo-405" />
                  <h3 className="text-base font-bold font-display">Dream Journey Timeline</h3>
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'goals', label: 'Goals' },
                    { id: 'milestones', label: 'Milestones' },
                    { id: 'notes', label: 'Notes' }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => setTimelineFilter(btn.id as any)}
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                        timelineFilter === btn.id
                          ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-305'
                          : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-355'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative pl-5 space-y-5">
                <div className="absolute left-[7.5px] top-1.5 bottom-1.5 w-[2px] bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-500 opacity-60" />
                
                {filteredActivityLogs.length === 0 ? (
                  <p className={`text-xs italic py-2 ${isDark ? 'text-slate-500' : 'text-slate-605'}`}>No milestone logs recorded matching filter.</p>
                ) : (
                  filteredActivityLogs.map((log) => (
                    <motion.div 
                      key={log.id} 
                      whileHover={{ x: 3 }}
                      className="relative flex items-start gap-3"
                    >
                      <span className="absolute -left-[23.5px] top-0.5 text-xs bg-slate-900 w-5 h-5 rounded-full flex items-center justify-center border border-white/10 shadow-sm shrink-0 text-white">
                        {log.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-normal ${isDark ? 'text-slate-205' : 'text-slate-800'}`}>{log.text}</p>
                        <span className={`text-[9px] mt-0.5 block font-extrabold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                          {getRelativeTime(log.date)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* GOAL COMPLETION HEATMAP (GITHUB STYLE GRID) */}
            <div className={`rounded-3xl border p-6 overflow-x-auto ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4 min-w-[340px]">
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-405" />
                  Goal Completion Heatmap
                </h3>
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>Last 16 Weeks</span>
              </div>

              {/* Grid board */}
              <div className="min-w-[400px]">
                <div className="grid grid-cols-[repeat(16,1fr)] gap-1">
                  {Array.from({ length: 16 }).map((_, colIdx) => (
                    <div key={colIdx} className="grid grid-rows-7 gap-1">
                      {Array.from({ length: 7 }).map((_, rowIdx) => {
                        const cellIdx = colIdx * 7 + rowIdx
                        const data = heatmapData[cellIdx]
                        if (!data) return <div key={rowIdx} className={`aspect-square rounded border ${isDark ? 'bg-slate-950/20 border-white/10' : 'bg-slate-200/30 border-slate-305'}`} />
                        
                        return (
                          <div 
                            key={rowIdx}
                            className={`aspect-square w-full rounded border transition-all duration-300 cursor-pointer ${
                              isDark ? 'border-white/10' : 'border-slate-300/35'
                            } ${
                              data.level === 4 ? 'bg-indigo-500 shadow-glow-indigo border-indigo-400/30' :
                              data.level === 3 ? 'bg-indigo-500/80 border-indigo-500/20' :
                              data.level === 2 ? 'bg-indigo-500/50' :
                              data.level === 1 ? 'bg-indigo-500/25' :
                              `${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200/80 hover:bg-slate-350'}`
                            }`}
                            title={`${data.count} activities logged on ${data.date.toLocaleDateString()}`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>

                <div className={`flex justify-between items-center text-[9px] font-bold mt-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  <span>16 weeks ago</span>
                  <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className={`w-2.5 h-2.5 rounded border ${isDark ? 'bg-slate-800 border-white/5' : 'bg-slate-200 border-slate-300/30'}`} />
                    <div className="w-2.5 h-2.5 rounded bg-indigo-500/20" />
                    <div className="w-2.5 h-2.5 rounded bg-indigo-500/40" />
                    <div className="w-2.5 h-2.5 rounded bg-indigo-500/70" />
                    <div className="w-2.5 h-2.5 rounded bg-indigo-500" />
                    <span>More</span>
                  </div>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* SOCIAL AND FRIEND ACTIVITY */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Social Directory
                </h3>
                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Community ranking: {communityRanking.percentile}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <button
                  type="button"
                  onClick={() => handleOpenListModal('followers')}
                  className={`border rounded-2xl p-3 text-left transition-all ${
                    isDark ? 'bg-slate-950/30 border-white/5 hover:bg-[#0b1329]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 shadow-sm'
                  }`}
                >
                  <span className={`text-xl font-black block ${isDark ? 'text-indigo-400' : 'text-indigo-750'}`}>{followers.length}</span>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>Followers</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenListModal('following')}
                  className={`border rounded-2xl p-3 text-left transition-all ${
                    isDark ? 'bg-slate-950/30 border-white/5 hover:bg-[#0b1329]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 shadow-sm'
                  }`}
                >
                  <span className={`text-xl font-black block ${isDark ? 'text-indigo-400' : 'text-indigo-750'}`}>{followingList.length}</span>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>Following</span>
                </button>

                <div className={`border rounded-2xl p-3 text-left ${
                  isDark ? 'bg-slate-950/30 border-white/5' : 'bg-slate-50 border-slate-205 shadow-sm'
                }`}>
                  <span className={`text-xs font-black block truncate ${isDark ? 'text-cyan-400' : 'text-cyan-705'}`}>{communityRanking.status}</span>
                  <span className={`text-[10px] font-bold block mt-1 ${isDark ? 'text-slate-400' : 'text-slate-555'}`}>Tier</span>
                </div>
              </div>

              {/* Followers previews */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mutual Followers:</span>
                <div className="flex items-center -space-x-2.5 overflow-hidden">
                  {followers.slice(0, 5).map((f) => (
                    <div 
                      key={f.id} 
                      className={`w-8 h-8 rounded-full border-2 bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-[10px] font-black text-white ${
                        isDark ? 'border-slate-950' : 'border-white'
                      }`}
                      title={f.name}
                    >
                      {f.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2)}
                    </div>
                  ))}
                  {followers.length > 5 && (
                    <div className={`w-8 h-8 rounded-full border-2 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-350 ${
                      isDark ? 'border-slate-950' : 'border-white'
                    }`}>
                      +{followers.length - 5}
                    </div>
                  )}
                </div>
                {followers.length === 0 && (
                  <span className={`text-[10px] italic ${isDark ? 'text-slate-550' : 'text-slate-500'}`}>No community linkups yet.</span>
                )}
              </div>
            </div>

            {/* MONTHLY RECAP WIDGET */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <h3 className="text-base font-bold font-display flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-indigo-400" />
                Monthly Recap ({monthlyRecap.monthName})
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`border rounded-2xl p-4 text-center ${
                  isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <CheckCircle className="w-6 h-6 text-emerald-505 mx-auto mb-1.5" />
                  <span className={`text-lg font-black block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{monthlyRecap.completedThisMonth}</span>
                  <span className={`text-[10px] font-bold block mt-0.5 ${isDark ? 'text-slate-450' : 'text-slate-550'}`}>Dreams Completed</span>
                </div>
                
                <div className={`border rounded-2xl p-4 text-center ${
                  isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'
                }`}>
                  <Bookmark className="w-6 h-6 text-indigo-555 mx-auto mb-1.5" />
                  <span className={`text-lg font-black block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{monthlyRecap.milestonesThisMonth}</span>
                  <span className={`text-[10px] font-bold block mt-0.5 ${isDark ? 'text-slate-455' : 'text-slate-550'}`}>Milestones Completed</span>
                </div>
              </div>
            </div>

            {/* DREAM COLLECTION (COMPLETED COLLECTIBLE CARDS) */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-450" />
                  Completed Dream Collectibles
                </h3>
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stats.completedGoals} Collectibles</span>
              </div>

              {goals.filter(g => g.status === 'Completed').length === 0 ? (
                <div className={`text-center py-8 border rounded-2xl ${
                  isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-100/50 border-slate-200'
                }`}>
                  <Trophy className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className={`text-xs ${isDark ? 'text-slate-450' : 'text-slate-655'}`}>No collectible dreams collected yet.</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Finish dreams in your list to log them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {goals.filter(g => g.status === 'Completed').map((g) => (
                    <motion.div 
                      key={g.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative rounded-2xl border p-4 overflow-hidden group shadow-lg ${
                        isDark 
                          ? 'bg-gradient-to-br from-indigo-950/30 to-slate-900/30 border-white/5 hover:border-yellow-500/20' 
                          : 'bg-gradient-to-br from-indigo-50/50 to-slate-100/50 border-slate-200 hover:border-indigo-405'
                      }`}
                    >
                      {/* Holographic Shimmer Effect */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-indigo-500/5 via-violet-500/5 to-cyan-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                            isDark ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' : 'text-amber-800 bg-amber-50 border border-amber-200'
                          }`}>
                            <Star className="w-2.5 h-2.5 fill-current" /> Collectible
                          </span>
                          <span className={`text-[9px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {g.category}
                          </span>
                        </div>
                        <h4 className={`text-sm font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{g.title}</h4>
                        <p className={`text-[10px] mt-1 italic ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>"Completed successfully"</p>
                        
                        <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[9px] font-bold ${
                          isDark ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-500'
                        }`}>
                          <span>Unlocked date</span>
                          <span>{g.updatedAt ? new Date(g.updatedAt).toLocaleDateString() : 'Success'}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* COMMUNITY EXPLORE FEED / ACTIVITY */}
            <div className={`rounded-3xl border p-6 ${
              isDark ? 'bg-slate-900/40 border-white/5 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-md'
            }`}>
              <div className="flex items-center gap-2 mb-6">
                <Share2 className="w-5.5 h-5.5 text-indigo-400" />
                <h3 className="text-lg font-bold font-display">Shared Community Feed</h3>
              </div>

              {activityPosts.length > 0 ? (
                <div className="space-y-4">
                  {activityPosts.map((post) => (
                    <div key={post.id} className={`rounded-2xl border p-5 transition-all ${
                      isDark 
                        ? 'bg-slate-950/60 border-white/5 hover:border-indigo-500/20' 
                        : 'bg-slate-100/50 border-slate-250 hover:border-indigo-300 shadow-sm'
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
                          <p className={`text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-855'}`}>{post.author}</p>
                        </div>
                        <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          {formatPostDate(post.date)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-350' : 'text-slate-700'}`}>{post.text}</p>
                      
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className={`rounded-full border px-2.5 py-0.5 ${
                          isDark 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-emerald-55 text-emerald-750 border-emerald-200'
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
                <div className={`text-center py-8 border rounded-2xl ${
                  isDark ? 'bg-slate-950/20 border-white/5' : 'bg-slate-100/50 border-slate-200'
                }`}>
                  <Share2 className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className={`text-xs ${isDark ? 'text-slate-450' : 'text-slate-655'}`}>No shared posts yet.</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Write experiences on Explore board to show them here.</p>
                </div>
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
                <p className="text-center text-slate-405 animate-pulse text-xs">Retrieving database files...</p>
              ) : modalUsersList.length === 0 ? (
                <p className="text-center text-slate-450 text-xs">No active users cataloged.</p>
              ) : (
                modalUsersList.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => {
                      setShowModal(null)
                      router.push(`/dashboard/profile/${usr.id}`)
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${isDark ? 'bg-slate-900/60 border-white/5 hover:bg-slate-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100/60'}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                        {usr.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-extrabold truncate text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{usr.name}</p>
                        <p className={`text-[10px] truncate ${isDark ? 'text-slate-450' : 'text-slate-500'}`}>{usr.email}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {usr.id !== user.id && (() => {
                        const isFollowingUsr = followingList.some((f) => f.id === usr.id)
                        return (
                          <button
                            type="button"
                            onClick={() => handleFollowToggleInModal(usr.id, isFollowingUsr)}
                            className={`px-3.5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider transition-all ${
                              isFollowingUsr 
                                ? (isDark ? 'bg-slate-800 text-slate-350 hover:bg-slate-700' : 'bg-gray-255 text-gray-700 hover:bg-gray-300') 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                            }`}
                          >
                            {isFollowingUsr ? 'Following' : 'Follow'}
                          </button>
                        )
                      })()}
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

// Preset Quotes Collection
const motivationalQuotes = [
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
  { text: "Write down your dreams, make plans, take action.", author: "Goal Builder" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "A dream doesn't become reality through magic; it takes sweat, determination, and hard work.", author: "Colin Powell" },
  { text: "Consistency is what transforms average into excellence.", author: "Success Principles" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "If you can dream it, you can do it.", author: "Walt Disney" }
]
