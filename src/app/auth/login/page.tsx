'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Eye, EyeOff, AlertCircle, Target, Mail, Lock, CheckCircle, Star, 
  MapPin, ArrowRight, Sparkles, Compass, Check 
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

// Separate component to safely use useSearchParams() inside Suspense
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  // Real-time email validation check
  const [isEmailValid, setIsEmailValid] = useState(false)

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        router.replace('/dashboard')
      }
    }
  }, [router])

  // Read Google OAuth error queries
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(errorParam)
    }
  }, [searchParams])

  // Resend OTP Cooldown Timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

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
        // Set Client side token cookie
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
        router.push('/dashboard')
      } else {
        if (data.isNotVerified) {
          // Slide user to OTP Verification step and send verification OTP
          setStep('otp')
          setError('')
          triggerAutoResendOtp(formData.email)
        } else {
          setError(data.error || 'Login failed')
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const triggerAutoResendOtp = async (email: string) => {
    try {
      setSuccessMsg('Email needs verification. Code sent.')
      setResendCooldown(60)
      
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Failed to trigger verification code.')
    }
  }

  const handleVerifyOtp = async (otpValue: string) => {
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otpValue
        })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
        router.push('/dashboard')
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (error) {
      setError('An error occurred during verification.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccessMsg('Verification code resent successfully.')
        setResendCooldown(60)
        setOtpDigits(['', '', '', '', '', ''])
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100)
      } else {
        setError(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      setError('An error occurred resending verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google'
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')

    if (name === 'email') {
      setIsEmailValid(validateEmail(value))
    }
  }

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return

    const newDigits = [...otpDigits]
    newDigits[index] = value
    setOtpDigits(newDigits)

    setError('')

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }

    const combinedOtp = newDigits.join('')
    if (combinedOtp.length === 6) {
      handleVerifyOtp(combinedOtp)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (!/^\d{6}$/.test(pastedData)) return

    const newDigits = pastedData.split('')
    setOtpDigits(newDigits)
    handleVerifyOtp(pastedData)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full relative z-20">
      
      {/* LEFT PANEL - Onboarding Content */}
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
          <p className="text-xs font-semibold text-slate-400 tracking-wide">
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

          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent font-display mb-2">
                    Welcome Back
                  </h1>
                  <p className="text-sm text-slate-400">
                    Log in to resume mapping your bucket list itinerary.
                  </p>
                </div>

                {/* Google Sign In Button */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-2xl font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 cursor-pointer text-sm"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center my-5">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="px-3 text-xs text-slate-500 font-bold uppercase tracking-widest">or email login</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>
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
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
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
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400"
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
                      <Link 
                        href="/auth/forgot-password" 
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition hover:underline font-semibold"
                      >
                        Forgot Password?
                      </Link>
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
                        className="w-full pl-11 pr-11 py-3 border border-white/10 rounded-2xl bg-slate-900/50 text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder-slate-650 text-sm"
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
            ) : (
              /* OTP Verification Step screen (for unverified user login) */
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent font-display mb-2">
                    Verify Email
                  </h1>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Please enter the verification code sent to <br />
                    <span className="text-indigo-350 font-semibold">{formData.email}</span>.
                  </p>
                </div>

                <div className="space-y-6 relative z-10">
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

                  <AnimatePresence>
                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{successMsg}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 6-digit cells */}
                  <div className="flex justify-between gap-2.5">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        ref={el => { otpInputsRef.current[index] = el }}
                        value={digit}
                        onChange={e => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 text-center text-xl font-bold bg-slate-900/60 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white font-mono"
                        disabled={isLoading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <div className="text-center space-y-4">
                    {resendCooldown > 0 ? (
                      <p className="text-xs text-slate-500">
                        Resend code in <span className="text-slate-350 font-bold font-mono">{resendCooldown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition bg-transparent border-none cursor-pointer"
                      >
                        Resend Verification Code
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setStep('form')
                        setError('')
                        setSuccessMsg('')
                        setOtpDigits(['', '', '', '', '', ''])
                      }}
                      className="text-xs text-slate-500 hover:text-slate-400 transition block mx-auto underline cursor-pointer"
                    >
                      Go Back to Login
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
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

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen w-full relative z-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading auth screen...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  )
}