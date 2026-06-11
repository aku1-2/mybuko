'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Sparkles, Loader, X, Check, Compass, BookOpen, Activity, 
  Flame, Lock, Globe, Calendar, DollarSign, MapPin, Award, 
  Lightbulb, AlertCircle, PlusCircle, Trash2, ShieldAlert, Target
} from 'lucide-react'
import { useTheme } from '../../../theme-provider'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
  { 
    name: 'Travel', 
    color: 'from-cyan-500 to-blue-500', 
    shadow: 'shadow-cyan-500/20', 
    icon: Compass, 
    desc: 'Explore new places, cultures, and horizons.',
    smartSuggestions: ['Research flight prices', 'Draft day-by-day itinerary', 'Pack light bag', 'Apply for visa']
  },
  { 
    name: 'Skills', 
    color: 'from-violet-500 to-purple-500', 
    shadow: 'shadow-violet-500/20', 
    icon: BookOpen, 
    desc: 'Master new talents, crafts, or professions.',
    smartSuggestions: ['Complete online starter course', 'Dedicate 30 mins daily practice', 'Build initial portfolio project', 'Find a mentor']
  },
  { 
    name: 'Health', 
    color: 'from-emerald-500 to-green-500', 
    shadow: 'shadow-emerald-500/20', 
    icon: Activity, 
    desc: 'Strengthen your physical and mental well-being.',
    smartSuggestions: ['Set a daily step goal', 'Consult a health professional', 'Track meals for a week', 'Prepare workout gear']
  },
  { 
    name: 'Adventure', 
    color: 'from-orange-500 to-red-500', 
    shadow: 'shadow-orange-500/20', 
    icon: Flame, 
    desc: 'Step out of your comfort zone with thrilling trials.',
    smartSuggestions: ['Book tickets in advance', 'Rent proper safety gear', 'Do conditioning workouts', 'Invite a buddy']
  },
  { 
    name: 'Personal', 
    color: 'from-pink-500 to-rose-500', 
    shadow: 'shadow-pink-500/20', 
    icon: Award, 
    desc: 'Reflect, build habits, and plan life milestones.',
    smartSuggestions: ['Set a clear start date', 'Jot down 3 daily bullet points', 'Review progress weekly', 'Reward small milestones']
  },
]

interface AIRecommendation {
  title: string
  why: string
  milestones: string[]
  timeframe: string
  estimatedBudget?: string
}

