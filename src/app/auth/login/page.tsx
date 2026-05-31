"use client"

import { useState } from 'react'
import { useTheme } from '../../theme-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Target, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        router.push('/dashboard')
      } else {
        setErrors({ email: data.error || 'Login failed' })
      }
    } catch (error) {
      setErrors({ email: 'Something went wrong' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-blue-50 via-white to-teal-50 text-gray-900'} flex items-center justify-center p-4`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className={`${isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-xl rounded-3xl shadow-2xl border overflow-hidden`}>
          <div className="p-8 pb-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <span className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>MYBUKO</span>
            </div>
            
            <h2 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'} text-center mb-2`}>
              Welcome back
            </h2>
            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-center`}>
              Sign in to continue your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-200'
                  } ${isDark ? 'text-slate-200' : 'text-black'}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-200'
                  } ${isDark ? 'text-slate-200' : 'text-black'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className={`${isDark ? 'bg-slate-900/40' : 'bg-gray-50'} px-8 py-6 text-center`}>
            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}