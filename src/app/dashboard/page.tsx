'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Settings, LogOut, User, Search, Filter, ChevronDown, Check, Trash2, Info, CalendarDays, DollarSign, MapPin, Target, Clock, TrendingUp } from 'lucide-react'
import { useTheme } from '../theme-provider'

export default function DashboardPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [filteredGoals, setFilteredGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [openInfoId, setOpenInfoId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

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

  const fetchGoals = async (token: string) => {
    try {
      const res = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setGoals(data)
        setFilteredGoals(data)
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
      const token = localStorage.getItem('token')
      const progress = newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 50 : 0
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
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-8 py-5 font-semibold tracking-wide transition ${isDark ? 'bg-gradient-to-r from-violet-700 to-fuchsia-500 text-white hover:opacity-95' : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:shadow-2xl'}`}
          >
            <Plus className="w-5 h-5" />
            Add New Goal
          </Link>
          <Link
            href="/dashboard/explore"
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-8 py-5 font-semibold tracking-wide transition ${isDark ? 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'}`}
          >
            Explore
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
                    <div className={`mt-4 rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-gray-200 bg-white'}`}>
                      <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-slate-200">Deadline:</span>
                          <span>{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-slate-200">Budget:</span>
                          <span>{goal.budget != null ? `₹${Number(goal.budget).toLocaleString()}` : 'Not set'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-pink-400" />
                          <span className="font-medium text-slate-200">Location:</span>
                          <span>{goal.location || 'Not set'}</span>
                        </div>
                      </div>
                      {goal.tags?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                          {goal.tags.map((tag: string, index: number) => (
                            <span key={`${goal.id}-tag-${index}`} className="rounded-full bg-slate-800/80 px-3 py-1">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}