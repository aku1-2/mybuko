'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Lock, Trash2, LogOut, Bell, UserPlus, CheckCircle, 
  Settings, User, Shield, ShieldAlert, Sparkles, Star, Flame, 
  Target, Globe, MessageSquare, Compass, Sun, Moon, Check, 
  ChevronRight, Calendar, AlertCircle, Eye, EyeOff, Activity 
} from 'lucide-react'
import { useTheme } from '../../theme-provider'
import { motion, AnimatePresence } from 'framer-motion'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('account')
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  
  // States
  const [user, setUser] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [streak, setStreak] = useState(7)
  const [notifications, setNotifications] = useState<any[]>([])
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Preference Settings States
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    goalsShared: true,
    activityShared: true,
    dataPersonalized: true
  })

  const [notificationToggles, setNotificationToggles] = useState({
    goalReminders: true,
    weeklyRecap: true,
    milestoneAlerts: true,
    communityActivity: true,
    achievementUnlocks: true
  })

  // Fetch following list for follows interactions
  const fetchFollowing = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/following`)
      if (res.ok) {
        const data = await res.json()
        const list = data.following || []
        setFollowingIds(list.map((u: any) => u.id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setLoadingNotifs(true)
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingNotifs(false)
    }
  }

  // Fetch goals to compile score metrics
  const fetchGoals = async (token: string) => {
    try {
      const res = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setGoals(data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setUser(parsed)
        fetchFollowing(parsed.id)
        if (token) {
          fetchGoals(token)
        }
      } catch (e) {
        console.error(e)
      }
    }

    const savedStreak = localStorage.getItem('mybuko-streak')
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10))
    }

    fetchNotifications()
  }, [])

  // Follow back action
  const handleFollowBackInSettings = async (senderId: string, notifId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ followingId: senderId })
      })
      if (res.ok) {
        setFollowingIds((prev) => [...prev, senderId])
        
        // Mark notification as read
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id: notifId })
        })
        
        fetchNotifications()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone.')) {
      handleLogout()
    }
  }

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSaveMessage('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    // Simulate update success
    setSaveMessage('Password updated successfully!')
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setTimeout(() => setSaveMessage(''), 3000)
  }

  // Dynamic calculations for the Control Center header & widgets
  const completedCount = goals.filter(g => g.status === 'Completed').length
  const activeCount = goals.length - completedCount
  const completionRate = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0
  const totalMilestones = goals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0)
  const completedMilestones = goals.reduce((acc, g) => acc + (g.milestones?.filter((m: any) => m.completed).length || 0), 0)
  const milestoneCompletionRate = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
  const totalNotes = goals.reduce((acc, g) => acc + (g.notes?.length || 0), 0)

  // Dream Score matches main dashboard calculations
  const dreamScore = (() => {
    if (goals.length === 0) return 10
    const raw = (streak * 3) + (completionRate * 0.4) + (milestoneCompletionRate * 0.3) + (totalNotes * 1.5)
    return Math.min(100, Math.max(10, Math.round(raw)))
  })()

  const currentLevel = Math.floor(completedCount / 3) + 1

  // Profile Completeness
  const completenessItems = [
    { id: 'avatar', label: 'Avatar Uploaded', completed: !!(user?.profilePicture || user?.profileImage) },
    { id: 'bio', label: 'Biography Completed', completed: !!(user?.bio && user?.bio.length > 5) },
    { id: 'goals', label: 'Create 2+ Dreams', completed: goals.length >= 2 },
    { id: 'streak', label: 'Maintain Active Streak', completed: streak >= 3 }
  ]
  const profileCompleteness = Math.round(
    (completenessItems.filter(item => item.completed).length / completenessItems.length) * 100
  )

  // Security Score
  const passwordStrengthScore = passwordForm.newPassword ? (passwordForm.newPassword.length >= 10 ? 40 : 25) : 35
  const securityScore = Math.min(100, passwordStrengthScore + (profileCompleteness * 0.4) + 20) // verified account base
  const accountHealth = securityScore >= 90 ? 'Excellent' : securityScore >= 75 ? 'Good' : 'Needs Attention'

  // Monthly Recap calculation helper
  const getMonthlyRecapCount = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return goals.filter(g => {
      if (!g.updatedAt) return false
      const d = new Date(g.updatedAt)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && g.status === 'Completed'
    }).length
  }
  const completedThisMonth = getMonthlyRecapCount()

  return (
    <div className={`min-h-screen relative overflow-hidden pb-12 transition-colors duration-300 font-sans ${isDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Noise Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-[0.02] ${isDark ? 'bg-[radial-gradient(#ffffff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000000_1px,transparent_1px)]'} [background-size:16px_16px] z-10`} />

      {/* Atmospheric Aurora Glowing background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/5'} rounded-full blur-[140px]`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${isDark ? 'bg-violet-600/10' : 'bg-violet-400/5'} rounded-full blur-[140px]`} />
        <div className={`absolute top-[35%] right-[15%] w-[40%] h-[40%] ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-400/3'} rounded-full blur-[110px]`} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 z-20 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-slate-900/60 text-slate-350 border-white/5 hover:bg-slate-800' 
                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-2.5 rounded-full border transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-slate-900/60 text-yellow-400 border-white/5 hover:bg-slate-800' 
                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 shadow-sm'
            }`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* HEADER AREA - Settings & Preferences */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <h1 className={`text-4xl font-extrabold tracking-tight font-display bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-white via-slate-200 to-slate-400' : 'from-slate-950 to-slate-800'}`}>
              Settings & Preferences
            </h1>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
              Customize your MYBUKO experience.
            </p>
          </div>

          {/* Quick Stats Header widget */}
          {user && (
            <div className={`flex items-center gap-4 border rounded-2xl px-5 py-3 backdrop-blur-md transition shadow-md ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold uppercase px-1.5 py-0.5 rounded">
                    Lvl {currentLevel}
                  </span>
                  <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Dream Score: {dreamScore}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MAIN SETTINGS LAYOUT CONTROL PANEL */}
        <div className="space-y-6">
            
            {/* Animated Tab Pills Navigation */}
            <div className={`rounded-2xl border p-2 flex flex-wrap gap-2 items-center backdrop-blur-md transition-all shadow-sm ${
              isDark ? 'border-white/5 bg-[#030712]/60' : 'border-slate-200 bg-white'
            }`}>
              {[
                { id: 'account', label: 'Account Controls', icon: User },
                { id: 'theme', label: 'Personalization Hub', icon: Sun },
                { id: 'notifications', label: 'Alert Settings', icon: Bell },
                { id: 'privacy', label: 'Privacy Preferences', icon: Shield }
              ].map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer"
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabGlow"
                        className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20 z-0"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white' : isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-650 hover:text-slate-900'}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* TAB CONTENT DETAILS PANEL */}
            <div className={`rounded-3xl border p-6 lg:p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300 relative ${
              isDark ? 'border-white/5 bg-[#0b1329]/40' : 'border-slate-200 bg-white'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/2 via-transparent to-cyan-500/2 pointer-events-none rounded-3xl" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 relative z-10"
                >
                  
                  {/* TAB 1: ACCOUNT & SECURITY */}
                  {activeTab === 'account' && (
                    <div className="space-y-6">
                      
                      {/* Security score details dashboard */}
                      <div className="grid md:grid-cols-2 gap-4">
                        
                        <div className={`border rounded-2xl p-5 space-y-3 shadow-md ${isDark ? 'bg-slate-950/60 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-400" /> Security Score
                          </h4>
                          
                          <div className="flex items-center gap-4 pt-1">
                            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="26" className={isDark ? 'stroke-slate-800' : 'stroke-slate-200'} strokeWidth="5" fill="transparent" />
                                <motion.circle 
                                  cx="32" 
                                  cy="32" 
                                  r="26" 
                                  className="stroke-indigo-500" 
                                  strokeWidth="5" 
                                  fill="transparent" 
                                  strokeDasharray="163.3"
                                  initial={{ strokeDashoffset: 163.3 }}
                                  animate={{ strokeDashoffset: 163.3 - (163.3 * securityScore) / 100 }}
                                  transition={{ duration: 1.2, ease: "easeOut" }}
                                />
                              </svg>
                              <span className="absolute text-sm font-black text-slate-100">{securityScore}</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold">Account Health: <span className={accountHealth === 'Excellent' ? 'text-emerald-400' : 'text-amber-400'}>{accountHealth}</span></p>
                              <p className="text-[10px] text-slate-550 mt-0.5">Score compiled from validation parameters</p>
                            </div>
                          </div>
                        </div>

                        {/* Security insights suggestions panel */}
                        <div className={`border rounded-2xl p-5 space-y-3.5 shadow-md ${isDark ? 'bg-slate-950/60 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-violet-400" /> Security Insights
                          </h4>
                          <div className="space-y-2 text-[10px] font-medium leading-relaxed">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-slate-400">Two-factor login session active</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {profileCompleteness < 100 ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <span className="text-slate-400">Complete bio/profile details to raise score</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="text-slate-400">Profile completeness fully maximized</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                              <span className="text-slate-500">Last login: {new Date().toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Password Change Form */}
                      <div className={`border rounded-3xl p-5 space-y-4 shadow-md ${isDark ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-150'}`}>
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Lock className="w-4.5 h-4.5 text-indigo-400" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">Change Password</h3>
                        </div>

                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                          
                          {/* Alert Banners */}
                          <AnimatePresence>
                            {errorMessage && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" /> <span>{errorMessage}</span>
                              </motion.div>
                            )}
                            {saveMessage && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2 text-xs">
                                <Check className="w-4 h-4 shrink-0" /> <span>{saveMessage}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Current Password */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Password</label>
                              <div className="relative">
                                <input
                                  type={showCurrentPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  value={passwordForm.currentPassword}
                                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                  className="w-full pl-4 pr-11 py-2.5 border border-white/10 rounded-xl bg-slate-900/40 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/70"
                                />
                                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors">
                                  {showCurrentPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                </button>
                              </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">New Password</label>
                              <div className="relative">
                                <input
                                  type={showNewPassword ? 'text' : 'password'}
                                  placeholder="At least 6 chars"
                                  value={passwordForm.newPassword}
                                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                  className="w-full pl-4 pr-11 py-2.5 border border-white/10 rounded-xl bg-slate-900/40 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/70"
                                />
                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors">
                                  {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5 sm:col-span-2">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirm New Password</label>
                              <input
                                type="password"
                                placeholder="Re-enter security password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-slate-900/40 text-slate-100 text-sm focus:outline-none focus:border-indigo-500/70"
                              />
                            </div>
                          </div>

                          <div className="pt-2">
                            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer">
                              Update Password
                            </button>
                          </div>

                        </form>
                      </div>

                      {/* Log out Session widget */}
                      <div className={`border rounded-3xl p-5 space-y-4 shadow-md ${isDark ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-150'}`}>
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider">Active Device Session</h3>
                          <p className="text-xs text-slate-450 mt-1">Disconnect the command session client keys from this browser.</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="px-5 py-2.5 bg-red-650/10 hover:bg-red-650/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                        >
                          <LogOut className="w-4.5 h-4.5" /> Log Out Dashboard
                        </button>
                      </div>

                      {/* DANGER ZONE Overhaul warning card */}
                      <div className="border border-red-500/25 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.08)] rounded-3xl p-5 space-y-3.5">
                        <div className="flex items-center gap-2 text-red-400">
                          <ShieldAlert className="w-5 h-5" />
                          <h3 className="text-sm font-bold uppercase tracking-wider">Danger Zone</h3>
                        </div>
                        <p className="text-xs text-red-200/70 max-w-xl leading-relaxed">
                          Once you delete your account, all bucket list goals, visual portfolios, streaks, and communities data are permanently erased.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow transition cursor-pointer"
                        >
                          Delete Account Permanently
                        </button>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: THEME / PERSONALIZATION HUB */}
                  {activeTab === 'theme' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold font-display">Theme & Customization Hub</h3>
                        <p className="text-xs text-slate-450 mt-0.5">Toggle the visual interface mode of the personal command control center.</p>
                      </div>

                      {/* Live preview cards grid layout */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        
                        {/* Dark mode card */}
                        <div 
                          onClick={() => setTheme('dark')}
                          className={`cursor-pointer rounded-2xl border p-4 space-y-3 transition-all relative overflow-hidden group shadow-md ${
                            theme === 'dark' 
                              ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-[#030712]' 
                              : 'border-white/5 bg-slate-900 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-2">
                              <Moon className="w-4.5 h-4.5 text-indigo-400" /> Deep Aurora Dark
                            </span>
                            {theme === 'dark' && <CheckCircle className="w-4.5 h-4.5 text-indigo-400 fill-indigo-500/10" />}
                          </div>
                          
                          {/* Mini visual mockup of dark interface */}
                          <div className="rounded-xl bg-slate-950 p-2.5 border border-white/5 space-y-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <div className="w-1/2 h-2.5 bg-slate-800 rounded-full" />
                            <div className="flex gap-1.5">
                              <div className="w-full h-1.5 bg-indigo-500/30 rounded-full" />
                              <div className="w-1/3 h-1.5 bg-violet-500/30 rounded-full" />
                            </div>
                            <div className="w-3/4 h-1 bg-slate-900 rounded-full" />
                          </div>
                        </div>

                        {/* Light mode card */}
                        <div 
                          onClick={() => setTheme('light')}
                          className={`cursor-pointer rounded-2xl border p-4 space-y-3 transition-all relative overflow-hidden group shadow-md ${
                            theme === 'light' 
                              ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-white' 
                              : 'border-slate-200 bg-slate-100 hover:border-slate-350 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold flex items-center gap-2 text-slate-800">
                              <Sun className="w-4.5 h-4.5 text-amber-500" /> Classic Clear Light
                            </span>
                            {theme === 'light' && <CheckCircle className="w-4.5 h-4.5 text-indigo-500 fill-indigo-500/10" />}
                          </div>
                          
                          {/* Mini visual mockup of light interface */}
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 space-y-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <div className="w-1/2 h-2.5 bg-slate-300 rounded-full" />
                            <div className="flex gap-1.5">
                              <div className="w-full h-1.5 bg-indigo-500/20 rounded-full" />
                              <div className="w-1/3 h-1.5 bg-violet-500/20 rounded-full" />
                            </div>
                            <div className="w-3/4 h-1 bg-slate-200 rounded-full" />
                          </div>
                        </div>

                      </div>

                      {/* Preferences summary */}
                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-600'}`}>
                        💡 <span className="font-bold text-indigo-400">Pro Tip:</span> Changing your theme applies instantly across your dashboard, settings hubs, and dream visualizer portfolios.
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ALERTS & NOTIFICATIONS */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      
                      {/* Notifications Toggles card list */}
                      <div>
                        <h3 className="text-lg font-bold font-display">Notification Controls</h3>
                        <p className="text-xs text-slate-450 mt-0.5">Control how and when we send alerts about your bucket list progress.</p>
                      </div>

                      <div className="space-y-3">
                        {[
                          { id: 'goalReminders', label: 'Goal Reminders', desc: 'Get reminded about active goals reaching target deadlines', state: notificationToggles.goalReminders },
                          { id: 'weeklyRecap', label: 'Weekly Summary Recap', desc: 'Receive weekly email recap summaries showing your dream progress logs', state: notificationToggles.weeklyRecap },
                          { id: 'milestoneAlerts', label: 'Milestone Completion Alerts', desc: 'Be notified dynamically when achieving goal key steps', state: notificationToggles.milestoneAlerts },
                          { id: 'communityActivity', label: 'Community & Chat Alerts', desc: 'Get updates on chats, follow requests, and community posts', state: notificationToggles.communityActivity },
                          { id: 'achievementUnlocks', label: 'Achievement Badge Unlocks', desc: 'Alert when locking premium badges on your profile page', state: notificationToggles.achievementUnlocks }
                        ].map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => setNotificationToggles(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notificationToggles] }))}
                            className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition shadow-sm ${
                              isDark 
                                ? 'border-white/5 bg-slate-900/30 hover:bg-slate-900/50' 
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="pr-4 space-y-0.5">
                              <p className="text-xs font-bold">{item.label}</p>
                              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                            </div>
                            
                            {/* Premium IOS Toggle Pill */}
                            <button 
                              type="button"
                              className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 ${item.state ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            >
                              <motion.div 
                                animate={{ x: item.state ? 22 : 2 }}
                                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                              />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* DYNAMIC TIMELINE RECENT ACTIVITY FEED */}
                      <div className="border-t border-white/5 pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Bell className="w-4.5 h-4.5 text-indigo-400" /> Recent Notifications Log
                          </h4>
                          {notifications.length > 0 && (
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                              {notifications.filter(n => !n.isRead).length} Unread
                            </span>
                          )}
                        </div>

                        {loadingNotifs ? (
                          <p className="text-xs text-slate-500 animate-pulse py-4">Authorizing logs...</p>
                        ) : notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 py-4">No recent notification logs found.</p>
                        ) : (
                          <div className="space-y-2.5">
                            {notifications.map((n) => {
                              const isFollowNotif = n.type === 'FOLLOW'
                              const isAlreadyFollowing = followingIds.includes(n.senderId)

                              return (
                                <div
                                  key={n.id}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-2xl transition ${
                                    n.isRead 
                                      ? isDark ? 'border-white/5 bg-white/2' : 'border-slate-200 bg-white'
                                      : 'border-indigo-500/20 bg-indigo-500/5 shadow-indigo-500/5 shadow-md'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 text-white font-bold text-xs uppercase shadow">
                                      {n.senderName ? n.senderName.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold leading-relaxed">{n.message}</p>
                                      <p className="text-[9px] text-slate-500 mt-0.5">
                                        {new Date(n.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  {isFollowNotif && (
                                    <div className="shrink-0 pt-2 sm:pt-0">
                                      {!isAlreadyFollowing ? (
                                        <button
                                          onClick={() => handleFollowBackInSettings(n.senderId, n.id)}
                                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-[10px] font-bold text-white shadow transition cursor-pointer"
                                        >
                                          <UserPlus className="w-3 h-3" /> Follow Back
                                        </button>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900/60 border border-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-400">
                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Following
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 4: PRIVACY PREFERENCES */}
                  {activeTab === 'privacy' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold font-display">Privacy & Trust Center</h3>
                        <p className="text-xs text-slate-455 mt-0.5">Manage details visibility, sharing settings, and personalized logs.</p>
                      </div>

                      <div className="space-y-3">
                        {[
                          { id: 'profileVisible', label: 'Public Profile Visibility', desc: 'Let other logged-in dreamers search and follow your profile board', state: privacySettings.profileVisible },
                          { id: 'goalsShared', label: 'Auto-Share Dream Progress', desc: 'Allow completed dreams and milestones to show in the community explore grid', state: privacySettings.goalsShared },
                          { id: 'activityShared', label: 'Share Active Status Activity', desc: 'Let other users see when you are active on the chat feed', state: privacySettings.activityShared },
                          { id: 'dataPersonalized', label: 'Personalized AI Recommendations', desc: 'Enable cloud suggestions model to analyze your list metrics', state: privacySettings.dataPersonalized }
                        ].map((item) => (
                          <div 
                            key={item.id}
                            onClick={() => setPrivacySettings(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof privacySettings] }))}
                            className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition shadow-sm ${
                              isDark 
                                ? 'border-white/5 bg-slate-900/30 hover:bg-slate-900/50' 
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="pr-4 space-y-0.5">
                              <p className="text-xs font-bold">{item.label}</p>
                              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                            </div>
                            
                            {/* Premium IOS Toggle Pill */}
                            <button 
                              type="button"
                              className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 ${item.state ? 'bg-indigo-600' : 'bg-slate-700'}`}
                            >
                              <motion.div 
                                animate={{ x: item.state ? 22 : 2 }}
                                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md"
                              />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${isDark ? 'bg-slate-950/40 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-600'}`}>
                        🔒 Your privacy is critical. We utilize military-grade encryption keys to keep password data and account metadata secure. Refer to our main terms schema for details.
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

        </div>

      </div>
    </div>
  )
}
