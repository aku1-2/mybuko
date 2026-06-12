'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Eye, EyeOff, AlertCircle, Target, Mail, Lock, CheckCircle, Star, 
  MapPin, Award, ArrowRight, Sparkles, Compass, Check 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MOCKUP_GOALS = [
  { id: 1, title: 'Trek to Everest Base Camp', category: 'Adventure', progress: 70, location: 'Nepal', icon: '🧗', color: 'from-orange-500/20 to-amber-500/20 text-orange-400' },
  { id: 2, title: 'Scuba Diving in Great Barrier Reef', category: 'Travel', progress: 100, location: 'Australia', icon: '🐠', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400' },
  { id: 3, title: 'Learn to Speak Fluent Japanese', category: 'Skills', progress: 40, location: 'Tokyo', icon: '🇯🇵', color: 'from-purple-500/20 to-indigo-500/20 text-purple-400' }
]

const FLOATING_BADGES = [
  { text: '🧭 Explorer', x: '10%', y: '15%', delay: 0 },
  { text: '🧗 Adventurer', x: '75%', y: '45%', delay: 0.8 },
  { text: '🏆 Goal Master', x: '20%', y: '80%', delay: 1.5 }
]

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  // Real-time email validation check
  const [isEmailValid, setIsEmailValid] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        router.replace('/dashboard')
      }
    }
  }, [router])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    if (!formData.password) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`
        window.location.href = '/dashboard'
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')

    if (name === 'email') {
      setIsEmailValid(validateEmail(value))
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* Noise Texture Overlay */}
      <div className="noise-overlay z-10" />

      {/* Atmospheric Background & Pulsing Aurora Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '13s' }} />
        <div className="absolute top-[35%] right-[15%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: '11s' }} />
      </div>

      {/* Split-Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full relative z-20">
        
        {/* LEFT PANEL - Emotional Onboarding Content */}
        <div className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden border-r border-white/5 bg-[#030712]/30 backdrop-blur-md">
          {/* Top Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Target className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">MYBUKO</span>
          </Link>

          {/* Core Inspiration Area */}
          <div className="space-y-12 my-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 border border-white/10 rounded-full bg-white/5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Your future adventures start here
              </div>
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-display leading-[1.1]">
                Start Building Your <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Dream Life.</span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Plan adventures, track goals, and turn dreams into lifelong memories with our dynamic community.
              </p>
            </motion.div>

            {/* Simulated Bucket-List Mockup */}
            <div className="relative p-6 rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-2xl space-y-4 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none rounded-3xl" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Active Dream Board
                </h4>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">In-Progress Preview</span>
              </div>

              {/* Goal Cards */}
              <div className="space-y-3 relative z-10">
                {MOCKUP_GOALS.map((goal, idx) => (
                  <motion.div
                    key={goal.id}
                    custom={idx}
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: idx * 1.8,
                      ease: "easeInOut"
                    }}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-white/5 bg-slate-900/60 shadow-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${goal.color}`}>
                        <span className="text-lg">{goal.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">{goal.title}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-600" /> {goal.location}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {goal.progress === 100 ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Completed
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-indigo-300">{goal.progress}%</span>
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${goal.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Floating Badge Assets */}
              {FLOATING_BADGES.map((badge, idx) => (
                <motion.div
                  key={idx}
                  style={{ left: badge.x, top: badge.y }}
                  animate={{ y: [0, -12, 0], rotate: [0, idx % 2 === 0 ? 3 : -3, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: badge.delay,
                    ease: "easeInOut"
                  }}
                  className="absolute pointer-events-none text-xs font-bold px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-md text-slate-200"
                >
                  {badge.text}
                </motion.div>
              ))}
            </div>

            {/* Dashboard Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-display">14,280+</p>
                <p className="text-xs uppercase tracking-wider font-extrabold text-slate-500">Dreams Achieved</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-display">4,920+</p>
                <p className="text-xs uppercase tracking-wider font-extrabold text-slate-500">Active Dreamers</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-display">87</p>
                <p className="text-xs uppercase tracking-wider font-extrabold text-slate-500">Countries Visited</p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-3.5">
            <div className="flex text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current shrink-0" />)}
            </div>
            <p className="text-xs font-semibold text-slate-450 tracking-wide">
              Trusted by dreamers worldwide. <span className="text-indigo-400">Join our community.</span>
            </p>
          </div>
        </div>

        {/* RIGHT PANEL - Authentication Form Card */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 relative z-20">
          
          {/* Logo showing only on mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-5.5 h-5.5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">MYBUKO</span>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md bg-slate-950/40 border border-white/10 backdrop-blur-2xl rounded-[32px] p-8 lg:p-10 shadow-2xl relative"
          >
            {/* Ambient Card Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none rounded-[32px]" />

            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent font-display mb-2">
                Welcome Back
              </h1>
              <p className="text-sm text-slate-400">
                Log in to resume mapping your bucket list itinerary.
              </p>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              
              {/* Animated Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                      <AlertCircle className="w-5 h-5 text-rose-455 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-11 py-3 border border-white/10 rounded-2xl bg-slate-900/50 text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder-slate-600 text-sm"
                  />
                  {/* Email Success Checkmark Indicator */}
                  <AnimatePresence>
                    {isEmailValid && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-450"
                      >
                        <CheckCircle className="w-4.5 h-4.5 fill-emerald-500/10" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter security key"
                    className="w-full pl-11 pr-11 py-3 border border-white/10 rounded-2xl bg-slate-900/50 text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder-slate-600 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* CTA Submit Button with Shine effect */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:opacity-95 transition-all disabled:opacity-50 animate-shine text-sm flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Start My Journey</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Redirect to Signup */}
              <p className="text-center text-xs text-slate-400 pt-3 border-t border-white/5 mt-4">
                Don't have an account yet?{' '}
                <Link 
                  href="/auth/signup" 
                  className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold transition"
                >
                  Create My Dream Portfolio
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}