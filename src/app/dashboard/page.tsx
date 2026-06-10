'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Settings, LogOut, User, Search, Filter, ChevronDown, Check, Trash2, Info, CalendarDays, DollarSign, MapPin, Target, Clock, TrendingUp, MessageSquare } from 'lucide-react'
import { useTheme } from '../theme-provider'
import StoriesBar from '../../components/StoriesBar'
import ExploreFeed from '../../components/ExploreFeed'

export default function DashboardPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dropdownRef = useRef<HTMLDivElement | null>(null)
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

  const CATEGORIES = ['All', 'Travel', 'Skills', 'Health', 'Adventure', 'Personal']

  useEffect(() => {
    // Check authentication
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
    } catch (error) {
      console.error('Failed to load user from localStorage:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setIsLoading(false)
      router.push('/auth/login')
    }
  }, [])

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

  useEffect(() => {
    if (!user) return

    try {
      const stored = window.localStorage.getItem('mybuko-explore-posts')
      if (!stored) {
        setMyPosts([])
        return
      }

      const parsed = JSON.parse(stored) as any[]
      const filtered = parsed.filter((post) => {
        return post.authorEmail === user.email || post.author === user.name
      })

      setMyPosts(filtered)
    } catch {
      setMyPosts([])
    }
  }, [user])

  const fetchGoals = async (token: string) => {
    try {
      const res = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        // Merge any locally-joined goals for this user so they show up in the dashboard
        let merged = data
        try {
          const joinedRaw = window.localStorage.getItem('mybuko-joined-goals')
          if (joinedRaw) {
            const joined = JSON.parse(joinedRaw) as any[]
            const storedUser = window.localStorage.getItem('user')
            const parsedUser = storedUser ? JSON.parse(storedUser) : null
            const userJoined = joined.filter(j => j.ownerEmail === parsedUser?.email || j.ownerName === parsedUser?.name)
            // avoid id collisions with server goals
            const unique = userJoined.filter(j => !data.some((d: any) => String(d.id) === String(j.id) || d.title === j.title))
            merged = [...data, ...unique]
          }
        } catch {
          // ignore localstorage parse errors
        }

        setGoals(merged)
        setFilteredGoals(merged)
      } else if (res.status === 401) {
        // Token expired, redirect to login
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

  // Filter and search goals
  useEffect(() => {
    let filtered = goals

    if (filterCategory !== 'All') {
      filtered = filtered.filter(goal => goal.category === filterCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredGoals(filtered)
  }, [filterCategory, searchTerm, goals])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/')
  }

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
          console.error('Failed to update local goal status in localStorage:', err)
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

      if (!res.ok) {
        console.error('Failed to update goal status')
        return
      }

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
          console.error('Failed to delete local goal from localStorage:', err)
        }
        return
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id))
      } else {
        console.error('Failed to delete goal', await res.text())
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

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const completedCount = goals.filter(g => g.status === 'Completed').length
  const completionRate = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0
  const categoryCounts = CATEGORIES.reduce((acc, category) => {
    acc[category] = goals.filter(goal => goal.category === category).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-900'}`}>
      
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDark ? 'bg-slate-900/95 border-slate-800 shadow-slate-900/20' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link href="/" className={`flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-xl font-bold">MYBUKO</span>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your goals..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-slate-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'}`}
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isDark ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180 text-white' : isDark ? 'text-slate-200' : 'text-gray-600'}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`}>
                    <div className={`px-4 py-2 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowDropdown(false)}
                      className={`block px-4 py-2 transition-colors flex items-center gap-2 ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowDropdown(false)}
                      className={`block px-4 py-2 transition-colors flex items-center gap-2 ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>

                    <Link
                      href="/dashboard/chats"
                      onClick={() => setShowDropdown(false)}
                      className={`block px-4 py-2 transition-colors flex items-center gap-2 ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chats
                    </Link>

                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        handleLogout()
                      }}
                      className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 border-t mt-2 ${isDark ? 'text-rose-300 border-slate-700 hover:bg-slate-800' : 'text-red-600 border-gray-200 hover:bg-red-50'}`}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Bucket List
          </h1>
          <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Your goals, tracked and achieved</p>
        </div>

        {/* Add Goal CTA */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Link
            href="/dashboard/goal/new"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-semibold tracking-wide transition ${isDark ? 'bg-gradient-to-r from-violet-700 to-fuchsia-500 text-white hover:opacity-95' : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:shadow-lg'}`}
          >
            <Plus className="w-5 h-5" />
            Add New Goal
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className={`group rounded-2xl shadow p-6 transition-transform duration-300 hover:-translate-y-2 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>Total</p>
              <div className="rounded-2xl bg-blue-100 p-2 text-blue-600 transition-transform duration-300 group-hover:rotate-6"><Target className="w-5 h-5" /></div>
            </div>
            <p className="text-4xl font-bold text-blue-600">{goals.length}</p>
          </div>
          <div className={`group rounded-2xl shadow p-6 transition-transform duration-300 hover:-translate-y-2 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>Completed</p>
              <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-600 transition-transform duration-300 group-hover:-rotate-6"><Check className="w-5 h-5" /></div>
            </div>
            <p className="text-4xl font-bold text-green-600">{completedCount}</p>
          </div>
          <div className={`group rounded-2xl shadow p-6 transition-transform duration-300 hover:-translate-y-2 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>Active</p>
              <div className="rounded-2xl bg-orange-100 p-2 text-orange-600 transition-transform duration-300 group-hover:rotate-6"><Clock className="w-5 h-5" /></div>
            </div>
            <p className="text-4xl font-bold text-orange-600">{goals.length - completedCount}</p>
          </div>
          <div className={`group rounded-2xl shadow p-6 transition-transform duration-300 hover:-translate-y-2 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>Progress</p>
              <div className="rounded-2xl bg-purple-100 p-2 text-purple-600 transition-transform duration-300 group-hover:-rotate-6"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <p className="text-4xl font-bold text-purple-600">{completionRate}%</p>
          </div>
        </div>

        {/* Tab Switch */}
        <div className={`rounded-2xl shadow p-4 mb-8 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`px-5 py-3 rounded-full font-semibold transition ${activeTab === 'goals' ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md' : isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Goals
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`px-5 py-3 rounded-full font-semibold transition ${activeTab === 'posts' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md' : isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              My Posts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`px-5 py-3 rounded-full font-semibold transition ${activeTab === 'community' ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md' : isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Community
            </button>
            <div className={`ml-auto text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              {activeTab === 'goals'
                ? `${filteredGoals.length} filtered goals`
                : activeTab === 'posts'
                ? `${myPosts.length} shared posts`
                : 'Community Feed'}
            </div>
          </div>
        </div>

        {activeTab === 'goals' && (
          <>
            {/* Filter */}
            <div className={`rounded-2xl shadow p-4 mb-8 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
              <div className="flex flex-wrap gap-3 items-center">
                <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Filter by category:</span>
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(category)}
                    className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                      filterCategory === category
                        ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white'
                        : isDark
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category} <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white/10 px-2 text-xs font-semibold text-slate-200">{category === 'All' ? goals.length : categoryCounts[category] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goals List */}
            <div className="space-y-4">
          {isLoading ? (
            <div className={`text-center py-12 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Loading your goals...</div>
          ) : goals.length === 0 ? (
            <div className={`rounded-2xl shadow p-12 text-center ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
              <div className="mb-6">
                <Filter className={`mx-auto mb-4 w-14 h-14 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                <p className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>No goals yet</p>
                <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mt-2`}>Start by creating your first goal.</p>
              </div>
              <Link
                href="/dashboard/goal/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Your First Goal
              </Link>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className={`rounded-2xl shadow p-12 text-center ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
              <p className={`${isDark ? 'text-slate-100' : 'text-gray-900'} mb-4`}>No goals found</p>
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Try changing your search or category.</p>
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const status = goal.status || 'Not Started'
              const progress = typeof goal.progress === 'number' ? goal.progress : 0

              return (
                <div
                  key={goal.id}
                  className={`rounded-2xl shadow hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 p-6 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center gap-4">
                        <label
                          onClick={() => handleUpdateStatus(goal.id, status === 'Completed' ? 'In Progress' : 'Completed')}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${status === 'Completed' ? 'border-emerald-400 bg-emerald-500/20' : isDark ? 'border-slate-600 bg-transparent' : 'border-gray-300 bg-transparent'} cursor-pointer transition ${status === 'Completed' ? 'text-emerald-400' : isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                          <input
                            type="radio"
                            name={`status-${goal.id}`}
                            value="Completed"
                            checked={status === 'Completed'}
                            readOnly
                            className="sr-only"
                          />
                          <span className={`w-4 h-4 rounded-full transition ${status === 'Completed' ? 'bg-emerald-400' : 'border border-current'}`}></span>
                        </label>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/goal/${goal.id}`}
                          className={`block text-xl font-semibold transition-colors ${isDark ? 'text-slate-100 hover:text-blue-300' : 'text-gray-900 hover:text-blue-600'}`}>
                          {goal.title}
                        </Link>
                        <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mt-1`}>{goal.description || 'No description yet.'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                            {goal.category || 'General'}
                          </span>
                          {goal.targetDate && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                              <CalendarDays className="w-4 h-4" />
                              {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{progress}%</p>
                        <div className="w-32 h-2 rounded-full bg-slate-200 mt-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-teal-600" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOpenInfoId(openInfoId === goal.id ? null : goal.id)}
                          className={`p-3 rounded-full transition-all ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}
                          aria-label="Show goal details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-rose-300 hover:bg-rose-500/10' : 'bg-gray-100 text-rose-600 hover:bg-rose-50'}`}
                          aria-label="Delete goal"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {openInfoId === goal.id && (
                    <div className={`mt-4 rounded-2xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900/40 backdrop-blur-md' : 'border-gray-200 bg-slate-50/50'} space-y-6`}>
                      
                      {/* Grid details */}
                      <div className="grid sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-blue-400" />
                          <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Deadline:</span>
                          <span className={isDark ? 'text-slate-200' : 'text-gray-800'}>{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Budget:</span>
                          <span className={isDark ? 'text-slate-200' : 'text-gray-800'}>{goal.budget != null ? `₹${Number(goal.budget).toLocaleString()}` : 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-pink-400" />
                          <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Location:</span>
                          <span className={isDark ? 'text-slate-200' : 'text-gray-800'}>{goal.location || 'Not set'}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {goal.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {goal.tags.map((tag: string, index: number) => (
                            <span key={`${goal.id}-tag-${index}`} className={`rounded-full px-3 py-1 ${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-gray-200/80 text-gray-700'}`}>#{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Milestones and Notes Section */}
                      <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-700/30">
                        
                        {/* Milestones Column */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                              <span>Milestones</span>
                              {goal.milestones?.length > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-205 text-gray-600'}`}>
                                  {goal.milestones.filter((m: any) => m.completed).length}/{goal.milestones.length}
                                </span>
                              )}
                            </h4>
                          </div>

                          {/* List of milestones */}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {(!goal.milestones || goal.milestones.length === 0) ? (
                              <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No milestones yet.</p>
                            ) : (
                              goal.milestones.map((m: any) => (
                                <div key={m.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs group/item transition ${isDark ? 'bg-slate-800/40 hover:bg-slate-800/80' : 'bg-gray-100/60 hover:bg-gray-100'}`}>
                                  <button
                                    onClick={() => toggleMilestone(goal.id, m.id, m.completed)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                      m.completed
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : isDark ? 'border-slate-600 hover:border-slate-400' : 'border-gray-300 hover:border-blue-500'
                                    }`}
                                    id={`milestone-check-${goal.id}-${m.id}`}
                                  >
                                    {m.completed && <Check className="w-3 h-3 text-white" />}
                                  </button>
                                  <span className={`flex-1 truncate ${m.completed ? 'line-through text-slate-500' : isDark ? 'text-slate-300' : 'text-gray-750'}`}>
                                    {m.title}
                                  </span>
                                  <button
                                    onClick={() => deleteMilestone(goal.id, m.id)}
                                    className="opacity-0 group-hover/item:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition"
                                    aria-label="Delete milestone"
                                    id={`milestone-delete-${goal.id}-${m.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add milestone input */}
                          <div className="flex gap-2">
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
                              placeholder="New milestone..."
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-slate-805 border-slate-700 text-slate-200' : 'bg-white border-gray-300 text-gray-900'}`}
                              id={`milestone-input-${goal.id}`}
                            />
                            <button
                              onClick={() => {
                                addMilestone(goal.id, milestoneInputs[goal.id] || '')
                                setMilestoneInputs(prev => ({ ...prev, [goal.id]: '' }))
                              }}
                              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 font-semibold"
                              id={`milestone-add-btn-${goal.id}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Notes Column */}
                        <div className="space-y-4">
                          <h4 className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Notes</h4>

                          {/* List of notes */}
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {(!goal.notes || goal.notes.length === 0) ? (
                              <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No notes yet.</p>
                            ) : (
                              goal.notes.map((n: any) => (
                                <div key={n.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs group/item transition ${isDark ? 'bg-slate-800/40 hover:bg-slate-800/80' : 'bg-gray-100/60 hover:bg-gray-100'}`}>
                                  <div className="flex-1 min-w-0">
                                    <p className={`whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{n.content}</p>
                                    <span className={`text-[10px] block mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                      {new Date(n.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => deleteNote(goal.id, n.id)}
                                    className="opacity-0 group-hover/item:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition"
                                    aria-label="Delete note"
                                    id={`note-delete-${goal.id}-${n.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add note input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={noteInputs[goal.id] || ''}
                              onChange={(e) => setNoteInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addNote(goal.id, noteInputs[goal.id] || '')
                                  setNoteInputs(prev => ({ ...prev, [goal.id]: '' }))
                                }
                              }}
                              placeholder="Add a note..."
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-slate-805 border-slate-700 text-slate-200' : 'bg-white border-gray-300 text-gray-900'}`}
                              id={`note-input-${goal.id}`}
                            />
                            <button
                              onClick={() => {
                                addNote(goal.id, noteInputs[goal.id] || '')
                                setNoteInputs(prev => ({ ...prev, [goal.id]: '' }))
                              }}
                              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 font-semibold"
                              id={`note-add-btn-${goal.id}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </>
    )}

    {activeTab === 'posts' && (
      <div className="space-y-4">
        {myPosts.length === 0 ? (
          <div className={`rounded-2xl shadow p-12 text-center ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
            <p className={`${isDark ? 'text-slate-100' : 'text-gray-900'} mb-4`}>No shared posts yet</p>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Create a post in the Explore page and it will appear here.</p>
          </div>
        ) : (
          myPosts.map((post) => (
            <div key={post.id} className={`rounded-2xl shadow p-6 ${isDark ? 'bg-slate-900/70 border border-slate-700' : 'bg-white'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{post.author}</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mt-2`}>{post.text}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">{post.likes} likes</span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{post.comments?.length ?? 0} comments</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{post.date}</span>
                  </div>
                </div>
                {post.image ? (
                  <img src={post.image} alt="My post image" className="h-40 w-full max-w-sm rounded-3xl object-cover sm:w-52" />
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    )}

    {activeTab === 'community' && (
      <div className="space-y-6">
        <StoriesBar />
        <ExploreFeed />
      </div>
    )}
      </div>
    </div>
  )
}