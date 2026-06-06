"use client"

import { useEffect, useRef, useState } from 'react'
import { User, Award, CheckCircle, Pencil, Check, X } from 'lucide-react'
import { useTheme } from '../../theme-provider'
import { useRouter } from 'next/navigation'

function formatJoinedDate(dateValue: string | undefined) {
  if (!dateValue) return 'Unknown date'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

type ExploreActivityPost = {
  id: number
  author: string
  authorEmail?: string
  text: string
  date: string
  likes: number
  comments?: Array<{ id: number; author: string; text: string; date: string }>
}

export default function ProfilePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    completionRate: 0
  })
  const [bio, setBio] = useState('')
  const [bioDraft, setBioDraft] = useState('')
  const [isBioEditing, setIsBioEditing] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string>('')
  const [activityPosts, setActivityPosts] = useState<ExploreActivityPost[]>([])
  const [saveMessage, setSaveMessage] = useState('')
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    setBio(parsedUser.bio || '')
    setBioDraft(parsedUser.bio || '')
    setProfilePicture(parsedUser.profilePicture || '')

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/goals', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
          return
        }

        if (!res.ok) {
          console.error('Failed to fetch goals for profile stats')
          return
        }

        const goals = await res.json()
        const totalGoals = goals.length
        const completedGoals = goals.filter((goal: any) => goal.status === 'Completed').length
        const inProgressGoals = goals.filter((goal: any) => goal.status === 'In Progress').length
        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

        setStats({
          totalGoals,
          completedGoals,
          inProgressGoals,
          completionRate
        })
      } catch (error) {
        console.error('Error fetching profile stats:', error)
      }
    }

    fetchStats()
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return

    try {
      const stored = window.localStorage.getItem('mybuko-explore-posts')
      if (!stored) {
        setActivityPosts([])
        return
      }

      const parsed = JSON.parse(stored) as ExploreActivityPost[]
      const filtered = parsed.filter((post) => {
        return post.authorEmail === user.email || post.author === user.name
      })

      setActivityPosts(filtered)
    } catch {
      setActivityPosts([])
    }
  }, [user])

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const isDark = theme === 'dark'
  const joinedDate = formatJoinedDate(user.createdAt)
  const goalSetterUnlocked = stats.totalGoals > 0
  const firstVictoryUnlocked = stats.completedGoals > 0
  const powerUserUnlocked = stats.completedGoals >= 10

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/')
  }

  const updateUserProfile = (updates: Partial<any>) => {
    if (!user) return
    const updatedUser = { ...user, ...updates }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    if (updates.bio !== undefined) setBio(updates.bio)
    if (updates.profilePicture !== undefined) setProfilePicture(updates.profilePicture)
    setSaveMessage('Profile updated')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const triggerFileInput = () => {
    hiddenFileInputRef.current?.click()
  }

  const handlePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const imageData = reader.result as string
      updateUserProfile({ profilePicture: imageData })
    }
    reader.readAsDataURL(file)
  }

  const startBioEditing = () => {
    setBioDraft(bio)
    setIsBioEditing(true)
  }

  const cancelBioEditing = () => {
    setBioDraft(bio)
    setIsBioEditing(false)
  }

  const saveBio = () => {
    updateUserProfile({ bio: bioDraft })
    setIsBioEditing(false)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-900'} p-8`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Profile</h1>
            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} mt-2`}>Update your profile, set a picture, and unlock achievements as you progress.</p>
          </div>
          <button
            onClick={handleLogout}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr] mb-6">
          <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-8 space-y-6`}>
            <div className="flex flex-wrap items-start gap-5">
              <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="w-14 h-14 text-white" />
                )}
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="absolute bottom-2 right-2 inline-flex items-center justify-center rounded-full bg-white/95 p-2 text-blue-600 shadow-sm transition hover:bg-white"
                  aria-label="Edit profile picture"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <input
                  ref={hiddenFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <h2 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{user.name}</h2>
                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} mt-1`}>{user.email}</p>
                <p className={`${isDark ? 'text-slate-400' : 'text-sm text-gray-500'} mt-3`}>Joined {joinedDate}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Bio</label>
                <div className="flex items-center gap-2">
                  {isBioEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveBio}
                        className={`inline-flex items-center justify-center rounded-full p-2 transition ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                        aria-label="Save bio"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelBioEditing}
                        className={`inline-flex items-center justify-center rounded-full p-2 transition ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                        aria-label="Cancel bio editing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startBioEditing}
                      className={`inline-flex items-center justify-center rounded-full p-2 transition ${isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                      aria-label="Edit bio"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={isBioEditing ? bioDraft : bio}
                onChange={(event) => setBioDraft(event.target.value)}
                rows={5}
                placeholder="Tell us something about yourself..."
                readOnly={!isBioEditing}
                className={`w-full rounded-3xl border px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${isDark ? 'bg-slate-700 border-slate-700 text-slate-100' : 'bg-gray-50 border-gray-200 text-gray-900'} ${!isBioEditing ? 'opacity-80 cursor-not-allowed' : ''}`}
              />
            </div>
            {saveMessage && <p className="text-sm text-emerald-400">{saveMessage}</p>}
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Total Goals</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{stats.totalGoals}</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedGoals}</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>In Progress</p>
                <p className="text-3xl font-bold text-orange-600">{stats.inProgressGoals}</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Completion Rate</p>
                <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-8`}>
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-6 h-6" />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Achievements</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className={`${isDark ? 'rounded-3xl border p-6 transition' : 'rounded-3xl border p-6 transition'} ${goalSetterUnlocked ? (isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200') : (isDark ? 'bg-slate-900 border-slate-700 opacity-60' : 'bg-gray-50 border-gray-300 opacity-60')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>🎯 Goal Setter</p>
                    {goalSetterUnlocked && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mt-2`}>
                    {goalSetterUnlocked ? 'Unlocked' : 'Locked until you create your first goal'}
                  </p>
                </div>

                <div className={`${isDark ? 'rounded-3xl border p-6 transition' : 'rounded-3xl border p-6 transition'} ${firstVictoryUnlocked ? (isDark ? 'bg-slate-800 border-slate-700' : 'bg-green-50 border-green-200') : (isDark ? 'bg-slate-900 border-slate-700 opacity-60' : 'bg-gray-50 border-gray-300 opacity-60')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>✅ First Victory</p>
                    {firstVictoryUnlocked && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mt-2`}>
                    {firstVictoryUnlocked ? 'Unlocked' : 'Locked until you complete your first goal'}
                  </p>
                </div>

                <div className={`${isDark ? 'rounded-3xl border p-6 transition' : 'rounded-3xl border p-6 transition'} ${powerUserUnlocked ? (isDark ? 'bg-slate-800 border-slate-700' : 'bg-purple-50 border-purple-200') : (isDark ? 'bg-slate-900 border-slate-700 opacity-60' : 'bg-gray-50 border-gray-300 opacity-60')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>🏆 Power User</p>
                    {powerUserUnlocked && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mt-2`}>
                    {powerUserUnlocked ? 'Unlocked' : 'Locked until you complete 10 goals'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-8`}>
              <div className="flex items-center gap-2 mb-6">
                <User className="w-6 h-6" />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Explore Activity</h2>
              </div>

              {activityPosts.length > 0 ? (
                <div className="space-y-4">
                  {activityPosts.map((post) => (
                    <div key={post.id} className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'} rounded-3xl border p-5`}>
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{post.author}</p>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{post.date}</span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-4`}>{post.text}</p>
                      <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">{post.likes} likes</span>
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{post.comments?.length ?? 0} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                  No shared posts yet. Write an experience on the Explore page and it will appear here in your activity.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}