'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Target, Lock, AlertCircle, CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: 'bg-slate-700'
  })

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      router.replace('/auth/forgot-password')
    }
  }, [email, router])

  // Calculate password strength
  const checkPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-700' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 10) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1

    let label = 'Weak'
    let color = 'bg-rose-500'

    if (score >= 4) {
      label = 'Strong'
      color = 'bg-emerald-500'
    } else if (score >= 2) {
      label = 'Medium'
      color = 'bg-amber-500'
    }

    return { score, label, color }
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
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNewPassword(val)
    setPasswordStrength(checkPasswordStrength(val))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const otp = otpDigits.join('')
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    if (!newPassword) {
      setError('Please enter your new password')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Password updated successfully! Redirecting to login...')
        setTimeout(() => {
          router.push('/auth/login?success=Your password has been reset. Please log in.')
        }, 2000)
      } else {
        setError(data.error || 'Password reset failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-md bg-slate-950/40 border border-white/10 backdrop-blur-2xl rounded-[32px] p-8 lg:p-10 shadow-2xl relative z-20"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none rounded-[32px]" />

      <div className="text-center mb-6 relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent font-display mb-2">
          New Password
        </h1>
        <p className="text-sm text-slate-400">
          Enter the verification code sent to <br />
          <span className="text-indigo-305 font-semibold">{email}</span> and choose a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
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

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6-Digit OTP cell inputs */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Verification Code
          </label>
          <div className="flex justify-between gap-2">
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
                className="w-12 h-12 text-center text-lg font-bold bg-slate-900/60 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-white font-mono"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            New Password
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <Lock className="w-4.5 h-4.5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter secure new password"
              className="w-full pl-11 pr-11 py-3 border border-white/10 rounded-2xl bg-slate-900/50 text-slate-100 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder-slate-600 text-sm"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Password strength */}
          {newPassword && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5 pt-1.5"
            >
              <div className="flex justify-between items-center text-[10px] font-bold tracking-wider">
                <span className="text-slate-400 uppercase">Security Level</span>
                <span className={
                  passwordStrength.label === 'Strong' ? 'text-emerald-400' :
                  passwordStrength.label === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                }>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                <div className={`h-full transition-all duration-500 ${passwordStrength.color}`} style={{ width: passwordStrength.score === 1 ? '25%' : passwordStrength.score === 2 ? '50%' : passwordStrength.score === 3 ? '75%' : '100%' }} />
              </div>
            </motion.div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:opacity-95 transition-all disabled:opacity-50 animate-shine text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Save New Password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030712] text-slate-100 flex flex-col justify-center items-center p-6 selection:bg-indigo-500 selection:text-white">
      
      {/* Noise Texture Overlay */}
      <div className="noise-overlay z-10" />

      {/* Atmospheric Background & Pulsing Aurora Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '13s' }} />
      </div>

      {/* Top Logo */}
      <div className="mb-8 text-center relative z-20">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Target className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-display">MYBUKO</span>
        </Link>
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-950/40 border border-white/10 backdrop-blur-2xl rounded-[32px] p-8 lg:p-10 shadow-2xl flex flex-col items-center justify-center relative z-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading password reset form...</p>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
