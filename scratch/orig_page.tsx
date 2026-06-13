'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Wallet, TrendingUp, Sparkles, Plus, Landmark, Scale, 
  Coins, PiggyBank, Award, MessageSquare, Flame, Loader2, RefreshCw, 
  Calculator, Percent, ShieldCheck, HelpCircle, ChevronRight, AlertTriangle,
  ArrowUpRight, DollarSign, Briefcase, Compass, BookOpen, Activity, Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../theme-provider'

// Available currencies for travel goals
const CURRENCIES = [
  { code: 'INR', symbol: '₹', rate: 1 },
  { code: 'USD', symbol: '$', rate: 83.5 },
  { code: 'JPY', symbol: '¥', rate: 0.53 },
  { code: 'EUR', symbol: '€', rate: 89.8 },
  { code: 'THB', symbol: '฿', rate: 2.27 }
]

export default function FinancePlannerPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Core Authentication & Loading States
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [profile, setProfile] = useState<any>({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalSavings: 0,
    savingsStreak: 0,
    badges: ''
  })
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form States
  const [isLoggingTx, setIsLoggingTx] = useState(false)
  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState('SAVINGS')
  const [txNotes, setTxNotes] = useState('')
  const [txGoalId, setTxGoalId] = useState('')
  
  // Profile settings state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [tempIncome, setTempIncome] = useState('')
  const [tempExpenses, setTempExpenses] = useState('')

  // Simulator & Calculators States
  const [simExtraSavings, setSimExtraSavings] = useState(0)
  const [simDelayMonths, setSimDelayMonths] = useState(0)
  const [inflationRate, setInflationRate] = useState(5) // % per year
  const [targetInflationYears, setTargetInflationYears] = useState(3)
  const [fromCurrency, setFromCurrency] = useState('INR')
  const [toCurrency, setToCurrency] = useState('USD')
  const [convertAmount, setConvertAmount] = useState('1000')

  // AI Assistant Chat States
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I am your MyBuko AI Financial Coach. Ask me how to fund your dreams, optimize your saving rate, or find cheaper alternatives!' }
  ])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [selectedGoalForAI, setSelectedGoalForAI] = useState<string>('')
  const [optimizationResult, setOptimizationResult] = useState<string>('')
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Scroll ref for chat
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Fetch authentication & data
  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!userData || !token) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchData(token)
  }, [])

  const fetchData = async (token: string) => {
    setIsLoading(true)
    try {
      // Fetch user's goals
      const goalsRes = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData)
        if (goalsData.length > 0) {
          setSelectedGoalForAI(goalsData[0].id)
        }
      }

      // Fetch user's finance profile & transactions
      const financeRes = await fetch('/api/finance', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (financeRes.ok) {
        const financeData = await financeRes.json()
        if (financeData.profile) {
          setProfile(financeData.profile)
          setTempIncome(String(financeData.profile.monthlyIncome))
          setTempExpenses(String(financeData.profile.monthlyExpenses))
        }
        setTransactions(financeData.transactions || [])
      }
    } catch (err) {
      console.error('Error fetching finance planner data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle logging a transaction
  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAmount || isNaN(parseFloat(txAmount))) return

    setIsLoggingTx(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(txAmount),
          type: txType,
          notes: txNotes,
          goalId: txType === 'CONTRIBUTION' ? txGoalId : undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setTransactions(prev => [data.transaction, ...prev])
        setTxAmount('')
        setTxNotes('')
        setTxGoalId('')
        
        // Refresh goals to show new saved amounts
        const goalsRes = await fetch('/api/goals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (goalsRes.ok) {
          setGoals(await goalsRes.json())
        }
      }
    } catch (err) {
      console.error('Error logging transaction:', err)
    } finally {
      setIsLoggingTx(false)
    }
  }

  // Handle updating income and expenses settings
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditingProfile(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monthlyIncome: parseFloat(tempIncome) || 0,
          monthlyExpenses: parseFloat(tempExpenses) || 0
        })
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setIsEditingProfile(false)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
    }
  }

  // Handle AI Coach Chatbot Query
  const handleSendMessage = async (e?: React.FormEvent, presetMessage?: string) => {
    if (e) e.preventDefault()
    const textToSend = presetMessage || chatInput
    if (!textToSend.trim() || isChatLoading) return

    const newMessages = [...chatMessages, { role: 'user', content: textToSend }]
    setChatMessages(newMessages)
    setChatInput('')
    setIsChatLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/ai/finance-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: newMessages,
          mode: 'coach',
          goalContext: goals.map(g => ({
            title: g.title,
            budget: g.budget,
            estimatedCost: g.estimatedCost,
            amountSaved: g.amountSaved,
            targetDate: g.targetDate,
            category: g.category
          }))
        })
      })

      if (res.ok) {
        const data = await res.json()
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        throw new Error('AI Coach response failed')
      }
    } catch (err) {
      console.error('AI coach chat failed:', err)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I had trouble connecting to the network. Try saving ₹1,000 extra per month to secure your financial buffer!' 
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  // Handle AI Goal Optimizer Recommendations
  const handleOptimizeGoal = async () => {
    const targetGoal = goals.find(g => g.id === selectedGoalForAI)
    if (!targetGoal || isOptimizing) return

    setIsOptimizing(true)
    setOptimizationResult('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/ai/finance-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mode: 'optimize',
          goalContext: {
            title: targetGoal.title,
            budget: targetGoal.budget,
            estimatedCost: targetGoal.estimatedCost || (targetGoal.budget ? targetGoal.budget * 1.3 : 150000),
            amountSaved: targetGoal.amountSaved,
            targetDate: targetGoal.targetDate,
            category: targetGoal.category
          }
        })
      })

      if (res.ok) {
        const data = await res.json()
        setOptimizationResult(data.reply)
      } else {
        throw new Error('Optimizer failed')
      }
    } catch (err) {
      console.error('Goal optimization failed:', err)
      setOptimizationResult('Failed to load optimizations. Please check back shortly.')
    } finally {
      setIsOptimizing(false)
    }
  }

  // Trigger optimization on first load or selection change
  useEffect(() => {
    if (goals.length > 0 && selectedGoalForAI) {
      handleOptimizeGoal()
    }
  }, [selectedGoalForAI, goals])

  // Calculation Metrics:
  const totalDreamCost = goals.reduce((sum, g) => sum + (g.budget || g.estimatedCost || 0), 0)
  const totalSaved = goals.reduce((sum, g) => sum + (g.amountSaved || 0), 0)
  const remainingAmount = Math.max(0, totalDreamCost - totalSaved)
  const completionPercentage = totalDreamCost > 0 ? Math.round((totalSaved / totalDreamCost) * 100) : 0

  // Calculate Affordability Score
  const affordabilityScore = (() => {
    if (goals.length === 0) return 100
    // Factors: (income - expenses) relative to remaining amount & monthly target
    const monthlySurplus = Math.max(0, profile.monthlyIncome - profile.monthlyExpenses)
    if (monthlySurplus === 0) return 20 // Risky
    
    // Average months remaining across active goals
    const monthsRemaining = goals.reduce((acc, g) => {
      if (!g.targetDate) return acc + 12
      const months = (new Date(g.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)
      return acc + Math.max(1, Math.round(months))
    }, 0) / goals.length

    const requiredMonthlySavings = remainingAmount / Math.max(1, monthsRemaining)
    const ratio = monthlySurplus / requiredMonthlySavings

    if (ratio >= 1.5) return 90 // Excellent
    if (ratio >= 1.0) return 75 // Good
    if (ratio >= 0.5) return 50 // Moderate
    return 30 // Risky
  })()

  const getAffordabilityLabel = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
    if (score >= 70) return { text: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }
    if (score >= 45) return { text: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    return { text: 'Risky', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  }

  const affordability = getAffordabilityLabel(affordabilityScore)

  // Savings Trend Coordinates (Line Chart)
  const lineChartPoints = (() => {
    if (transactions.length === 0) {
      return { coords: '0,50 100,50 200,50', path: 'M 0 50 L 100 50 L 200 50' }
    }
    // Aggregate contributions by week or sequence
    const dataPoints = transactions
      .filter(tx => tx.type === 'SAVINGS' || tx.type === 'CONTRIBUTION')
      .slice(0, 7)
      .reverse()
      .map((tx, idx) => ({ idx, amount: tx.amount }))

    if (dataPoints.length < 2) {
      return { coords: '0,90 300,10', path: 'M 0 90 L 300 10' }
    }

    const maxVal = Math.max(...dataPoints.map(d => d.amount), 5000)
    const coords = dataPoints.map((d, i) => {
      const x = (i * 300) / (dataPoints.length - 1)
      const y = 90 - (d.amount / maxVal) * 80
      return { x, y }
    })
    const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
    const fillPath = `${path} L 300 100 L 0 100 Z`

    return { coords, path, fillPath }
  })()

  // Inflation calculations
  const futureCost = totalDreamCost * Math.pow(1 + (inflationRate / 100), targetInflationYears)

  // Currency Converter calculation
  const convertedResult = (() => {
    const amt = parseFloat(convertAmount) || 0
    const fromVal = CURRENCIES.find(c => c.code === fromCurrency)?.rate || 1
    const toVal = CURRENCIES.find(c => c.code === toCurrency)?.rate || 1
    return ((amt * fromVal) / toVal).toFixed(2)
  })()

  // Badges calculations
  const unlockedBadges = profile.badges ? profile.badges.split(',').map((b: string) => b.trim()).filter((b: string) => b) : []

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Subtle Noise Texture Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-[0.02] ${isDark ? 'bg-[radial-gradient(#ffffff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000000_1px,transparent_1px)]'} [background-size:16px_16px] z-10`} />

      {/* Atmospheric Background Aurora Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/5'} rounded-full blur-[140px] animate-pulse`} style={{ animationDuration: '9s' }} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-emerald-600/10' : 'bg-emerald-400/5'} rounded-full blur-[140px] animate-pulse`} style={{ animationDuration: '13s' }} />
        <div className={`absolute top-[35%] right-[15%] w-[40%] h-[40%] ${isDark ? 'bg-violet-500/5' : 'bg-violet-400/5'} rounded-full blur-[110px] animate-pulse`} style={{ animationDuration: '11s' }} />
      </div>

      {/* Navigation Header */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${isDark ? 'border-white/5 bg-[#030712]/75' : 'border-slate-200 bg-white/75'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Command
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-emerald-400">Finance Planner Active</span>
            </div>
          </div>
        </div>
      </nav>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="mt-4 text-xs font-semibold text-slate-400">Synchronizing ledger and currency tables...</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
          
          {/* Header Banner */}
          <div className={`relative rounded-[32px] overflow-hidden border p-8 shadow-2xl ${
            isDark ? 'border-white/10 bg-slate-900/40 backdrop-blur-2xl' : 'border-slate-200 bg-white'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-bold bg-emerald-500/10 border-emerald-500/20 text-emerald-400 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Premium Dream Finance Planner
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">Dream Finance Planner</h1>
                <p className="text-slate-400 text-sm mt-1">Turn your dreams into achievable, optimized financial blueprints.</p>
              </div>

              {/* Monthly Income / Expense settings */}
              <div className={`rounded-2xl border p-4 backdrop-blur-md ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Income (₹)</label>
                        <input
                          type="number"
                          value={tempIncome}
                          onChange={(e) => setTempIncome(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-950/30 border-white/10 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Expenses (₹)</label>
                        <input
                          type="number"
                          value={tempExpenses}
                          onChange={(e) => setTempExpenses(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-950/30 border-white/10 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">Save</button>
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between gap-8">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Surplus</span>
                        <p className="text-base font-black text-emerald-400">₹{(profile.monthlyIncome - profile.monthlyExpenses).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 self-start"
                      >
                        Adjust Setup
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Income: ₹{profile.monthlyIncome.toLocaleString()} | Expenses: ₹{profile.monthlyExpenses.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid Layout: Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: VISUALIZATIONS & LOGS (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Main Wallet and Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Large Progress Ring Card */}
                <div className={`md:col-span-2 rounded-[28px] border p-6 flex flex-col md:flex-row items-center gap-6 ${
                  isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="10" fill="transparent" />
                      <motion.circle 
                        cx="64" 
                        cy="64" 
                        r="54" 
                        className="stroke-emerald-400" 
                        strokeWidth="10" 
                        fill="transparent" 
                        strokeDasharray="339.3"
                        initial={{ strokeDashoffset: 339.3 }}
                        animate={{ strokeDashoffset: 339.3 - (339.3 * completionPercentage) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black">{completionPercentage}%</span>
                      <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Funded</span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1">
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Financial Checkpoints Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold">Total Dream Cost</p>
                        <p className="text-xl font-black">₹{totalDreamCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-400 font-bold">Total Saved</p>
                        <p className="text-xl font-black text-emerald-400">₹{totalSaved.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-2.5">
                      <p className="text-[10px] text-slate-400 font-medium">
                        Remaining Amount needed: <span className="text-indigo-400 font-bold">₹{remainingAmount.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Affordability Gauge & Savings Streak */}
                <div className={`rounded-[28px] border p-6 flex flex-col justify-between space-y-4 ${
                  isDark ? 'border-white/5 bg-slate-900/20 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Affordability Score</span>
                      <p className="text-2xl font-black mt-1">{affordabilityScore}/100</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${affordability.bg} ${affordability.color} border ${affordability.border}`}>
                      {affordability.text}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950/45 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        affordabilityScore >= 80 ? 'bg-emerald-400' : affordabilityScore >= 50 ? 'bg-yellow-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${affordabilityScore}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse fill-orange-500" />
                      Saving Streak
                    </span>
                    <span className="text-xs font-bold">{profile.savingsStreak} {profile.savingsStreak === 1 ? 'Month' : 'Months'}</span>
                  </div>
                </div>

              </div>

              {/* Goal-Level Budget Cards */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-indigo-400" />
                    Goal-Level Budgets
                  </h3>
                  <span className="text-[10px] text-slate-400">{goals.length} Dreams Configured</span>
                </div>

                {goals.length === 0 ? (
                  <div className={`rounded-2xl border p-8 text-center ${isDark ? 'border-white/5 bg-slate-900/10' : 'border-slate-200 bg-white'}`}>
                    <p className="text-xs text-slate-400">No active dreams found. Please go back and add your first dream to generate financial checkpoints!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal) => {
                      const cost = goal.budget || goal.estimatedCost || 10000;
                      const saved = goal.amountSaved || 0;
                      const pct = Math.min(100, Math.round((saved / cost) * 100));
                      
                      // Calculate monthly savings needed
                      const monthsRemaining = goal.targetDate 
                        ? Math.max(1, Math.round((new Date(goal.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)))
                        : 12;
                      const monthlySavingsNeeded = Math.round(Math.max(0, cost - saved) / monthsRemaining);

                      // Determine category visual styles
                      const catColors = goal.category === 'Travel' ? 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/10'
                        : goal.category === 'Skills' ? 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/10'
                        : goal.category === 'Health' ? 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/10'
                        : goal.category === 'Adventure' ? 'from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/10'
                        : 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/10';

                      return (
                        <div key={goal.id} className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition duration-300 ${
                          isDark ? 'border-white/5 bg-slate-900/10' : 'border-slate-200 bg-white shadow-sm'
                        }`}>
                          <div className="flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 border rounded bg-gradient-to-r ${catColors}`}>
                                {goal.category}
                              </span>
                              <h4 className="font-bold text-sm truncate mt-2">{goal.title}</h4>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black">{pct}%</span>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">Funded</p>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="w-full bg-slate-950/40 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Saved: ₹{saved.toLocaleString()}</span>
                              <span>Cost: ₹{cost.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                            <div>
                              <p className="uppercase text-[9px] font-bold">Monthly Needed</p>
                              <p className="font-bold text-slate-200">₹{monthlySavingsNeeded.toLocaleString()}/mo</p>
                            </div>
                            <div className="text-right">
                              <p className="uppercase text-[9px] font-bold">Timeline</p>
                              <p className="font-bold">{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Flexible'}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Log Transaction & Wallet Allocations */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Log Transaction Form */}
                <div className={`md:col-span-7 rounded-3xl border p-6 space-y-4 ${
                  isDark ? 'border-white/5 bg-slate-900/10' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Log Savings Contribution
                  </h3>

                  <form onSubmit={handleLogTransaction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Amount (₹)</label>
                        <input
                          type="number"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          required
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ${
                            isDark ? 'bg-slate-950/40 border-white/10 text-white' : 'bg-slate-100 border-slate-250'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Type</label>
                        <select
                          value={txType}
                          onChange={(e) => setTxType(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                            isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-100 border-slate-250'
                          }`}
                        >
                          <option value="SAVINGS">General Wallet Savings</option>
                          <option value="CONTRIBUTION">Specific Dream Contribution</option>
                          <option value="EXPENSE">Expense Withdrawal</option>
                        </select>
                      </div>
                    </div>

                    {txType === 'CONTRIBUTION' && (
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Select Target Dream</label>
                        <select
                          value={txGoalId}
                          onChange={(e) => setTxGoalId(e.target.value)}
                          required
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                            isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-100 border-slate-250'
                          }`}
                        >
                          <option value="">-- Choose Goal --</option>
                          {goals.map(g => (
                            <option key={g.id} value={g.id}>{g.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Notes / Details (Optional)</label>
                      <input
                        type="text"
                        value={txNotes}
                        onChange={(e) => setTxNotes(e.target.value)}
                        placeholder="e.g. Salary bonus allocation, flight booking buffer"
                        className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                          isDark ? 'bg-slate-950/40 border-white/10' : 'bg-slate-100 border-slate-250'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingTx}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/10"
                    >
                      {isLoggingTx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Log and Allocate Funds'}
                    </button>
                  </form>
                </div>

                {/* Dream Wallet allocations & Badges */}
                <div className={`md:col-span-5 flex flex-col justify-between space-y-4 p-6 rounded-3xl border ${
                  isDark ? 'border-white/5 bg-slate-900/10' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <div>
                    <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-violet-400" />
                      Dream Wallet
                    </h3>

                    <div className="mt-4 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Total Wallet Balance</span>
                      <p className="text-2xl font-black text-indigo-400">₹{profile.totalSavings.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Achievements Badge showcase */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Unlocked Badges</span>
                    <div className="flex flex-wrap gap-2">
                      {['First Saver', 'Budget Master', 'Dream Investor', 'Finance Planner', 'Goal Funded'].map((badgeName) => {
                        const isUnlocked = unlockedBadges.includes(badgeName)
                        return (
                          <div 
                            key={badgeName} 
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition duration-300 flex items-center gap-1.5 ${
                              isUnlocked 
                                ? 'bg-violet-500/15 border-violet-500/30 text-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.15)]' 
                                : 'bg-slate-950/20 border-white/5 text-slate-600'
                            }`}
                          >
                            <Award className={`w-3 h-3 ${isUnlocked ? 'text-violet-400 animate-bounce' : 'text-slate-600'}`} />
                            {badgeName}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* SVG Charts: Savings Trends & Goal Allocation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Savings trend (Line Chart) */}
                <div className={`rounded-3xl border p-6 space-y-4 ${
                  isDark ? 'border-white/5 bg-slate-900/10' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Savings Logs Trend
                  </h4>

                  <div className="w-full h-32 relative">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity="0.2"/>
                          <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="300" y2="20" className="stroke-white/5" strokeWidth="0.5" />
                      <line x1="0" y1="50" x2="300" y2="50" className="stroke-white/5" strokeWidth="0.5" />
                      <line x1="0" y1="80" x2="300" y2="80" className="stroke-white/5" strokeWidth="0.5" />

                      {/* Area Fill */}
                      {lineChartPoints.fillPath && (
                        <path d={lineChartPoints.fillPath} fill="url(#chartGlow)" />
                      )}

                      {/* Stroke Line */}
                      <path 
                        d={lineChartPoints.path} 
                        fill="none" 
                        className="stroke-emerald-400" 
                        strokeWidth="2" 
                        strokeLinecap="round"
                      />

                      {/* Data Dots */}
                      {Array.isArray(lineChartPoints.coords) && lineChartPoints.coords.map((c, i) => (
                        <circle key={i} cx={c.x} cy={c.y} r="3" className="fill-emerald-400 stroke-[#030712]" strokeWidth="1.5" />
                      ))}
                    </svg>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase">
                    <span>Recent Logs</span>
                    <span>Current</span>
                  </div>
                </div>

                {/* Goal cost comparison (Bar Chart) */}
                <div className={`rounded-3xl border p-6 space-y-4 ${
                  isDark ? 'border-white/5 bg-slate-900/10' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-violet-400" />
                    Goal Cost Comparison
                  </h4>

                  {goals.length === 0 ? (
                    <div className="h-32 flex items-center justify-center">
                      <p className="text-[10px] text-slate-500 italic">No goals to compare</p>
                    </div>
                  ) : (
                    <div className="w-full h-32 flex items-end gap-3 justify-center">
                      {goals.slice(0, 5).map((goal) => {
                        const cost = goal.budget || goal.estimatedCost || 10000
                        const maxCost = Math.max(...goals.map(g => g.budget || g.estimatedCost || 10000), 50000)
                        const barHeight = Math.max(10, Math.round((cost / maxCost) * 100))
                        
                        return (
                          <div key={goal.id} className="flex-1 flex flex-col items-center gap-2 max-w-[40px]">
                            <span className="text-[8px] font-bold text-slate-400 truncate w-full text-center">
                              ₹{(cost / 1000).toFixed(0)}k
                            </span>
                            <div className="w-full bg-slate-950/45 rounded-md h-20 relative overflow-hidden flex items-end">
                              <motion.div 
                                className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-md"
                                initial={{ height: 0 }}
                                animate={{ height: `${barHeight}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                            <span className="text-[8px] text-slate-500 truncate w-full text-center font-semibold">
                              {goal.title}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Transactions log table */}
              <div className={`rounded-3xl border p-6 space-y-4 ${
                isDark ? 'border-white/5 bg-slate-900/10' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Recent Contribution History</h4>
                
                {transactions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No transaction logs recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-400">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-slate-400">
                          <th className="py-2.5">Date</th>
                          <th>Type</th>
                          <th>Details</th>
                          <th className="text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.slice(0, 5).map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 text-[10px]">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                tx.type === 'CONTRIBUTION' ? 'bg-indigo-500/10 text-indigo-400' 
                                : tx.type === 'SAVINGS' ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td>{tx.notes || 'Allocated to Wallet'}</td>
                            <td className={`text-right font-bold ${tx.type === 'EXPENSE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {tx.type === 'EXPENSE' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: SIMULATORS, CONVERTER & AI COACH (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* 1. What-If Budget Simulator */}
              <div className={`rounded-3xl border p-6 space-y-5 ${
                isDark ? 'border-white/5 bg-slate-900/15 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                  <Calculator className="w-4.5 h-4.5 text-indigo-400" />
                  What-If Budget Simulator
                </h3>

                <div className="space-y-4">
                  {/* Slider 1: Extra monthly savings */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Extra Monthly Savings</span>
                      <span className="text-emerald-400">+₹{simExtraSavings.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="25000" 
                      step="500" 
                      value={simExtraSavings}
                      onChange={(e) => setSimExtraSavings(parseInt(e.target.value))}
                      className="w-full accent-emerald-400 bg-slate-950/40"
                    />
                  </div>

                  {/* Slider 2: Delay goals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Postpone Goals By</span>
                      <span className="text-indigo-400">{simDelayMonths} Months</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="12" 
                      step="1" 
                      value={simDelayMonths}
                      onChange={(e) => setSimDelayMonths(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-950/40"
                    />
                  </div>
                </div>

                {/* Simulated Results calculation */}
                {(() => {
                  const surplus = Math.max(0, profile.monthlyIncome - profile.monthlyExpenses) + simExtraSavings
                  const currentMonthsToComplete = surplus > 0 ? remainingAmount / surplus : 36
                  const simulatedMonths = Math.max(0, currentMonthsToComplete - simDelayMonths)
                  
                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-950/35 border border-white/5 space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Projected Savings Rate:</span>
                        <span className="font-bold text-slate-200">₹{surplus.toLocaleString()}/mo</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Projected Completion:</span>
                        <span className="font-bold text-emerald-400">
                          {simulatedMonths <= 0 ? 'Immediately' : `${simulatedMonths.toFixed(1)} months`}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 italic mt-1 text-center">
                        "Increasing monthly contributions and extending timelines reduces risk index by 40%."
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* 2. Inflation Adjustment & Currency Converter */}
              <div className={`rounded-3xl border p-6 space-y-5 ${
                isDark ? 'border-white/5 bg-slate-900/15 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                  <Coins className="w-4.5 h-4.5 text-emerald-400" />
                  Inflation & Currency Tools
                </h3>

                {/* Inflation Calculator */}
                <div className="space-y-3 pb-4 border-b border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Inflation Adjustment</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] text-slate-500">Rate ({inflationRate}%)</label>
                      <input 
                        type="number" 
                        value={inflationRate} 
                        onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)} 
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-950/20 border-white/5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500">Years</label>
                      <input 
                        type="number" 
                        value={targetInflationYears} 
                        onChange={(e) => setTargetInflationYears(parseInt(e.target.value) || 0)} 
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-slate-950/20 border-white/5 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-950/30 p-2 rounded-xl">
                    <span>Future Inflation Cost:</span>
                    <span className="font-bold text-rose-400">₹{Math.round(futureCost).toLocaleString()}</span>
                  </div>
                </div>

                {/* Currency Converter */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Travel Exchange Rate</span>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <input 
                      type="number" 
                      value={convertAmount} 
                      onChange={(e) => setConvertAmount(e.target.value)} 
                      className="w-full text-xs px-2 py-1.5 rounded-lg border bg-slate-950/20 border-white/5 focus:outline-none"
                    />
                    <select 
                      value={fromCurrency} 
                      onChange={(e) => setFromCurrency(e.target.value)} 
                      className="text-[10px] bg-slate-950/40 text-white rounded-lg border border-white/5 p-1 focus:outline-none"
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                    <select 
                      value={toCurrency} 
                      onChange={(e) => setToCurrency(e.target.value)} 
                      className="text-[10px] bg-slate-950/40 text-white rounded-lg border border-white/5 p-1 focus:outline-none"
                    >
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-950/30 p-2 rounded-xl">
                    <span>Converted Amount:</span>
                    <span className="font-bold text-emerald-400">
                      {CURRENCIES.find(c => c.code === toCurrency)?.symbol} {convertedResult}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. AI Cost Estimation & Budget Optimizer */}
              <div className={`rounded-3xl border p-6 space-y-4 ${
                isDark ? 'border-white/5 bg-slate-900/15 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                    <Scale className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                    AI Cost Optimizer
                  </h3>
                  
                  {goals.length > 0 && (
                    <select 
                      value={selectedGoalForAI} 
                      onChange={(e) => setSelectedGoalForAI(e.target.value)}
                      className="text-[10px] bg-slate-950/40 border border-white/5 rounded-lg p-1 text-white max-w-[120px] focus:outline-none"
                    >
                      {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>
                  )}
                </div>

                {goals.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center">Add dreams to see AI optimizations</p>
                ) : (
                  <div className="space-y-4">
                    {/* Estimated Cost comparison banner */}
                    {(() => {
                      const tg = goals.find(g => g.id === selectedGoalForAI)
                      if (!tg) return null
                      const est = tg.estimatedCost || (tg.budget ? tg.budget * 1.3 : 150000)
                      const bud = tg.budget || est * 0.7
                      const diff = est - bud
                      const isLower = bud < est
                      const pctLower = Math.round((diff / est) * 100)

                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/30 p-3 rounded-2xl">
                            <div>
                              <span className="text-slate-400">AI Estimated:</span>
                              <p className="font-bold text-slate-200">₹{est.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Your Budget:</span>
                              <p className="font-bold text-slate-200">₹{bud.toLocaleString()}</p>
                            </div>
                          </div>

                          {isLower && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div className="text-[10px] text-rose-300">
                                <span className="font-bold">Budget Shortfall: ₹{diff.toLocaleString()}</span>
                                <p className="mt-0.5 opacity-90">Your current budget is {pctLower}% lower than MyBuko's AI estimate.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Optimization suggestions list */}
                    <div className="space-y-2 text-xs border-t border-white/5 pt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400">AI Optimization Alternatives</span>
                      {isOptimizing ? (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          <span className="text-[10px] text-slate-400">Scanning cheaper travel nodes...</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line bg-slate-950/20 p-3 rounded-2xl scrollbar-hide border border-white/5">
                          {optimizationResult || 'Alternative itineraries loaded.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. AI Financial Coach Conversations chatbot */}
              <div className={`rounded-3xl border p-6 flex flex-col justify-between h-[380px] ${
                isDark ? 'border-white/5 bg-slate-900/15 backdrop-blur-xl' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
                    AI Financial Coach
                  </h3>
                  <span className="text-[9px] text-slate-500">Real-time answers driven by Llama-3.1 AI</span>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[200px] scrollbar-hide">
                  {chatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-[10px] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-slate-950/40 text-slate-300 border border-white/5 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-950/40 border border-white/5 rounded-2xl rounded-tl-none px-3 py-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                        Coach is thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Preset Fast Queries */}
                <div className="flex gap-1.5 flex-wrap py-2 border-t border-white/5">
                  <button 
                    onClick={() => handleSendMessage(undefined, 'Can I afford my dreams?')}
                    className="text-[8px] font-bold px-2 py-1 rounded bg-slate-950/40 border border-white/5 text-slate-400 hover:text-white"
                  >
                    Can I afford it?
                  </button>
                  <button 
                    onClick={() => handleSendMessage(undefined, 'How can I save faster?')}
                    className="text-[8px] font-bold px-2 py-1 rounded bg-slate-950/40 border border-white/5 text-slate-400 hover:text-white"
                  >
                    Save Faster
                  </button>
                </div>

                {/* Chat Inputs */}
                <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI Coach a question..."
                    disabled={isChatLoading}
                    className={`flex-1 text-[10px] px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ${
                      isDark ? 'bg-slate-950/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading}
                    className="px-3.5 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center"
                  >
                    Send
                  </button>
                </form>
              </div>

            </div>

          </div>

        </main>
      )}
    </div>
  )
}