export default function AddGoalPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Dynamic user stats from DB
  const [userStats, setUserStats] = useState({
    totalCount: 0,
    completedCount: 0,
    streak: 7,
    level: 1
  })

  // Core States
  const [isLoading, setIsLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [selectedAIGoal, setSelectedAIGoal] = useState<AIRecommendation | null>(null)
  const [aiError, setAiError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Travel',
    targetDate: '',
    budget: '',
    priority: 'Medium',
    difficulty: 'Medium',
    location: '',
    tags: '',
    visibility: 'Private'
  })

  const [milestones, setMilestones] = useState<string[]>([])
  const [newMilestoneText, setNewMilestoneText] = useState('')

  // Fetch real stats on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/goals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const total = data.length
          const completed = data.filter((g: any) => g.status === 'Completed').length
          const savedStreak = localStorage.getItem('mybuko-streak')
          const streakVal = savedStreak ? parseInt(savedStreak, 10) : 7
          setUserStats({
            totalCount: total,
            completedCount: completed,
            streak: streakVal,
            level: Math.floor(completed / 3) + 1
          })
        }
      } catch (err) {
        console.error('Error fetching user stats:', err)
      }
    }
    fetchStats()
  }, [])

  // Dynamic Calculators
  const calculateDreamScore = () => {
    let score = 40
    if (formData.title.trim().length > 0) score += 10
    if (formData.description.trim().length > 0) score += 10
    if (formData.budget) score += 15
    if (formData.targetDate) score += 10
    if (formData.location) score += 5
    score += Math.min(20, milestones.length * 5)
    return Math.min(100, score)
  }

  const calculateSuccessPrediction = () => {
    let chance = 65
    if (milestones.length > 0) chance += 15
    if (formData.priority === 'High') chance += 5
    if (formData.priority === 'Low') chance -= 5
    if (formData.difficulty === 'Easy') chance += 10
    if (formData.difficulty === 'Hard') chance -= 10
    if (formData.targetDate) chance += 5
    if (formData.location) chance += 2
    return Math.min(98, Math.max(30, chance))
  }

  const selectedCategoryData = CATEGORIES.find(c => c.name === formData.category) || CATEGORIES[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          budget: formData.budget ? parseFloat(formData.budget) : null
        })
      })

      if (res.ok) {
        const goal = await res.json()
        
        // Add milestones if present
        if (milestones.length > 0) {
          for (const milestone of milestones) {
            await fetch(`/api/goals/${goal.id}/milestones`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ title: milestone })
            })
          }
        }

        router.push('/dashboard')
      } else {
        alert('Failed to create goal')
      }
    } catch (error) {
      alert('Error creating goal')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return
    setMilestones(prev => [...prev, newMilestoneText.trim()])
    setNewMilestoneText('')
  }

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== idx))
  }

  const generateAIPlan = async () => {
    setAiLoading(true)
    setAiError('')
    setAiRecommendations([])

    try {
      const res = await fetch('/api/ai/recommend-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          budget: formData.budget,
          targetDate: formData.targetDate,
          location: formData.location,
          userGoals: []
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success || !Array.isArray(data.recommendations) || data.recommendations.length === 0) {
        setAiError(data.error || 'Failed to generate AI recommendations. Make sure GROQ API key is set in .env.local')
        return
      }

      setAiRecommendations(data.recommendations)
      setShowAIModal(true)
    } catch (error) {
      console.error('AI Error:', error)
      setAiError('Error connecting to AI. Check your GROQ_API_KEY in .env.local')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAIRecommendation = (rec: AIRecommendation) => {
    setFormData(prev => ({
      ...prev,
      title: rec.title,
      description: rec.why,
      tags: rec.timeframe ? `${rec.timeframe}, ${prev.tags}` : prev.tags,
      budget: rec.estimatedBudget || prev.budget
    }))
    setMilestones(rec.milestones || [])
    setShowAIModal(false)
    setSelectedAIGoal(rec)
  }

  // Visual layout config
  const dreamScore = calculateDreamScore()
  const successPrediction = calculateSuccessPrediction()

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 sm:p-8`}>
      
      {/* Subtle Noise Texture Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-[0.02] ${isDark ? 'bg-[radial-gradient(#ffffff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000000_1px,transparent_1px)]'} [background-size:16px_16px] z-10`} />

      {/* Floating Aurora Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/5'} rounded-full blur-[130px]`} />
        <div className={`absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-violet-600/10' : 'bg-violet-400/5'} rounded-full blur-[140px]`} />
        <div className={`absolute top-[40%] right-[10%] w-[35%] h-[35%] ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-400/5'} rounded-full blur-[110px]`} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Navigation back header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command
          </Link>
          
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
            isDark ? 'bg-white/5 border-white/10 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
            AI Dream Engine Engaged
          </div>
        </div>

        {/* PREMIUM GOAL HERO SECTION */}
        <section className={`relative rounded-[32px] overflow-hidden border p-8 shadow-2xl transition-all duration-300 ${
          isDark ? 'border-white/10 bg-slate-900/40 backdrop-blur-2xl' : 'border-slate-200 bg-white'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight font-display bg-gradient-to-r bg-clip-text text-transparent ${
                isDark ? 'from-white via-slate-100 to-slate-400' : 'from-slate-950 via-slate-800 to-slate-600'
              }`}>
                Create Your Next Dream
              </h1>
              <p className={`text-sm sm:text-base max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Every unforgettable experience starts with a single goal. Map out your life checkpoints below.
              </p>
            </div>

            {/* Glowing Badges & Indicators */}
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Stats group */}
              <div className="flex items-center gap-2">
                <div className={`px-4 py-2 text-center rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100/60 border-slate-200'
                }`}>
                  <p className="text-lg font-black">{userStats.totalCount}</p>
                  <p className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Goals</p>
                </div>
                <div className={`px-4 py-2 text-center rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100/60 border-slate-200'
                }`}>
                  <p className="text-lg font-black text-orange-500 flex items-center gap-0.5 justify-center">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse fill-orange-500" />
                    {userStats.streak}
                  </p>
                  <p className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Streak</p>
                </div>
                <div className={`px-4 py-2 text-center rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100/60 border-slate-200'
                }`}>
                  <p className="text-lg font-black text-violet-400">{userStats.level}</p>
                  <p className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Level</p>
                </div>
              </div>

              {/* Animated Progress Ring badge */}
              <div className={`flex items-center gap-3 p-2.5 rounded-2xl border backdrop-blur-md ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100/40 border-slate-200/50'
              }`}>
                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="20" cy="20" r="16" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="3" fill="transparent" />
                    <circle 
                      cx="20" 
                      cy="20" 
                      r="16" 
                      className="stroke-violet-500" 
                      strokeWidth="3" 
                      fill="transparent" 
                      strokeDasharray="100.5" 
                      strokeDashoffset={100.5 - (100.5 * Math.min(100, userStats.completedCount * 10)) / 100} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <Award className="absolute w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold">Dream Progress</p>
                  <p className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{userStats.completedCount} Complete</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* TWO-COLUMN GRID WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: DREAM PLANNER FORM */}
          <main className="lg:col-span-7 space-y-6">
            
            <form onSubmit={handleSubmit} className={`rounded-[32px] border p-6 sm:p-8 shadow-xl space-y-7 transition-all duration-300 ${
              isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
            }`}>
              
              {/* Selected AI Goal Banner */}
              <AnimatePresence>
                {selectedAIGoal && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className="w-5 h-5 text-purple-400 shrink-0 animate-pulse" />
                      <p className="text-xs font-bold truncate">Goal enhanced using AI recommendations blueprint!</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAIGoal(null)
                        setMilestones([])
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 text-purple-400 hover:text-purple-300 transition shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title Section (with floating glow on focus) */}
              <div className="space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Goal Title</label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Visit Japan, Learn Guitar, Run a Marathon"
                    required
                    className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-slate-100 placeholder-slate-500' 
                        : 'bg-slate-100/60 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Elaborate on your dream, why it matters, and how you will feel once achieved..."
                  rows={4}
                  className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 resize-none ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-slate-100 placeholder-slate-500' 
                      : 'bg-slate-100/60 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* CATEGORY SECTION (Interactive cards) */}
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {CATEGORIES.map((cat) => {
                    const IconComponent = cat.icon
                    const isSelected = formData.category === cat.name
                    
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: cat.name }))
                          setSelectedAIGoal(null)
                          setMilestones([])
                        }}
                        className={`relative p-3.5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${
                          isSelected
                            ? `bg-gradient-to-br ${cat.color} border-transparent text-white shadow-lg ${cat.shadow} scale-[1.03]`
                            : isDark
                              ? 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-slate-300'
                              : 'bg-slate-100/60 border-slate-200 hover:bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                          isSelected ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
                        }`} />
                        <div className="text-[11px] font-extrabold uppercase tracking-wide">{cat.name}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Row: Target Date, Budget */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Target Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="targetDate"
                      value={formData.targetDate}
                      onChange={handleInputChange}
                      className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-slate-100 scheme-dark' 
                          : 'bg-slate-100/60 border-slate-250 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Budget (₹)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      placeholder="e.g., 250000"
                      className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-slate-100 placeholder-slate-500' 
                          : 'bg-slate-100/60 border-slate-250 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Row: Priority, Difficulty */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                      isDark 
                        ? 'bg-slate-800 border-white/10 text-slate-100' 
                        : 'bg-slate-100/60 border-slate-250 text-slate-900'
                    }`}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                      isDark 
                        ? 'bg-slate-800 border-white/10 text-slate-100' 
                        : 'bg-slate-100/60 border-slate-250 text-slate-900'
                    }`}
                  >
                    <option value="Easy">Easy (Low effort)</option>
                    <option value="Medium">Medium (Balanced)</option>
                    <option value="Hard">Hard (Requires dedication)</option>
                  </select>
                </div>
              </div>

              {/* Location & Tags */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Location (Optional)</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Tokyo, Japan"
                    className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-slate-100 placeholder-slate-500' 
                        : 'bg-slate-100/60 border-slate-250 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., adventure, travel, life"
                    className={`w-full px-4.5 py-3.5 text-sm rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-slate-100 placeholder-slate-500' 
                        : 'bg-slate-100/60 border-slate-250 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* VISIBILITY SECTION (Selectable Cards) */}
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Visibility Settings</label>
                <div className="grid gap-4 sm:grid-cols-2">
                  
                  {/* Private Card */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, visibility: 'Private' }))}
                    className={`cursor-pointer rounded-2xl border p-4.5 transition-all duration-300 flex items-start gap-3.5 relative overflow-hidden ${
                      formData.visibility === 'Private'
                        ? isDark
                          ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                          : 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                        : isDark
                          ? 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-400'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      formData.visibility === 'Private'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${formData.visibility === 'Private' ? (isDark ? 'text-emerald-400' : 'text-emerald-800') : ''}`}>Private Plan</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Only visible to you on your personal command dashboard.</p>
                    </div>
                  </div>

                  {/* Public Card */}
                  <div 
                    onClick={() => setFormData(prev => ({ ...prev, visibility: 'Public' }))}
                    className={`cursor-pointer rounded-2xl border p-4.5 transition-all duration-300 flex items-start gap-3.5 relative overflow-hidden ${
                      formData.visibility === 'Public'
                        ? isDark
                          ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/20'
                          : 'border-blue-500 bg-blue-50/40 shadow-sm'
                        : isDark
                          ? 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-400'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      formData.visibility === 'Public'
                        ? 'bg-blue-500/10 text-blue-500'
                        : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${formData.visibility === 'Public' ? (isDark ? 'text-blue-400' : 'text-blue-800') : ''}`}>Public Dream</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Share your milestones and inspire peers on the Explore Feed.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Milestones Planner Section */}
              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Interactive Timeline Milestones</label>
                
                {/* Milestone additions list */}
                {milestones.length > 0 && (
                  <div className="space-y-3 relative pl-6 py-1">
                    {/* Visual timeline connection path */}
                    <div className={`absolute left-2.5 top-3 bottom-3 w-[1.5px] ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    
                    {milestones.map((milestone, idx) => (
                      <div key={idx} className="relative flex items-center justify-between gap-4 group/item">
                        {/* Timeline Node dot */}
                        <div className={`absolute -left-[20px] w-3 h-3 rounded-full border-2 ${
                          isDark ? 'border-indigo-500 bg-slate-950' : 'border-indigo-600 bg-white'
                        }`} />
                        
                        <span className={`text-xs font-medium truncate flex-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{milestone}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="opacity-0 group-hover/item:opacity-100 p-1 text-rose-500 hover:bg-rose-500/10 rounded transition"
                          title="Remove milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Milestone Text Field input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMilestoneText}
                    onChange={(e) => setNewMilestoneText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMilestone())}
                    placeholder="Describe a key milestone..."
                    className={`flex-1 px-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                      isDark 
                        ? 'bg-white/5 border-white/5 text-slate-200 placeholder-slate-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className={`px-4 py-2 text-xs rounded-xl font-bold flex items-center gap-1 transition ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                    Add Checkpoint
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                
                {/* Create Goal Primary CTA */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-600/15 text-white rounded-2xl font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading Dream...
                    </>
                  ) : (
                    <>
                      <Check className="w-4.5 h-4.5" />
                      Create Life Goal
                    </>
                  )}
                </motion.button>

                {/* AI Suggestions Sparkles Button */}
                <button
                  type="button"
                  onClick={generateAIPlan}
                  disabled={aiLoading}
                  className={`px-6 py-3.5 border rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/5 text-indigo-400' 
                      : 'border-indigo-500 hover:bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {aiLoading ? (
                    <>
                      <Loader className="w-4.5 h-4.5 animate-spin text-purple-500" />
                      Planning roadmap...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 text-purple-500 animate-pulse" />
                      {formData.title ? 'Refine with AI Coach' : 'Get AI Suggestions'}
                    </>
                  )}
                </button>
              </div>

            </form>
          </main>

          {/* RIGHT SIDE: LIVE GOAL PREVIEW & PREMIUM WIDGETS */}
          <aside className="lg:col-span-5 space-y-6">
            
            {/* 1. LIVE GOAL PREVIEW CARD */}
            <div className={`rounded-[32px] border p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${
              isDark ? 'border-white/5 bg-slate-900/35 backdrop-blur-xl' : 'border-slate-200 bg-white'
            }`}>
              {/* Category Graphic vision board background container */}
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-r opacity-20 pointer-events-none" />
              <div className={`h-24 rounded-2xl bg-gradient-to-br ${selectedCategoryData.color} flex items-center justify-between px-6 shadow-inner relative overflow-hidden`}>
                <div className="space-y-1 relative z-10 text-white">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
                    {formData.category}
                  </span>
                  <p className="text-xs italic font-medium opacity-80">{selectedCategoryData.desc}</p>
                </div>
                {(() => {
                  const PreviewIcon = selectedCategoryData.icon
                  return (
                    <PreviewIcon className="w-12 h-12 opacity-30 select-none transform rotate-12 relative z-10 text-white" />
                  )
                })()}
                
                {/* Visual mesh design inside vision card */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
              </div>

              {/* Card Details */}
              <div className="space-y-5 pt-6">
                
                <div className="space-y-2">
                  <h3 className={`text-xl font-bold tracking-tight truncate ${
                    formData.title ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-500 italic'
                  }`}>
                    {formData.title || 'Untitled Life Goal'}
                  </h3>
                  <p className={`text-xs line-clamp-2 ${
                    formData.description ? (isDark ? 'text-slate-400' : 'text-slate-600') : 'text-slate-500 italic'
                  }`}>
                    {formData.description || 'No description configured yet.'}
                  </p>
                </div>

                {/* Metadata chips */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide">
                  {formData.targetDate && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border ${
                      isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {new Date(formData.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  {formData.budget && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border ${
                      isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      ₹{parseFloat(formData.budget).toLocaleString()}
                    </span>
                  )}
                  {formData.location && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border ${
                      isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {formData.location}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border ${
                    formData.visibility === 'Public' 
                      ? (isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-blue-50 border-blue-200 text-blue-700')
                      : (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                  }`}>
                    {formData.visibility === 'Public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {formData.visibility}
                  </span>
                </div>

                {/* Progress Timeline Tracker Component */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    <span>Timeline Phase</span>
                    <span className="text-indigo-400">Step 1 of 3</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-bold">
                    <div className="py-1.5 rounded-lg bg-indigo-600 text-white shadow-md">Planning</div>
                    <div className={`py-1.5 rounded-lg border ${isDark ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>Execution</div>
                    <div className={`py-1.5 rounded-lg border ${isDark ? 'bg-white/5 border-white/5 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>Completion</div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. DREAM SCORE & SUCCESS PREDICTION */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Dream Score Widget */}
              <div className={`rounded-3xl border p-5 text-center space-y-3 shadow-lg ${
                isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
              }`}>
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="5.5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      className="stroke-violet-500" 
                      strokeWidth="5.5" 
                      fill="transparent" 
                      strokeDasharray="163.3" 
                      strokeDashoffset={163.3 - (163.3 * dreamScore) / 100} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className={`absolute text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{dreamScore}</span>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dream Score</p>
                  <p className={`text-[8.5px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Calculates readiness of goal variables</p>
                </div>
              </div>

              {/* Goal Success Prediction */}
              <div className={`rounded-3xl border p-5 text-center space-y-3 shadow-lg ${
                isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
              }`}>
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="5.5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      className="stroke-cyan-400" 
                      strokeWidth="5.5" 
                      fill="transparent" 
                      strokeDasharray="163.3" 
                      strokeDashoffset={163.3 - (163.3 * successPrediction) / 100} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute text-xs font-black text-cyan-400">{successPrediction}%</span>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Success Chance</p>
                  <p className={`text-[8.5px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Based on milestones and difficulty</p>
                </div>
              </div>

            </div>

            {/* 3. SMART SUGGESTIONS PANEL */}
            <div className={`rounded-3xl border p-5 space-y-3.5 shadow-lg ${
              isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white'
            }`}>
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-400">
                <Lightbulb className="w-4 h-4 text-amber-500 animate-pulse" />
                Coach Suggestions
              </h4>
              
              <div className="space-y-2">
                {selectedCategoryData.smartSuggestions.map((sug, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (!milestones.includes(sug)) {
                        setMilestones(prev => [...prev, sug])
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-[11px] font-medium transition cursor-pointer flex items-center justify-between gap-3 group ${
                      isDark 
                        ? 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 text-slate-200' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-500/20 text-slate-700'
                    }`}
                  >
                    <span>{sug}</span>
                    <PlusCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. DAILY MOTIVATIONAL QUOTE */}
            <div className={`p-4 rounded-3xl border text-center shadow-lg transition duration-300 ${
              isDark ? 'bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <p className="text-xs italic">"Your future self will thank you for the milestones you map out today."</p>
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-indigo-500 mt-1.5 block">— Life Architect</span>
            </div>

          </aside>

        </div>
      </div>

      {/* ===== AI RECOMMENDATIONS MODAL ===== */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className={`rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border backdrop-blur-2xl ${
                isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              
              {/* Header */}
              <div className={`sticky top-0 flex items-center justify-between p-6 border-b z-20 backdrop-blur-lg ${
                isDark ? 'bg-slate-900/90 border-white/5' : 'bg-white/90 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-500 animate-spin" style={{ animationDuration: '4s' }} />
                  <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    AI Goal Recommendations
                  </h2>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                
                {aiError && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-xs font-semibold">{aiError}</p>
                  </div>
                )}

                {aiRecommendations.length === 0 && !aiError && (
                  <div className="text-center py-12">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Connecting to AI engine...</p>
                  </div>
                )}

                {aiRecommendations.map((rec, i) => {
                  // Badges: Best Match, Fastest Path, Recommended
                  const badgeText = i === 0 ? 'Best Match' : i === 1 ? 'Fastest Path' : 'Recommended'
                  const badgeColors = i === 0 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : i === 1 
                      ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' 
                      : 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
                  
                  // Score simulation: 94, 88, 82
                  const mockScore = 95 - (i * 6)
                  
                  return (
                    <div
                      key={i}
                      className={`p-6 rounded-3xl border-2 transition-all relative group shadow-sm ${
                        isDark 
                          ? 'bg-slate-900/30 border-white/5 hover:border-purple-500/40 hover:bg-white/5' 
                          : 'bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${badgeColors}`}>
                          {badgeText}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Goal Score:</span>
                          <span className="text-xs font-extrabold text-purple-400">{mockScore} / 100</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {rec.title}
                        </h3>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {rec.why}
                        </p>
                      </div>

                      {/* Timeline & Budget */}
                      <div className="grid grid-cols-3 gap-4 my-4 py-3 border-y border-slate-100 dark:border-white/5 text-[11px] font-bold">
                        <div>
                          <p className={`text-[9px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Timeline</p>
                          <p className={`mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{rec.timeframe}</p>
                        </div>
                        {rec.estimatedBudget && (
                          <div>
                            <p className={`text-[9px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Est. Budget</p>
                            <p className={`mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{rec.estimatedBudget}</p>
                          </div>
                        )}
                        <div>
                          <p className={`text-[9px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Likelihood</p>
                          <p className="mt-0.5 text-emerald-500">High (85%+)</p>
                        </div>
                      </div>

                      {/* Milestones list */}
                      {rec.milestones && rec.milestones.length > 0 && (
                        <div className="space-y-2.5">
                          <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                            Suggested Milestones Checkpoints:
                          </p>
                          <ul className="space-y-2 pl-1">
                            {rec.milestones.map((m, j) => (
                              <li key={j} className={`text-xs flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                <span className="truncate">{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Select Button CTA */}
                      <button
                        onClick={() => applyAIRecommendation(rec)}
                        className="w-full mt-5 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-xs hover:shadow-lg transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Apply Recommendations Blueprint
                      </button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
