'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, Settings, LogOut, User, Search, Filter, ChevronDown, Check, Trash2, 
  Info, CalendarDays, DollarSign, MapPin, Target, Clock, TrendingUp, 
  MessageSquare, Flame, Sparkles, Award, Play, CheckCircle, Calendar, 
  ChevronLeft, ChevronRight, ArrowRight, ArrowUpRight, Compass, ShieldAlert, Layers, 
  PlusCircle, BookOpen, Activity, Lock, Eye, Bell, Globe, Sun, Moon
} from 'lucide-react'
import { useTheme } from '../theme-provider'
import StoriesBar from '../../components/StoriesBar'
import ExploreFeed from '../../components/ExploreFeed'
import { motion, AnimatePresence } from 'framer-motion'

const INSPIRATIONAL_QUOTES = [
  { quote: "Every great adventure starts with a single goal.", author: "Anonymous" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Do not wait for opportunities, create them.", author: "Roy T. Bennett" },
  { quote: "Write down your dreams, make plans, take action.", author: "Goal Builder" },
  { quote: "Consistency is what transforms average into excellence.", author: "Success Principles" }
];

const formatRealTime = (dateVal: any) => {
  if (!dateVal) return ''
  const date = new Date(dateVal)
  if (isNaN(date.getTime())) {
    return String(dateVal)
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function DashboardPostCarousel({ imageSource }: { imageSource: string }) {
  const [activeIndex, setActiveIndex] = useState(0)

  let images: string[] = []
  if (imageSource) {
    if (imageSource.startsWith('[')) {
      try {
        images = JSON.parse(imageSource)
      } catch (e) {
        images = [imageSource]
      }
    } else {
      images = [imageSource]
    }
  }

  if (images.length === 0) return null

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="relative h-32 w-full sm:w-48 overflow-hidden rounded-2xl shadow-md shrink-0 group bg-slate-950/35 flex items-center justify-center">
      <img 
        src={images[activeIndex]} 
        className="w-full h-full object-cover" 
        alt={`Post visual ${activeIndex + 1}`} 
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition duration-300 z-10 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition duration-300 z-10 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/30 px-2 py-0.5 rounded-full">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1 h-1 rounded-full transition-all ${
                  idx === activeIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  
  // Dashboard Core States
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [filteredGoals, setFilteredGoals] = useState<any[]>([])
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [openInfoId, setOpenInfoId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'goals' | 'posts' | 'community'>('goals')
  const [milestoneInputs, setMilestoneInputs] = useState<Record<string, string>>({})
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  // New Feature States
  const [streak, setStreak] = useState(7)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [monthlyTarget, setMonthlyTarget] = useState(2) // Target goals to complete this month
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'category' | 'trends'>('category')
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false) // Trigger or route indicator
  const [similarAchievements, setSimilarAchievements] = useState<any[]>([])

  const CATEGORIES = ['All', 'Travel', 'Skills', 'Health', 'Adventure', 'Personal']

  // Auth and Data Fetching
  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!userData || !token) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/auth/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (!parsedUser || !parsedUser.id) {
        throw new Error('Invalid user data')
      }
      setUser(parsedUser)
      fetchGoals(token)
      fetchSimilarAchievements(token)
    } catch (error) {
      console.error('Failed to load user from localStorage:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setIsLoading(false)
      router.push('/auth/login')
    }
  }, [])

  // Sync tab search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'community') {
        setActiveTab('community')
      } else if (tab === 'posts') {
        setActiveTab('posts')
      } else if (tab === 'goals') {
        setActiveTab('goals')
      }
    }
  }, [])

  // Fetch user specific posts from database
  const fetchMyPosts = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/posts')
      if (res.ok) {
        const data = await res.json()
        const dbPosts = data.posts || []
        const userSpecific = dbPosts.filter((post: any) => {
          return post.user?.email === user.email || post.userId === user.id
        })
        const mapped = userSpecific.map((p: any) => ({
          id: p.id,
          author: p.user?.name || user.name,
          authorEmail: p.user?.email || user.email,
          text: p.text,
          image: p.image || undefined,
          date: p.createdAt,
          likes: p.likes?.length || 0,
          comments: p.comments || []
        }))
        setMyPosts(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch my posts:', err)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok || res.status === 404) {
        setMyPosts(prev => prev.filter(p => p.id !== postId))
      } else {
        alert('Failed to delete post.')
      }
    } catch (err) {
      console.error('Error deleting post:', err)
      alert('Error deleting post.')
    }
  }

  // Fetch my posts when user loads or tab changes to posts
  useEffect(() => {
    if (user && activeTab === 'posts') {
      fetchMyPosts()
    }
  }, [user, activeTab])

  // Load/save streak counter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mybuko-streak')
      if (saved) {
        setStreak(parseInt(saved, 10))
      } else {
        localStorage.setItem('mybuko-streak', '7')
      }
      setQuoteIdx(new Date().getDate() % INSPIRATIONAL_QUOTES.length)
    }
  }, [])

  const fetchGoals = async (token: string) => {
    try {
      const res = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        let merged = data
        try {
          const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
          if (joinedRaw) {
            const joined = JSON.parse(joinedRaw) as any[]
            const storedUser = window.localStorage.getItem('user')
            const parsedUser = storedUser ? JSON.parse(storedUser) : null
            const userJoined = joined.filter(j => j.ownerEmail === parsedUser?.email || j.ownerName === parsedUser?.name)
            const unique = userJoined.filter(j => !data.some((d: any) => String(d.id) === String(j.id) || d.title === j.title))
            merged = [...data, ...unique]
          }
        } catch {
          // ignore localStorage parsing exceptions
        }
        setGoals(merged)
        setFilteredGoals(merged)
      } else if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSimilarAchievements = async (token: string) => {
    try {
      const res = await fetch('/api/goals/explore?filter=trending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSimilarAchievements(data)
      }
    } catch (err) {
      console.error('Error fetching similar achievements:', err)
    }
  }

  // Filter and search logic
  useEffect(() => {
    let filtered = goals
    if (filterCategory !== 'All') {
      filtered = filtered.filter(goal => goal.category === filterCategory)
    }
    if (searchTerm) {
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (goal.location && goal.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    setFilteredGoals(filtered)
  }, [filterCategory, searchTerm, goals])

  const filteredMyPosts = searchTerm
    ? myPosts.filter(post => 
        post.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : myPosts

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/')
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const progress = newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 50 : 0

      if (String(id).startsWith('local-')) {
        try {
          const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
          if (joinedRaw) {
            const joined = JSON.parse(joinedRaw) as any[]
            const updated = joined.map(g => {
              if (String(g.id) === String(id)) {
                return { ...g, status: newStatus, progress }
              }
              return g
            })
            window.localStorage.setItem('mybuko-joined-goals', JSON.stringify(updated))
            setGoals(prevGoals => prevGoals.map(goal => goal.id === id ? { ...goal, status: newStatus, progress } : goal))
          }
        } catch (err) {
          console.error('Failed to update local goal status:', err)
        }
        return
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, progress }),
      })

      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth/login')
        return
      }

      if (!res.ok) return

      const updatedGoal = await res.json()
      setGoals(prevGoals => prevGoals.map(goal => goal.id === id ? updatedGoal : goal))
    } catch (error) {
      console.error('Error updating goal status:', error)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      if (String(id).startsWith('local-')) {
        try {
          const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
          if (joinedRaw) {
            const joined = JSON.parse(joinedRaw) as any[]
            const filtered = joined.filter(g => String(g.id) !== String(id))
            window.localStorage.setItem('mybuko-joined-goals', JSON.stringify(filtered))
            setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id))
          }
        } catch (err) {
          console.error('Failed to delete local goal:', err)
        }
        return
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id))
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const toggleMilestone = async (goalId: string, milestoneId: string, completed: boolean) => {
    if (String(goalId).startsWith('local-')) {
      try {
        const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
        if (joinedRaw) {
          const joined = JSON.parse(joinedRaw) as any[]
          const updated = joined.map(g => {
            if (String(g.id) === String(goalId)) {
              const milestones = (g.milestones || []).map((m: any) => {
                if (String(m.id) === String(milestoneId)) {
                  return { ...m, completed: !completed }
                }
                return m
              })
              return { ...g, milestones }
            }
            return g
          })
          window.localStorage.setItem('mybuko-joined-goals', JSON.stringify(updated))
          setGoals(prev => prev.map(g => String(g.id) === String(goalId) ? { ...g, milestones: (g.milestones || []).map((m: any) => String(m.id) === String(milestoneId) ? { ...m, completed: !completed } : m) } : g))
        }
      } catch (err) {
        console.error('Error toggling local milestone:', err)
      }
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !completed })
      })
      if (res.ok) {
        const updatedMilestone = await res.json()
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              milestones: (g.milestones || []).map((m: any) => m.id === milestoneId ? updatedMilestone : m)
            }
          }
          return g
        }))
      }
    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

  const addMilestone = async (goalId: string, title: string) => {
    if (!title.trim()) return

    if (String(goalId).startsWith('local-')) {
      try {
        const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
        if (joinedRaw) {
          const joined = JSON.parse(joinedRaw) as any[]
          const newM = {
            id: `milestone-${Date.now()}`,
            title: title.trim(),
            completed: false,
            createdAt: new Date().toISOString()
          }
          const updated = joined.map(g => {
            if (String(g.id) === String(goalId)) {
              return { ...g, milestones: [...(g.milestones || []), newM] }
            }
            return g
          })
          window.localStorage.setItem('mybuko-joined-goals', JSON.stringify(updated))
          setGoals(prev => prev.map(g => String(g.id) === String(goalId) ? { ...g, milestones: [...(g.milestones || []), newM] } : g))
        }
      } catch (err) {
        console.error('Error adding local milestone:', err)
      }
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${goalId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      })

      if (res.ok) {
        const newM = await res.json()
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              milestones: [...(g.milestones || []), newM]
            }
          }
          return g
        }))
      }
    } catch (error) {
      console.error('Error adding milestone:', error)
    }
  }

  const deleteMilestone = async (goalId: string, milestoneId: string) => {
    if (String(goalId).startsWith('local-')) {
      try {
        const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
        if (joinedRaw) {
          const joined = JSON.parse(joinedRaw) as any[]
          const updated = joined.map(g => {
            if (String(g.id) === String(goalId)) {
              const milestones = (g.milestones || []).filter((m: any) => String(m.id) !== String(milestoneId))
              return { ...g, milestones }
            }
            return g
          })
          window.localStorage.setItem('mybuko-joined-goals', JSON.stringify(updated))
          setGoals(prev => prev.map(g => String(g.id) === String(goalId) ? { ...g, milestones: (g.milestones || []).filter((m: any) => String(m.id) !== String(milestoneId)) } : g))
        }
      } catch (err) {
        console.error('Error deleting local milestone:', err)
      }
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              milestones: (g.milestones || []).filter((m: any) => m.id !== milestoneId)
            }
          }
          return g
        }))
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
    }
  }

  const addNote = async (goalId: string, content: string) => {
    if (!content.trim()) return

    if (String(goalId).startsWith('local-')) {
      try {
        const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
        if (joinedRaw) {
          const joined = JSON.parse(joinedRaw) as any[]
          const newN = {
            id: `note-${Date.now()}`,
            content: content.trim(),
            createdAt: new Date().toISOString()
          }
          const updated = joined.map(g => {
            if (String(g.id) === String(goalId)) {
              return { ...g, notes: [newN, ...(g.notes || [])] }
            }
            return g
          })
          window.localStorage.setItem('mybuko-joined-goals', JSON.stringify(updated))
          setGoals(prev => prev.map(g => String(g.id) === String(goalId) ? { ...g, notes: [newN, ...(g.notes || [])] } : g))
        }
      } catch (err) {
        console.error('Error adding local note:', err)
      }
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${goalId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      })

      if (res.ok) {
        const newN = await res.json()
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              notes: [newN, ...(g.notes || [])]
            }
          }
          return g
        }))
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const deleteNote = async (goalId: string, noteId: string) => {
    if (String(goalId).startsWith('local-')) {
      try {
        const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
        if (joinedRaw) {
          const joined = JSON.parse(joinedRaw) as any[]
          const updated = joined.map(g => {
            if (String(g.id) === String(goalId)) {
              const notes = (g.notes || []).filter((n: any) => String(n.id) !== String(noteId))
              return { ...g, notes }
            }
            return g
          })
          window.localStorage.setItem('mybuko-joined-goals', JSON.stringify(updated))
          setGoals(prev => prev.map(g => String(g.id) === String(goalId) ? { ...g, notes: (g.notes || []).filter((n: any) => String(n.id) !== String(noteId)) } : g))
        }
      } catch (err) {
        console.error('Error deleting local note:', err)
      }
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${goalId}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              notes: (g.notes || []).filter((n: any) => n.id !== noteId)
            }
          }
          return g
        }))
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  // Time-based dynamic greeting according to IST
  const getGreeting = () => {
    const options = { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false } as const
    const formatter = new Intl.DateTimeFormat('en-US', options)
    const hr = parseInt(formatter.format(new Date()), 10)
    if (hr < 12) return 'Good Morning'
    if (hr < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Dynamic Metrics & Stats Computations
  const completedCount = goals.filter(g => g.status === 'Completed').length
  const completionRate = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0
  const activeCount = goals.length - completedCount
  const categoryCounts = CATEGORIES.reduce((acc, category) => {
    acc[category] = goals.filter(goal => goal.category === category).length
    return acc
  }, {} as Record<string, number>)

  // Additional dynamic features calculations
  const totalMilestones = goals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0)
  const completedMilestones = goals.reduce((acc, g) => acc + (g.milestones?.filter((m: any) => m.completed).length || 0), 0)
  const totalNotes = goals.reduce((acc, g) => acc + (g.notes?.length || 0), 0)

  // Dream Score: Consistency (Streak * 3) + Progress (Completion % * 0.4) + Activity (milestones % * 0.3)
  const milestoneCompletionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
  const dreamScore = (() => {
    if (goals.length === 0) return 0
    const raw = (streak * 3) + (completionRate * 0.4) + (milestoneCompletionRate * 0.3) + (totalNotes * 1.5)
    return Math.min(100, Math.max(10, Math.round(raw)))
  })()

  // Achievement Badges dynamically calculated
  const hasExplorer = goals.some(g => g.category === 'Travel' || g.category === 'Adventure')
  const hasAdventurer = goals.some(g => g.category === 'Adventure' && g.status === 'Completed')
  const hasPlanner = totalMilestones >= 5
  const hasDreamChaser = completedCount >= 2
  const hasGoalMaster = completedCount >= 5

  const achievements = [
    { id: 'explorer', name: 'Explorer', icon: '🧭', unlocked: hasExplorer, desc: 'Added Travel or Adventure dream' },
    { id: 'adventurer', name: 'Adventurer', icon: '🧗', unlocked: hasAdventurer, desc: 'Completed an Adventure goal' },
    { id: 'planner', name: 'Planner', icon: '📝', unlocked: hasPlanner, desc: 'Created 5+ milestones' },
    { id: 'dream_chaser', name: 'Dream Chaser', icon: '✨', unlocked: hasDreamChaser, desc: 'Completed 2+ goals' },
    { id: 'goal_master', name: 'Goal Master', icon: '🏆', unlocked: hasGoalMaster, desc: 'Completed 5+ goals' }
  ]

  // Upcoming deadlines (Top 3 goals sorted by target date)
  const upcomingDeadlines = goals
    .filter(g => g.status !== 'Completed' && g.targetDate)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 3)

  // Budget summaries
  const totalPlannedBudget = goals.reduce((sum, g) => sum + (g.budget != null ? Number(g.budget) : 0), 0)
  const spentBudget = goals.filter(g => g.status === 'Completed').reduce((sum, g) => sum + (g.budget != null ? Number(g.budget) : 0), 0)
  const remainingBudget = totalPlannedBudget - spentBudget

  // Dynamic Recent Activity Timeline logs
  const activityLogs = (() => {
    const logs: any[] = []
    goals.forEach(g => {
      if (g.createdAt) {
        logs.push({
          id: `create-${g.id}`,
          text: `Logged a new dream: "${g.title}"`,
          date: new Date(g.createdAt),
          icon: '🎯'
        })
      }
      (g.notes || []).forEach((n: any) => {
        logs.push({
          id: `note-${n.id}`,
          text: `Added a note to "${g.title}"`,
          date: new Date(n.createdAt || g.createdAt),
          icon: '📝'
        })
      });
      (g.milestones || []).forEach((m: any) => {
        if (m.completed) {
          logs.push({
            id: `milestone-${m.id}`,
            text: `Achieved milestone: "${m.title}" in "${g.title}"`,
            date: new Date(m.createdAt || g.createdAt),
            icon: '✅'
          })
        }
      })
    })
    return logs
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
  })()

  // SVG Charts computation
  // Category donut chart ratios
  const activeCategories = CATEGORIES.slice(1) // exclude 'All'
  const totalCats = activeCategories.reduce((sum, c) => sum + (categoryCounts[c] || 0), 0)
  let accumulatedPercent = 0
  const donutSegments = activeCategories.map((cat, idx) => {
    const count = categoryCounts[cat] || 0
    const percent = totalCats > 0 ? count / totalCats : 0
    const strokeLength = 251.3 * percent
    const strokeOffset = 251.3 * accumulatedPercent
    accumulatedPercent += percent

    const segmentColors = ['stroke-cyan-400', 'stroke-violet-500', 'stroke-purple-500', 'stroke-indigo-500', 'stroke-pink-500']
    const bgColors = ['bg-cyan-400', 'bg-violet-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500']
    const textColors = ['text-cyan-400', 'text-violet-400', 'text-purple-400', 'text-indigo-400', 'text-pink-400']

    return {
      cat,
      count,
      percent: Math.round(percent * 100),
      strokeDash: `${strokeLength} 251.3`,
      strokeOffset: -strokeOffset,
      colorClass: segmentColors[idx % segmentColors.length],
      bgClass: bgColors[idx % bgColors.length],
      textClass: textColors[idx % textColors.length]
    }
  })

  // Completion trends line coordinates (300px x 100px SVG space)
  const trendPoints = (() => {
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const completedGoalsList = goals.filter(g => g.status === 'Completed')

    const getCountBefore = (daysAgo: number) => {
      const cutoff = now - (daysAgo * day)
      return completedGoalsList.filter(g => {
        const d = g.updatedAt ? new Date(g.updatedAt).getTime() : now
        return d < cutoff
      }).length
    }

    const d1 = getCountBefore(60)
    const d2 = getCountBefore(30)
    const d3 = getCountBefore(14)
    const d4 = getCountBefore(7)
    const d5 = completedGoalsList.length

    const data = [d1, d2, d3, d4, d5]
    const maxVal = Math.max(...data, 4)

    const coords = data.map((val, i) => {
      const x = (i * 300) / 4
      const y = 90 - ((val * 70) / maxVal)
      return { x, y }
    })

    const pathLine = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
    const pathArea = `${pathLine} L 300 100 L 0 100 Z`

    return { coords, pathLine, pathArea }
  })()

  // Similar goals dynamically compiled from explore database route
  const displayAchievements = similarAchievements.length > 0
    ? similarAchievements
        .filter(g => !user || g.user?.email !== user.email)
        .slice(0, 3)
        .map(g => {
          const name = g.user?.name || 'Dreamer'
          const avatar = name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()
          const goalTitle = g.title
          const badge = g.category === 'Travel' ? 'Explorer' 
                      : g.category === 'Adventure' ? 'Adventurer' 
                      : g.category === 'Skills' ? 'Creator' 
                      : 'Planner'
          const isCompleted = g.progress === 100
          return { name, avatar, goal: goalTitle, badge, isCompleted }
        })
    : [
        { name: "Rahul Sharma", avatar: "RS", goal: "Skydiving in Dubai", badge: "Adventurer", isCompleted: true },
        { name: "Sneha Kapoor", avatar: "SK", goal: "Learn Pottery Crafting", badge: "Creator", isCompleted: true },
        { name: "Amit Patel", avatar: "AP", goal: "Trek Assam Tea Gardens", badge: "Explorer", isCompleted: true }
      ]

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030712] text-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-slate-400 font-semibold">Authorizing command center...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-950'}`}>
      
      {/* Noise Texture Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-[0.02] ${isDark ? 'bg-[radial-gradient(#ffffff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000000_1px,transparent_1px)]'} [background-size:16px_16px] z-10`} />

      {/* Atmospheric Background & Pulsing Aurora Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/5'} rounded-full blur-[140px] animate-pulse`} style={{ animationDuration: '9s' }} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-violet-600/10' : 'bg-violet-400/5'} rounded-full blur-[140px] animate-pulse`} style={{ animationDuration: '13s' }} />
        <div className={`absolute top-[35%] right-[15%] w-[40%] h-[40%] ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-400/5'} rounded-full blur-[110px] animate-pulse`} style={{ animationDuration: '11s' }} />
      </div>

      {/* NAVBAR */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${isDark ? 'border-white/5 bg-[#030712]/75' : 'border-slate-250 bg-white/75'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-white via-slate-100 to-slate-400' : 'from-slate-950 via-slate-800 to-slate-600'}`}>MYBUKO</span>
            </Link>

            {/* Quick Actions Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <div className="relative w-full">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search goals, locations, categories..."
                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-slate-100 placeholder-slate-400' 
                      : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-550'
                  }`}
                />
              </div>

              {/* Suggestions Dropdown */}
              {searchTerm.trim() !== '' && (
                <div className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border p-2 shadow-2xl z-50 backdrop-blur-xl ${
                  isDark 
                    ? 'bg-slate-900/90 border-white/10 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
                    : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.1)]'
                }`}>
                  <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-hide">
                    {goals.filter(goal => 
                      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 text-center">No goals match search query</p>
                    ) : (
                      goals.filter(goal => 
                        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).map(goal => (
                        <button
                          key={goal.id}
                          onClick={() => {
                            setSearchTerm('')
                            setActiveTab('goals')
                            setFilterCategory('All')
                            setOpenInfoId(goal.id)
                            setTimeout(() => {
                              const el = document.getElementById(`goal-${goal.id}`)
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              }
                            }, 150)
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            isDark ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-105 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">{goal.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{goal.category} • {goal.status}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown with level stats */}
            <div className="flex items-center gap-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                    isDark 
                      ? 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-200' 
                      : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow font-bold text-white text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold">{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-3.5 w-64 rounded-2xl border shadow-2xl p-4 space-y-3.5 z-50 backdrop-blur-2xl ${
                        isDark 
                          ? 'border-white/10 bg-slate-900/95 text-slate-200' 
                          : 'border-slate-250 bg-white text-slate-850'
                      }`}
                    >
                      <div className={`border-b pb-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user.name}</p>
                        <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[10px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold uppercase px-2 py-0.5 rounded-md">Level {Math.floor(completedCount / 3) + 1}</span>
                          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{completedCount} goals complete</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setShowDropdown(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition ${
                            isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <User className="w-4.5 h-4.5 text-indigo-400" />
                          My Profile & Achievements
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setShowDropdown(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition ${
                            isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Settings className="w-4.5 h-4.5 text-violet-400" />
                          Command Settings
                        </Link>
                        <Link
                          href="/dashboard/chats"
                          onClick={() => setShowDropdown(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition ${
                            isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <MessageSquare className="w-4.5 h-4.5 text-cyan-400" />
                          Direct Chats
                        </Link>
                      </div>

                      <button
                        onClick={() => {
                          setShowDropdown(false)
                          handleLogout()
                        }}
                        className={`w-full text-left px-3 py-2 border-t rounded-xl transition flex items-center gap-2.5 text-sm ${
                          isDark 
                            ? 'border-white/5 text-rose-400 hover:bg-rose-500/10' 
                            : 'border-slate-100 text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <LogOut className="w-4.5 h-4.5" />
                        Disconnect Session
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* PREMIUM WELCOME HERO SECTION */}
        <section className={`relative rounded-[36px] overflow-hidden border p-8 lg:p-10 shadow-2xl transition-all duration-300 ${isDark ? 'border-white/10 bg-slate-900/40 backdrop-blur-2xl' : 'border-slate-200 bg-white'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
          
          <div className="grid lg:grid-cols-[2fr,1.1fr] gap-8 items-center">
            
            {/* User Greeting & Stats summary */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-bold transition-colors duration-300 ${
                  isDark ? 'bg-white/5 border-white/10 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-650'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
                  Life Command Center Active
                </div>
                <h1 className={`text-4xl lg:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 ${
                  isDark ? 'from-white via-slate-100 to-slate-300' : 'from-slate-950 via-slate-800 to-slate-650'
                }`}>
                  {getGreeting()}, {user.name.split(' ')[0]}
                </h1>
              </div>

              {/* Inspiration Quote Widget */}
              <div className={`p-4 rounded-2xl border backdrop-blur-md max-w-xl transition-colors duration-300 ${
                isDark ? 'border-white/5 bg-white/5 text-slate-300' : 'border-slate-150 bg-slate-50 text-slate-700'
              }`}>
                <p className="text-sm italic">"{INSPIRATIONAL_QUOTES[quoteIdx].quote}"</p>
                <p className="text-[10px] text-indigo-500 mt-1 font-bold uppercase tracking-wider">— {INSPIRATIONAL_QUOTES[quoteIdx].author}</p>
              </div>

              {/* Progress Summary Widgets Row */}
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <div className={`text-center p-3 rounded-2xl border transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100/40 border-slate-200/50'}`}>
                  <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1 animate-pulse" />
                  <p className="text-xl font-bold">{streak} Days</p>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Streak</p>
                </div>
                <div className={`text-center p-3 rounded-2xl border transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100/40 border-slate-200/50'}`}>
                  <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{completedCount}</p>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Completed</p>
                </div>
                <div className={`text-center p-3 rounded-2xl border transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100/40 border-slate-200/50'}`}>
                  <Target className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                  <p className="text-xl font-bold">{activeCount}</p>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active</p>
                </div>
              </div>
            </div>

            {/* Circular Progress Rings and Dream Score Gauge */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-8 border rounded-3xl p-6 backdrop-blur-md transition-colors duration-300 ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-200/60'
            }`}>
              
              {/* Dream Score Gauge */}
              <div className="text-center space-y-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="38" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="8" fill="transparent" />
                    <motion.circle 
                      cx="48" 
                      cy="48" 
                      r="38" 
                      className="stroke-violet-500" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="238.7"
                      initial={{ strokeDashoffset: 238.7 }}
                      animate={{ strokeDashoffset: 238.7 - (238.7 * dreamScore) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{dreamScore}</span>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Dream Score</p>
                  <p className={`text-[9px] max-w-[120px] mx-auto mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Calculated from activity & consistency</p>
                </div>
              </div>

              {/* Completion Rate Ring */}
              <div className="text-center space-y-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="38" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="8" fill="transparent" />
                    <motion.circle 
                      cx="48" 
                      cy="48" 
                      r="38" 
                      className="stroke-cyan-400" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="238.7"
                      initial={{ strokeDashoffset: 238.7 }}
                      animate={{ strokeDashoffset: 238.7 - (238.7 * completionRate) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{completionRate}%</span>
                  </div>
                </div>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Completion Rate</p>
                  <p className={`text-[9px] max-w-[120px] mx-auto mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total completed dreams ratio</p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* STATS SECTION */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className={`rounded-3xl border p-6 space-y-4 transition-all duration-300 group shadow-lg ${
            isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl hover:border-white/10' : 'border-slate-200 bg-white hover:border-slate-350'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Goals</span>
              <div className={`p-2 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><Target className="w-4.5 h-4.5" /></div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{goals.length}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-650'}`}>Grand Total</span>
            </div>
            <div className="w-full h-8 pt-2">
              <svg className="w-full h-full" viewBox="0 0 100 20">
                <path d="M 0 18 Q 20 5, 40 12 T 80 8 T 100 2" fill="none" className={isDark ? 'stroke-indigo-400' : 'stroke-indigo-600'} strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div className={`rounded-3xl border p-6 space-y-4 transition-all duration-300 group shadow-lg ${
            isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl hover:border-white/10' : 'border-slate-200 bg-white hover:border-slate-350'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Completed Dreams</span>
              <div className={`p-2 rounded-2xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle className="w-4.5 h-4.5" /></div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{completedCount}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-650'}`}>Reached</span>
            </div>
            <div className="w-full h-8 pt-2">
              <svg className="w-full h-full" viewBox="0 0 100 20">
                <path d="M 0 18 L 25 14 L 50 15 L 75 10 L 100 5" fill="none" className={isDark ? 'stroke-emerald-400' : 'stroke-emerald-600'} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className={`rounded-3xl border p-6 space-y-4 transition-all duration-300 group shadow-lg ${
            isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl hover:border-white/10' : 'border-slate-200 bg-white hover:border-slate-350'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Planner</span>
              <div className={`p-2 rounded-2xl ${isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}><Clock className="w-4.5 h-4.5" /></div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{activeCount}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-550 text-orange-650'}`}>Pending</span>
            </div>
            <div className="w-full h-8 pt-2">
              <svg className="w-full h-full" viewBox="0 0 100 20">
                <path d="M 0 10 C 20 20, 40 2, 60 18 C 80 15, 90 8, 100 12" fill="none" className={isDark ? 'stroke-orange-400' : 'stroke-orange-600'} strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          <div className={`rounded-3xl border p-6 space-y-4 transition-all duration-300 group shadow-lg ${
            isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl hover:border-white/10' : 'border-slate-200 bg-white hover:border-slate-350'
          }`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Consistency Score</span>
              <div className={`p-2 rounded-2xl ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}><TrendingUp className="w-4.5 h-4.5" /></div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className={`text-3xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{completionRate}%</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-650'}`}>Efficiency</span>
            </div>
            <div className="w-full h-8 pt-2">
              <svg className="w-full h-full" viewBox="0 0 100 20">
                <path d="M 0 18 C 15 15, 30 14, 45 10 C 60 7, 75 8, 100 2" fill="none" className={isDark ? 'stroke-purple-400' : 'stroke-purple-600'} strokeWidth="1.5" />
              </svg>
            </div>
          </div>

        </section>

        {/* CENTRAL SYSTEM WORKSPACE */}
        <section className={`transition-all duration-300 ${
          activeTab === 'goals' ? 'grid lg:grid-cols-[2fr,1fr] gap-8' : 'max-w-4xl mx-auto space-y-6'
        }`}>
          
          {/* LEFT/MAIN COLUMN: ACTIVE WORKSPACE TAB CARDS */}
          <div className="space-y-6">
            
            {/* Filter, Search & Tab switches */}
            <div className={`rounded-2xl border p-4 flex flex-wrap gap-4 items-center justify-between backdrop-blur-xl transition-all duration-300 ${
              isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white shadow-sm'
            }`}>
              <div className="flex gap-2">
                {(['goals', 'posts', 'community'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : isDark
                          ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'goals' ? 'Dreams' : tab === 'posts' ? 'Posts' : 'Community'}
                  </button>
                ))}
              </div>

              {/* Dynamic search bar inside tab space for mobile */}
              <div className="w-full sm:w-64 relative sm:hidden">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter content..."
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-slate-100 placeholder-slate-500'
                      : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-450'
                  }`}
                />

                {/* Suggestions Dropdown for mobile */}
                {searchTerm.trim() !== '' && (
                  <div className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border p-2 shadow-2xl z-50 backdrop-blur-xl ${
                    isDark 
                      ? 'bg-slate-900/90 border-white/10 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
                      : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.1)]'
                  }`}>
                    <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-hide">
                      {goals.filter(goal => 
                        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()))
                      ).length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 text-center">No goals match search query</p>
                      ) : (
                        goals.filter(goal => 
                          goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).map(goal => (
                          <button
                            key={goal.id}
                            onClick={() => {
                              setSearchTerm('')
                              setActiveTab('goals')
                              setFilterCategory('All')
                              setOpenInfoId(goal.id)
                              setTimeout(() => {
                                const el = document.getElementById(`goal-${goal.id}`)
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                              }, 150)
                            }}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                              isDark ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-105 text-slate-800'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate">{goal.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{goal.category} • {goal.status}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TAB CONTENT: DREAMS/GOALS */}
            {activeTab === 'goals' && (
              <div className="space-y-6">
                
                {/* Category Pills list */}
                <div className="flex flex-wrap gap-2 items-center">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setFilterCategory(category)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        filterCategory === category
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow'
                          : isDark
                            ? 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'
                            : 'bg-slate-150 border border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {category}
                      <span className={`ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                        isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {category === 'All' ? goals.length : categoryCounts[category] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredGoals.length === 0 ? (
                  <div className={`rounded-[32px] border p-12 text-center shadow-md transition-all duration-300 ${
                    isDark ? 'border-white/5 bg-slate-900/10 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                  }`}>
                    <div className="max-w-md mx-auto space-y-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                        <Target className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold">No dreams discovered yet</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        "Every great adventure starts with a single goal. Add a dream to begin mapping your itinerary."
                      </p>
                      <Link
                        href="/dashboard/goal/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow transition"
                      >
                        <Plus className="w-4 h-4" />
                        Log Your First Dream
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredGoals.map((goal) => {
                      const status = goal.status || 'Not Started'
                      const progress = typeof goal.progress === 'number' ? goal.progress : 0
                      const isExpanded = openInfoId === goal.id

                      const cardCatColors = (() => {
                        switch (goal.category) {
                          case 'Travel': return isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          case 'Skills': return isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
                          case 'Health': return isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                          case 'Adventure': return isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-700 border-orange-200'
                          default: return isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }
                      })()

                      return (
                        <div
                          key={goal.id}
                          id={`goal-${goal.id}`}
                          className={`rounded-3xl border transition-all duration-300 p-6 shadow-xl ${
                            isExpanded 
                              ? isDark 
                                ? 'border-indigo-500/30 bg-slate-900/50 backdrop-blur-2xl ring-1 ring-indigo-500/10' 
                                : 'border-indigo-500 bg-white ring-1 ring-indigo-500/15'
                              : isDark 
                                ? 'border-white/5 bg-slate-900/15 backdrop-blur-lg hover:border-white/10 hover:bg-white/5 hover:translate-y-[-2px]'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:translate-y-[-2px]'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            
                            {/* Left details */}
                            <div className="flex items-start gap-4 flex-grow min-w-0">
                              
                              {/* Complete radio button wrapper */}
                              <div className="pt-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(goal.id, status === 'Completed' ? 'In Progress' : 'Completed')}
                                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${
                                    status === 'Completed'
                                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-500'
                                      : isDark
                                        ? 'border-slate-700 hover:border-indigo-500 bg-transparent text-slate-400'
                                        : 'border-slate-300 hover:border-indigo-600 bg-transparent text-slate-500'
                                  }`}
                                  aria-label="Toggle completed"
                                >
                                  {status === 'Completed' && <Check className="w-4 h-4" />}
                                </button>
                              </div>

                              <div className="space-y-2.5 flex-grow min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/dashboard/goal/${goal.id}`}
                                    className={`text-xl font-bold transition truncate ${
                                      isDark ? 'text-slate-100 hover:text-indigo-400' : 'text-slate-800 hover:text-indigo-600'
                                    }`}
                                  >
                                    {goal.title}
                                  </Link>
                                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${cardCatColors}`}>
                                    {goal.category || 'General'}
                                  </span>
                                </div>
                                
                                <p className={`text-sm leading-relaxed max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
                                  {goal.description || 'No summary configured.'}
                                </p>

                                {/* Chips display */}
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                  {goal.targetDate && (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                                      isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'
                                    }`}>
                                      <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                                      {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  )}
                                  {goal.budget != null && (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                                      isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'
                                    }`}>
                                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                      ₹{Number(goal.budget).toLocaleString()}
                                    </span>
                                  )}
                                  {goal.location && (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                                      isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'
                                    }`}>
                                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                      {goal.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right action metrics */}
                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0">
                              
                              {/* progress gauges */}
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-2xl font-black text-indigo-400">{progress}%</p>
                                  <div className={`w-24 h-1.5 rounded-full overflow-hidden mt-1 ${isDark ? 'bg-slate-800' : 'bg-slate-150'}`}>
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.6 }}
                                    />
                                  </div>
                                </div>

                                {/* Mini circular progress ring */}
                                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="20" cy="20" r="16" className={isDark ? 'stroke-slate-800' : 'stroke-slate-150'} strokeWidth="3.5" fill="transparent" />
                                    <circle cx="20" cy="20" r="16" className="stroke-indigo-500" strokeWidth="3.5" fill="transparent" strokeDasharray="100.5" strokeDashoffset={100.5 - (100.5 * progress) / 100} strokeLinecap="round" />
                                  </svg>
                                </div>
                              </div>

                              {/* Collapse toggles */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setOpenInfoId(isExpanded ? null : goal.id)}
                                  className={`p-2.5 rounded-xl border transition-all ${
                                    isExpanded 
                                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                                      : isDark
                                        ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  title="Details & Timeline"
                                >
                                  <Info className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className={`p-2.5 rounded-xl border transition-all ${
                                    isDark
                                      ? 'bg-white/5 border-white/5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20'
                                      : 'bg-slate-50 border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                                  }`}
                                  title="Delete dream"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                            </div>

                          </div>

                          {/* DETAILS EXTENDED EXPAND PANEL */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`overflow-hidden mt-6 pt-6 border-t ${isDark ? 'border-white/5' : 'border-slate-150'}`}
                              >
                                {/* Grid milestones and notes */}
                                <div className="grid md:grid-cols-2 gap-8">
                                  
                                  {/* Milestone timeline list */}
                                  <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                      <h4 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        Timeline Milestones
                                        {goal.milestones?.length > 0 && (
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                            {goal.milestones.filter((m:any) => m.completed).length}/{goal.milestones.length}
                                          </span>
                                        )}
                                      </h4>
                                    </div>

                                    {/* timeline Connected Line Component */}
                                    <div className="relative pl-6 space-y-4">
                                      {/* Vertical timeline path */}
                                      <div className={`absolute left-[7px] top-2 bottom-2 w-[2px] ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                                      {/* Active green timeline path */}
                                      {goal.milestones?.length > 0 && (
                                        <div 
                                          className="absolute left-[7px] top-2 w-[2px] bg-emerald-500 transition-all duration-500" 
                                          style={{ 
                                            height: `${(goal.milestones.filter((m:any) => m.completed).length / goal.milestones.length) * 100}%` 
                                          }} 
                                        />
                                      )}

                                      {(!goal.milestones || goal.milestones.length === 0) ? (
                                        <p className="text-xs italic text-slate-500">No checkpoints declared yet.</p>
                                      ) : (
                                        goal.milestones.map((m: any) => (
                                          <div key={m.id} className="relative flex items-center justify-between group/m">
                                            
                                            {/* Node badge icon */}
                                            <div className={`absolute -left-[24px] w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition z-10 ${
                                              m.completed 
                                                ? 'border-emerald-500 bg-emerald-500' 
                                                : isDark 
                                                  ? 'border-slate-700 bg-slate-900' 
                                                  : 'border-slate-300 bg-white'
                                            }`}>
                                              {m.completed && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>

                                            <span 
                                              onClick={() => toggleMilestone(goal.id, m.id, m.completed)}
                                              className={`text-xs cursor-pointer select-none truncate flex-1 ${
                                                m.completed 
                                                  ? 'line-through text-slate-500' 
                                                  : isDark 
                                                    ? 'text-slate-200 hover:text-indigo-400' 
                                                    : 'text-slate-750 hover:text-indigo-650'
                                              }`}
                                            >
                                              {m.title}
                                            </span>

                                            <button
                                              onClick={() => deleteMilestone(goal.id, m.id)}
                                              className="opacity-0 group-hover/m:opacity-100 p-1 text-rose-450 hover:bg-rose-500/10 rounded transition-all"
                                              aria-label="Remove milestone"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))
                                      )}
                                    </div>

                                    {/* Add milestone text field */}
                                    <div className="flex gap-2 pt-2">
                                      <input
                                        type="text"
                                        value={milestoneInputs[goal.id] || ''}
                                        onChange={(e) => setMilestoneInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            addMilestone(goal.id, milestoneInputs[goal.id] || '')
                                            setMilestoneInputs(prev => ({ ...prev, [goal.id]: '' }))
                                          }
                                        }}
                                        placeholder="Add a milestone..."
                                        className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                                          isDark 
                                            ? 'bg-white/5 border-white/5 text-slate-200 placeholder-slate-500' 
                                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                        }`}
                                      />
                                      <button
                                        onClick={() => {
                                          addMilestone(goal.id, milestoneInputs[goal.id] || '')
                                          setMilestoneInputs(prev => ({ ...prev, [goal.id]: '' }))
                                        }}
                                        className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
                                      >
                                        Add
                                      </button>
                                    </div>

                                  </div>

                                  {/* Notes sticky card list */}
                                  <div className="space-y-4">
                                    <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Goal Notebook</h4>
                                    
                                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                      {(!goal.notes || goal.notes.length === 0) ? (
                                        <p className="text-xs italic text-slate-500">Notebook is empty.</p>
                                      ) : (
                                        goal.notes.map((n: any, idx: number) => {
                                          const notesColors = isDark ? [
                                            'bg-yellow-500/5 border-yellow-500/10 text-yellow-200',
                                            'bg-cyan-500/5 border-cyan-500/10 text-cyan-200',
                                            'bg-purple-500/5 border-purple-500/10 text-purple-200',
                                            'bg-pink-500/5 border-pink-500/10 text-pink-200'
                                          ] : [
                                            'bg-yellow-50 border-yellow-250 text-yellow-900 shadow-sm',
                                            'bg-cyan-50 border-cyan-250 text-cyan-900 shadow-sm',
                                            'bg-purple-50 border-purple-250 text-purple-900 shadow-sm',
                                            'bg-pink-50 border-pink-250 text-pink-900 shadow-sm'
                                          ]
                                          return (
                                            <div 
                                              key={n.id} 
                                              className={`p-3 rounded-2xl border flex items-start gap-2.5 justify-between group/n transition ${
                                                notesColors[idx % notesColors.length]
                                              }`}
                                            >
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{n.content}</p>
                                                <span className="text-[9px] text-slate-400 block mt-1.5">
                                                  {new Date(n.createdAt || goal.createdAt).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <button
                                                onClick={() => deleteNote(goal.id, n.id)}
                                                className="opacity-0 group-hover/n:opacity-100 p-1 hover:bg-rose-500/10 text-rose-400 rounded transition-all"
                                                aria-label="Remove note"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          )
                                        })
                                      )}
                                    </div>

                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        id={`note-input-${goal.id}`}
                                        value={noteInputs[goal.id] || ''}
                                        onChange={(e) => setNoteInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            addNote(goal.id, noteInputs[goal.id] || '')
                                            setNoteInputs(prev => ({ ...prev, [goal.id]: '' }))
                                          }
                                        }}
                                        placeholder="Jot a note..."
                                        className={`flex-1 px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                                          isDark 
                                            ? 'bg-white/5 border-white/5 text-slate-200 placeholder-slate-500' 
                                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                        }`}
                                      />
                                      <button
                                        onClick={() => {
                                          addNote(goal.id, noteInputs[goal.id] || '')
                                          setNoteInputs(prev => ({ ...prev, [goal.id]: '' }))
                                        }}
                                        className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition"
                                      >
                                        Jot
                                      </button>
                                    </div>

                                  </div>

                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: POSTS */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {filteredMyPosts.length === 0 ? (
                  <div className={`rounded-[32px] border p-12 text-center shadow transition-all duration-300 ${
                    isDark ? 'border-white/5 bg-slate-900/10 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                  }`}>
                    <p className="text-lg font-bold">{searchTerm ? 'No posts match your search query' : 'No posts published yet'}</p>
                    <p className="text-sm text-slate-400 mt-2">{searchTerm ? 'Try a different search query.' : 'Create a post on the Explore Community Feed and it will appear here.'}</p>
                  </div>
                ) : (
                  filteredMyPosts.map((post) => (
                    <div key={post.id} className={`rounded-3xl border p-6 shadow-xl transition-all duration-300 ${
                      isDark ? 'border-white/5 bg-slate-900/15' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                        {post.image ? (
                          <DashboardPostCarousel imageSource={post.image} />
                        ) : null}
                        <div className="flex-1 space-y-3 min-w-0">
                          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.author}</h3>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-350' : 'text-slate-650'}`}>{post.text}</p>
                          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold pt-2">
                            <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-250'}`}>{post.likes} Likes</span>
                            <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-250'}`}>{post.comments?.length ?? 0} Comments</span>
                            <span className={`rounded-full px-3 py-1 ${isDark ? 'bg-slate-800 text-slate-350' : 'bg-slate-150 text-slate-600'}`}>{formatRealTime(post.date)}</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isDark
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 hover:bg-rose-500/20 hover:border-rose-500/30'
                                : 'bg-slate-50 border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                            }`}
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: COMMUNITY FEED */}
            {activeTab === 'community' && (
              <div className="space-y-6">
                <StoriesBar />
                <ExploreFeed searchTerm={searchTerm} />
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: LIFE COMMAND WIDGETS (Render only on Dreams tab) */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              
              {/* PERSONAL ANALYTICS CARD */}
              <div id="personal-analytics-section" className={`rounded-3xl border p-6 shadow-xl space-y-5 transition-all duration-300 ${
                isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
              }`}>
                <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-white/5' : 'border-slate-150'}`}>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Personal Analytics
                  </h3>
                  <div className={`flex rounded-lg p-0.5 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <button
                      onClick={() => setActiveAnalyticsTab('category')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                        activeAnalyticsTab === 'category' ? 'bg-indigo-600 text-white' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Category
                    </button>
                    <button
                      onClick={() => setActiveAnalyticsTab('trends')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                        activeAnalyticsTab === 'trends' ? 'bg-indigo-600 text-white' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Trends
                    </button>
                  </div>
                </div>

                {activeAnalyticsTab === 'category' ? (
                  <div className="space-y-4">
                    {goals.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-6">No goals added to graph category distribution.</p>
                    ) : (
                      <>
                        {/* SVG Donut Chart */}
                        <div className="flex justify-center py-2">
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              {/* Background track circle */}
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent" 
                                className={isDark ? 'stroke-slate-800' : 'stroke-slate-100'} 
                                strokeWidth="10" 
                              />
                              {donutSegments.map((seg, idx) => (
                                <circle
                                  key={`donut-seg-${idx}`}
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="transparent"
                                  className={seg.colorClass}
                                  strokeWidth="10"
                                  strokeDasharray={seg.strokeDash}
                                  strokeDashoffset={seg.strokeOffset}
                                  strokeLinecap="round"
                                />
                              ))}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ratio</span>
                              <span className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{totalCats} Goals</span>
                            </div>
                          </div>
                        </div>

                        {/* Legend List */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          {donutSegments.map((seg, idx) => (
                            <div key={`donut-legend-${idx}`} className={`flex items-center gap-1.5 p-1 rounded transition-colors ${isDark ? 'hover:bg-white/5 text-slate-350' : 'hover:bg-slate-100 text-slate-700'}`}>
                              <span className={`w-2 h-2 rounded-full ${seg.bgClass}`} />
                              <span className="truncate flex-1">{seg.cat}</span>
                              <span className={`${seg.textClass} font-bold`}>{seg.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SVG Completion Trends Area Chart */}
                    <div className="py-2">
                      <svg className="w-full h-24 overflow-visible" viewBox="0 0 300 100">
                        <defs>
                          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid Line lines */}
                        <line x1="0" y1="90" x2="300" y2="90" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="55" x2="300" y2="55" className={isDark ? 'stroke-slate-800/80 animate-pulse' : 'stroke-slate-200/80 animate-pulse'} strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="0" y1="20" x2="300" y2="20" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="1" strokeDasharray="4 4" />

                        {/* Area Fill */}
                        <path d={trendPoints.pathArea} fill="url(#chart-area-grad)" />
                        {/* Trend Line */}
                        <path d={trendPoints.pathLine} fill="none" className="stroke-violet-500" strokeWidth="2" strokeLinecap="round" />

                        {/* Coordinate Nodes */}
                        {trendPoints.coords.map((c, i) => (
                          <circle key={`node-${i}`} cx={c.x} cy={c.y} r="3.5" className={`${isDark ? 'fill-slate-950' : 'fill-white'} stroke-violet-500`} strokeWidth="1.5" />
                        ))}
                      </svg>
                    </div>
                    <div className={`flex justify-between text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>60d ago</span>
                      <span>30d ago</span>
                      <span>14d ago</span>
                      <span>7d ago</span>
                      <span>Today</span>
                    </div>
                    <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chart plots completed dreams cumulative growth</p>
                  </div>
                )}
              </div>

              {/* BUDGET TRACKING WIDGET */}
              <div className={`rounded-3xl border p-6 shadow-xl space-y-4 transition-all duration-300 ${
                isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
              }`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  Planned Budget Tracker
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-550'}>Total Planned Spending:</span>
                    <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>₹{totalPlannedBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-550'}>Remaining Budget:</span>
                    <span className="text-emerald-500">₹{remainingBudget.toLocaleString()}</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${totalPlannedBudget > 0 ? (spentBudget / totalPlannedBudget) * 100 : 0}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <p className={`text-[10px] text-center ${isDark ? 'text-slate-550' : 'text-slate-400'}`}>Visualizes budget allocation for completed goals</p>
                </div>
              </div>

              {/* UPCOMING DEADLINES WIDGET */}
              <div className={`rounded-3xl border p-6 shadow-xl space-y-4 transition-all duration-300 ${
                isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
              }`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-2.5">
                  {upcomingDeadlines.length === 0 ? (
                    <p className={`text-xs italic ${isDark ? 'text-slate-550' : 'text-slate-400'}`}>No future deadlines configured.</p>
                  ) : (
                    upcomingDeadlines.map((goal) => {
                      const diffDays = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      const isUrgent = diffDays <= 14

                      return (
                        <Link 
                          href={`/dashboard/goal/${goal.id}`}
                          key={`deadline-${goal.id}`} 
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors block ${
                            isDark 
                              ? 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-200' 
                              : 'border-slate-150 bg-slate-50 hover:bg-slate-100 text-slate-850'
                          }`}
                        >
                          <span className="text-xs font-semibold truncate flex-1 mr-2">{goal.title}</span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            isUrgent 
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                              : isDark 
                                ? 'bg-slate-800 text-slate-400' 
                                : 'bg-slate-200 text-slate-500'
                          }`}>
                            {diffDays > 0 ? `${diffDays}d left` : 'Overdue'}
                          </span>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>

              {/* MONTHLY COMPLETION TARGET WIDGET */}
              <div className={`rounded-3xl border p-6 shadow-xl space-y-4 transition-all duration-300 ${
                isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
              }`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-500" />
                  Monthly Target Goals
                </h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-baseline">
                    <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target completions</p>
                    <p className="text-xl font-black text-indigo-500">{completedCount} / {monthlyTarget}</p>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <motion.div 
                      className="h-full bg-indigo-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (completedCount / monthlyTarget) * 100)}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>"Every progress counts. Keep completing goals to satisfy the monthly score target."</p>
                </div>
              </div>

              {/* SIMILAR GOALS COMMUNITY COMPLETED WIDGET */}
              <div className={`rounded-3xl border p-6 shadow-xl space-y-4 transition-all duration-300 ${
                isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
              }`}>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-500" />
                  Similar Goal Achievements
                </h3>
                <div className="space-y-3">
                  {displayAchievements.map((usr, i) => (
                    <div key={`sim-${i}`} className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      isDark ? 'bg-white/5 border-white/5 text-slate-200' : 'bg-slate-50 border-slate-150 text-slate-800'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                          {usr.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{usr.name}</p>
                          <p className={`text-[9px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {usr.isCompleted ? 'Completed: ' : 'In Progress: '}{usr.goal}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        isDark 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {usr.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </section>
      </main>

      {/* INTERACTIVE FLOATING QUICK ACTIONS MENU (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <AnimatePresence>
            {quickActionsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{ duration: 0.2 }}
                className={`absolute bottom-16 right-0 w-48 rounded-2xl border shadow-2xl p-2 flex flex-col gap-1.5 backdrop-blur-xl ${
                  isDark ? 'border-white/10 bg-slate-900/90 text-slate-200' : 'border-slate-250 bg-white/95 text-slate-805'
                }`}
              >
                <Link
                  href="/dashboard/goal/new"
                  onClick={() => setQuickActionsOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
                    isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4.5 h-4.5 text-indigo-500" />
                  Create Goal
                </Link>
                <Link
                  href="/explore/create"
                  onClick={() => setQuickActionsOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition ${
                    isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4.5 h-4.5 text-cyan-500" />
                  Publish Community Post
                </Link>
                <button
                  onClick={() => {
                    setQuickActionsOpen(false)
                    setActiveTab('goals')
                    setActiveAnalyticsTab('trends')
                    setTimeout(() => {
                      const chartsEl = document.getElementById('personal-analytics-section')
                      if (chartsEl) chartsEl.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition w-full text-left ${
                    isDark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4.5 h-4.5 text-rose-500" />
                  View Progress Trends
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition focus:outline-none"
            aria-label="Quick Actions Menu"
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${quickActionsOpen ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </div>

    </div>
  )
}