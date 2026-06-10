"use client"

import { useEffect, useRef, useState } from 'react'
import { User, Award, CheckCircle, Pencil, Check, X, ArrowLeft, MessageSquare, Globe } from 'lucide-react'
import { useTheme } from '../../theme-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const [followers, setFollowers] = useState<any[]>([])
  const [followingList, setFollowingList] = useState<any[]>([])
  const [saveMessage, setSaveMessage] = useState('')
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null)

  // Followers & Following Lists Modal States
  const [showModal, setShowModal] = useState<'followers' | 'following' | null>(null)
  const [modalUsersList, setModalUsersList] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)

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

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${parsedUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            const updatedUserData = {
              ...parsedUser,
              name: data.user.name,
              email: data.user.email,
              bio: data.user.bio || '',
              profilePicture: data.user.profileImage || '',
            }
            localStorage.setItem('user', JSON.stringify(updatedUserData))
            setUser(updatedUserData)
            setBio(data.user.bio || '')
            setBioDraft(data.user.bio || '')
            setProfilePicture(data.user.profileImage || '')
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err)
      }
    }

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

    const fetchFollows = async () => {
      try {
        const resF = await fetch(`/api/users/${parsedUser.id}/followers`)
        if (resF.ok) {
          const data = await resF.json()
          setFollowers(data.followers || [])
        }

        const resG = await fetch(`/api/users/${parsedUser.id}/following`)
        if (resG.ok) {
          const data = await resG.json()
          setFollowingList(data.following || [])
        }
      } catch (err) {
        console.error('Failed to fetch followers/following', err)
      }
    }

    fetchProfile()
    fetchStats()
    fetchFollows()
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

  const updateUserProfile = async (updates: Partial<any>) => {
    if (!user) return
    const token = localStorage.getItem('token')
    if (!token) return

    // Optimistically update frontend local state & storage
    const updatedUser = { ...user, ...updates }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    if (updates.bio !== undefined) {
      setBio(updates.bio)
      setBioDraft(updates.bio)
    }
    if (updates.profilePicture !== undefined) setProfilePicture(updates.profilePicture)

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!res.ok) {
        throw new Error('Failed to save profile changes to database')
      }

      const data = await res.json()
      if (data.user) {
        const finalUser = {
          ...updatedUser,
          name: data.user.name,
          email: data.user.email,
          bio: data.user.bio || '',
          profilePicture: data.user.profileImage || '',
        }
        localStorage.setItem('user', JSON.stringify(finalUser))
        setUser(finalUser)
        setBio(data.user.bio || '')
        setBioDraft(data.user.bio || '')
        setProfilePicture(data.user.profileImage || '')
      }

      setSaveMessage('Profile saved')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setSaveMessage('Failed to save to database')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const triggerFileInput = () => {
    hiddenFileInputRef.current?.click()
  }

  const handlePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSaveMessage('Uploading picture...')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      const data = await uploadRes.json()
      if (data.url) {
        await updateUserProfile({ profilePicture: data.url })
      } else {
        throw new Error('No url returned')
      }
    } catch (err) {
      console.error(err)
      setSaveMessage('Upload failed')
      setTimeout(() => setSaveMessage(''), 3000)
    }
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

  const handleOpenListModal = async (type: 'followers' | 'following') => {
    if (!user) return
    setShowModal(type)
    setModalLoading(true)
    setModalUsersList([])

    try {
      const url = `/api/users/${user.id}/${type}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setModalUsersList(data[type] || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setModalLoading(false)
    }
  }

  const handleFollowToggleInModal = async (targetId: string, isCurrentlyFollowing: boolean) => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Optimistically update followings in UI
    if (isCurrentlyFollowing) {
      setFollowingList((prev) => prev.filter((item) => item.id !== targetId))
    } else {
      const usr = modalUsersList.find((u) => u.id === targetId) || followers.find((u) => u.id === targetId)
      if (usr) {
        setFollowingList((prev) => [...prev, usr])
      }
    }

    try {
      if (isCurrentlyFollowing) {
        const res = await fetch(`/api/follow?followingId=${encodeURIComponent(targetId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error()
      } else {
        const res = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ followingId: targetId })
        })
        if (!res.ok) throw new Error()
      }
      
      // Quietly sync lists
      if (user) {
        const resF = await fetch(`/api/users/${user.id}/followers`)
        if (resF.ok) {
          const data = await resF.json()
          setFollowers(data.followers || [])
        }
        const resG = await fetch(`/api/users/${user.id}/following`)
        if (resG.ok) {
          const data = await resG.json()
          setFollowingList(data.following || [])
          if (showModal === 'following') {
            setModalUsersList(data.following || [])
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-900'} p-8`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-opacity-80 ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/chats"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-opacity-80 ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Chats
            </Link>
            <Link
              href="/dashboard?tab=community"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-opacity-80 ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              Community
            </Link>
          </div>
        </div>

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

            <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-3xl shadow-xl p-6 mt-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Social</h3>
                <div className="text-sm text-slate-400">Followers & Following</div>
              </div>

              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => handleOpenListModal('followers')}
                  className="text-left group focus:outline-none"
                >
                  <div>
                    <p className={`text-2xl font-bold group-hover:underline ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{followers.length}</p>
                    <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>Followers</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenListModal('following')}
                  className="text-left group focus:outline-none"
                >
                  <div>
                    <p className={`text-2xl font-bold group-hover:underline ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{followingList.length}</p>
                    <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>Following</p>
                  </div>
                </button>

                <div className="ml-auto flex items-center gap-2">
                  {followers.slice(0,5).map((f) => (
                    <div key={f.id} className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold dark:bg-slate-700">
                      {f.name.split(' ').map((s:string)=>s[0]).join('').slice(0,2)}
                    </div>
                  ))}
                </div>
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

      {/* Followers / Following Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-[32px] overflow-hidden border shadow-2xl transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-gray-200 text-gray-900'}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-opacity-50 dark:border-slate-800 border-gray-200">
              <h3 className="text-lg font-bold capitalize">{showModal}</h3>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4">
              {modalLoading ? (
                <p className="text-center text-slate-400 animate-pulse text-sm">Fetching list...</p>
              ) : modalUsersList.length === 0 ? (
                <p className="text-center text-slate-400 text-sm">No users found.</p>
              ) : (
                modalUsersList.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => {
                      setShowModal(null)
                      router.push(`/dashboard/profile/${usr.id}`)
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100/60'}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {usr.name.split(' ').map((s:string) => s[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm">{usr.name}</p>
                        <p className="text-xs text-slate-400 truncate">{usr.email}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {usr.id !== user.id && (() => {
                        const isFollowingUsr = followingList.some((f) => f.id === usr.id)
                        return (
                          <button
                            type="button"
                            onClick={() => handleFollowToggleInModal(usr.id, isFollowingUsr)}
                            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition ${isFollowingUsr ? (isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300') : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                            {isFollowingUsr ? 'Following' : 'Follow'}
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}