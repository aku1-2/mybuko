import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Target, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function Auth() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formData.email) {
            newErrors.email = 'Email is required'
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email format'
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters'
        }

        // Signup-specific validation
        if (!isLogin) {
            if (!formData.name) {
                newErrors.name = 'Name is required'
            }
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password'
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)

        // Simulate API call
        setTimeout(() => {
            // For now, just save to localStorage (we'll add real auth later)
            if (isLogin) {
                // Login logic
                const users = JSON.parse(localStorage.getItem('users') || '[]')
                const user = users.find((u: any) => u.email === formData.email && u.password === formData.password)

                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user))
                    router.push('/dashboard')
                } else {
                    setErrors({ email: 'Invalid email or password' })
                }
            } else {
                // Signup logic
                const users = JSON.parse(localStorage.getItem('users') || '[]')
                const existingUser = users.find((u: any) => u.email === formData.email)

                if (existingUser) {
                    setErrors({ email: 'Email already registered' })
                } else {
                    const newUser = {
                        id: Date.now(),
                        name: formData.name,
                        email: formData.email,
                        password: formData.password,
                        createdAt: new Date().toISOString()
                    }
                    users.push(newUser)
                    localStorage.setItem('users', JSON.stringify(users))
                    localStorage.setItem('currentUser', JSON.stringify(newUser))
                    router.push('/dashboard')
                }
            }
            setIsLoading(false)
        }, 1000)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const switchMode = () => {
        setIsLogin(!isLogin)
        setErrors({})
        setFormData({ name: '', email: '', password: '', confirmPassword: '' })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Back to Home */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors dark:text-slate-300 dark:hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </Link>

                {/* Auth Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden dark:bg-slate-900/80 dark:border-slate-700">

                    {/* Header */}
                    <div className="p-8 pb-6">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">MYBUKO</span>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 text-center mb-2 dark:text-white">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="text-gray-600 text-center dark:text-slate-300">
                            {isLogin ? 'Sign in to continue your journey' : 'Start planning your bucket list today'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">

                        {/* Name field (signup only) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 text-slate-950 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:text-slate-100 ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                                            }`}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>
                        )}

                        {/* Email field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
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
                                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 text-slate-950 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:text-slate-100 ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
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
                                    className={`w-full pl-11 pr-11 py-3 bg-gray-50 text-slate-950 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:text-slate-100 ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors dark:text-slate-300 dark:hover:text-slate-100"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password field (signup only) */}
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        className={`w-full pl-11 pr-4 py-3 bg-gray-50 text-slate-950 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:bg-slate-800 dark:text-slate-100 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                                            }`}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                                )}
                            </div>
                        )}

                        {/* Forgot Password (login only) */}
                        {isLogin && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                                </div>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500 dark:bg-slate-900 dark:text-slate-300">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Google</span>
                            </button>

                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all"
                            >
                                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Facebook</span>
                            </button>
                        </div>
                    </form>

                    {/* Switch Mode */}
                    <div className="px-8 py-6 bg-gray-50 text-center dark:bg-slate-900 dark:text-slate-300">
                        <p className="text-gray-600 dark:text-slate-300">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={switchMode}
                                className="text-blue-600 hover:text-blue-700 font-semibold dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Trusted by 2,500+ dreamers worldwide
                    </p>
                </div>
            </div>
        </div>
    )
}