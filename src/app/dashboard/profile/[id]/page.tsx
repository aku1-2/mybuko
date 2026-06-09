"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Award, CheckCircle, MessageSquare, UserPlus, UserMinus, ArrowLeft, Users, X } from 'lucide-react'
import { useTheme } from '../../../theme-provider'

function formatJoinedDate(dateValue: string | undefined) {
  if (!dateValue) return 'Unknown date'
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

type ActivityPost = {
  id: number
  author: string
  authorEmail?: string
  text: string
  date: string
  likes: number
  comments?: Array<{ id: number; author: string; text: string; date: string }>
}

export default function UserProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const targetUserId = params?.id as string

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileUser, setProfileUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Followers & Following Lists Modal States
  const [showModal, setShowModal] = useState<'followers' | 'following' | null>(null)
  const [modalUsersList, setModalUsersList] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)

  // Chat/DM alert state
  const [dmError, setDmError] = useState('')

  // Feed posts for this user
  const [activityPosts, setActivityPosts] = useState<ActivityPost[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !targetUserId) return

    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!storedUser || !token) {
      router.push('/auth/login')
      return
    }

    const parsedCurrentUser = JSON.parse(storedUser)
    setCurrentUser(parsedCurrentUser)

    // If viewing own profile, redirect to main profile page
    if (parsedCurrentUser.id === targetUserId) {
      router.replace('/dashboard/profile')
      return
    }

    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/users/${targetUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error('Failed to load profile details')
        }

        const data = await res.json()
        setProfileUser(data.user)

        // Load activity posts
        const storedFeed = window.localStorage.getItem('mybuko-explore-posts')
        if (storedFeed) {
          const parsedFeed = JSON.parse(storedFeed) as ActivityPost[]
          const userPosts = parsedFeed.filter(
            (post) =>
              post.authorEmail === data.user.email || post.author === data.user.name
          )
          setActivityPosts(userPosts)
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred loading the profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [targetUserId, router])

  const handleFollowToggle = async () => {
    if (!profileUser || !currentUser) return
    const token = localStorage.getItem('token')
    if (!token) return

    const currentlyFollowing = profileUser.isFollowing
    const updatedCount = currentlyFollowing
      ? Math.max(0, profileUser.followersCount - 1)
      : profileUser.followersCount + 1

    // Optimistic UI Update
    setProfileUser((prev: any) => ({
      ...prev,
      isFollowing: !currentlyFollowing,
      followersCount: updatedCount,
    }))

    try {
      if (currentlyFollowing) {
        // Unfollow
        const res = await fetch(`/api/follow?followingId=${encodeURIComponent(targetUserId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Unfollow request failed')
      } else {
        // Follow
        const res = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ followingId: targetUserId }),
        })
        if (!res.ok) throw new Error('Follow request failed')
      }

      // Re-fetch profile quietly to sync state
      const resSync = await fetch(`/api/users/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resSync.ok) {
        const syncData = await resSync.json()
        setProfileUser(syncData.user)
      }
    } catch (err) {
      console.error(err)
      // Rollback on failure
      setProfileUser((prev: any) => ({
        ...prev,
        isFollowing: currentlyFollowing,
        followersCount: profileUser.followersCount,
      }))
    }
  }

  const handleOpenListModal = async (type: 'followers' | 'following') => {
    setShowModal(type)
    setModalLoading(true)
    setModalUsersList([])

    try {
      const url = `/api/users/${targetUserId}/${type}`
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

  const handleStartChat = async () => {
    setDmError('')
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: targetUserId }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/chats/${data.chat.id}`)
      } else if (res.status === 403) {
        setDmError('Chat is only allowed between mutual followers. Make sure you follow each other!')
      } else {
        const errData = await res.json()
        setDmError(errData.error || 'Unable to start chat room.')
      }
    } catch (err) {
      console.error(err)
      setDmError('Network error starting chat.')
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gray-50 text-gray-900'}`}>
        <p className="text-lg font-semibold animate-pulse">Loading User Profile...</p>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className={`min-h-screen p-8 ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-md mx-auto text-center py-16">
          <p className="text-rose-500 font-bold text-xl mb-4">Error Loading Profile</p>
          <p className="mb-6">{error || 'User not found.'}</p>
          <Link href="/dashboard?tab=community" className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">
            Back to Community
          </Link>
        </div>
      </div>
    )
  }

  const joinedDate = formatJoinedDate(profileUser.createdAt)
  const stats = profileUser.stats || { totalGoals: 0, completedGoals: 0, inProgressGoals: 0, completionRate: 0 }
  const goalSetterUnlocked = stats.totalGoals > 0
  const firstVictoryUnlocked = stats.completedGoals > 0
  const powerUserUnlocked = stats.completedGoals >= 10

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-900'} p-8`}>
      <div className="max-w-5xl mx-auto">
        
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard?tab=community"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-opacity-80 ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
        </div>

        {/* Profile Card */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr,1.9fr] mb-6">
          <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-100'} rounded-[32px] shadow-xl p-8 space-y-6`}>
            <div className="flex flex-col items-center text-center">
              
              {/* Profile Pic */}
              <div className="relative w-28 h-28 rounded-[28px] overflow-hidden bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center mb-4">
                {profileUser.profileImage ? (
                  <img src={profileUser.profileImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="w-14 h-14 text-white" />
                )}
              </div>

              <h2 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{profileUser.name}</h2>
              <p className={`${isDark ? 'text-slate-300' : 'text-gray-500'} mt-1 text-sm`}>{profileUser.email}</p>
              <p className={`${isDark ? 'text-slate-400' : 'text-xs text-gray-500'} mt-3`}>Member since {joinedDate}</p>

              {/* Bio */}
              <div className="mt-5 w-full">
                <p className={`text-sm italic leading-relaxed px-4 py-3 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-150 text-gray-600'}`}>
                  {profileUser.bio || "No biography provided yet."}
                </p>
              </div>

              {/* DM/Chat Alerts */}
              {dmError && (
                <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 text-left w-full">
                  {dmError}
                </div>
              )}

              {/* Follow and Chat Controls */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition ${profileUser.isFollowing ? 'border bg-slate-200 text-gray-900 hover:bg-slate-350' : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:opacity-95'}`}
                >
                  {profileUser.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleStartChat}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 border font-semibold transition ${isDark ? 'bg-slate-750 text-slate-100 border-slate-700 hover:bg-slate-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>

            </div>
          </div>

          <div className="space-y-6">
            
            {/* Stats Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-150'} rounded-2xl shadow p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Total Goals</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{stats.totalGoals}</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-150'} rounded-2xl shadow p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedGoals}</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-150'} rounded-2xl shadow p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>In Progress</p>
                <p className="text-3xl font-bold text-orange-600">{stats.inProgressGoals}</p>
              </div>
              <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-150'} rounded-2xl shadow p-6`}>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Completion</p>
                <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
              </div>
            </div>

            {/* Social Grid (Followers / Following clicks trigger Modal) */}
            <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-100'} rounded-3xl shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Social Directory</h3>
                <div className="text-sm text-slate-400 flex items-center gap-1"><Users className="w-4 h-4" /> Instagram-style list</div>
              </div>

              <div className="flex items-center gap-10">
                <button
                  type="button"
                  onClick={() => handleOpenListModal('followers')}
                  className="text-left group focus:outline-none"
                >
                  <p className={`text-3xl font-bold group-hover:underline ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{profileUser.followersCount}</p>
                  <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>Followers</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenListModal('following')}
                  className="text-left group focus:outline-none"
                >
                  <p className={`text-3xl font-bold group-hover:underline ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{profileUser.followingCount}</p>
                  <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} text-sm`}>Following</p>
                </button>
              </div>
            </div>

            {/* Achievements Card */}
            <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-100'} rounded-3xl shadow p-8`}>
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-6 h-6" />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Achievements</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className={`rounded-3xl border p-5 transition ${goalSetterUnlocked ? (isDark ? 'bg-slate-800 border-slate-750' : 'bg-blue-50 border-blue-200') : (isDark ? 'bg-slate-900 border-slate-750 opacity-60' : 'bg-gray-50 border-gray-200 opacity-60')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>🎯 Goal Setter</p>
                    {goalSetterUnlocked && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Created at least one goal</p>
                </div>

                <div className={`rounded-3xl border p-5 transition ${firstVictoryUnlocked ? (isDark ? 'bg-slate-800 border-slate-750' : 'bg-green-50 border-green-200') : (isDark ? 'bg-slate-900 border-slate-750 opacity-60' : 'bg-gray-50 border-gray-200 opacity-60')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>✅ First Victory</p>
                    {firstVictoryUnlocked && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Completed at least one goal</p>
                </div>

                <div className={`rounded-3xl border p-5 transition ${powerUserUnlocked ? (isDark ? 'bg-slate-800 border-slate-750' : 'bg-purple-50 border-purple-200') : (isDark ? 'bg-slate-900 border-slate-750 opacity-60' : 'bg-gray-50 border-gray-200 opacity-60')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>🏆 Power User</p>
                    {powerUserUnlocked && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Completed 10 or more goals</p>
                </div>
              </div>
            </div>

            {/* Explore Feed Stories */}
            <div className={`${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border border-gray-100'} rounded-3xl shadow p-8`}>
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-emerald-600" />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Explore Activity</h2>
              </div>

              {activityPosts.length > 0 ? (
                <div className="space-y-4">
                  {activityPosts.map((post) => (
                    <div key={post.id} className={`${isDark ? 'bg-slate-900 border-slate-750' : 'bg-gray-50 border-gray-200'} rounded-2xl border p-5`}>
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{post.author}</p>
                        <span className="text-sm text-slate-550">{post.date}</span>
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
                <p className={`${isDark ? 'text-slate-350' : 'text-gray-600'} text-sm`}>
                  No shared community posts by this user yet.
                </p>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Followers / Following Modals */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md rounded-[32px] overflow-hidden border shadow-2xl transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-gray-150 text-gray-900'}`}>
            
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
                <p className="text-center text-slate-450 animate-pulse text-sm">Fetching list...</p>
              ) : modalUsersList.length === 0 ? (
                <p className="text-center text-slate-450 text-sm">No users found.</p>
              ) : (
                modalUsersList.map((usr) => (
                  <div
                    key={usr.id}
                    onClick={() => {
                      setShowModal(null)
                      router.push(`/dashboard/profile/${usr.id}`)
                    }}
                    className={`flex items-center gap-4 p-3 rounded-2xl border transition cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-850' : 'bg-gray-50 border-gray-100 hover:bg-gray-100/60'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
                      {usr.name.split(' ').map((s:string) => s[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{usr.name}</p>
                      <p className="text-xs text-slate-450 truncate">{usr.email}</p>
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
