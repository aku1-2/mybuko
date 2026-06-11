"use client"

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Heart, Send, Camera, TrendingUp, Trophy, Users, MessageSquare, 
  Sparkles, Award, Zap, Eye, Hash, Shield, X, Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Comment = {
  id: number | string
  author: string
  text: string
  date: string
}

type Post = {
  id: string | number
  author: string
  authorEmail?: string
  profileImage?: string
  role: string
  text: string
  image?: string
  date: string
  likes: number
  liked?: boolean
  comments: Comment[]
  views: number
  reactions?: string[]
}

type PublicGoal = {
  id: string
  title: string
  description?: string
  category?: string
  budget?: number | null
  priority?: string
  difficulty?: string
  status?: string
  progress?: number
  createdAt: string
  user?: {
    name: string
    email: string
    profileImage?: string
  }
}

const FOLLOWING_KEY = 'mybuko-following'

const getRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'yesterday'
  return `${diffDay}d ago`
}

const formatPostDate = (dateVal: any) => {
  if (!dateVal) return 'just now'
  if (typeof dateVal === 'string' && (dateVal.includes('ago') || dateVal.toLowerCase() === 'just now' || dateVal.toLowerCase() === 'yesterday')) {
    return dateVal
  }
  const date = new Date(dateVal)
  if (isNaN(date.getTime())) {
    const numVal = Number(dateVal)
    if (!isNaN(numVal)) {
      return getRelativeTime(new Date(numVal))
    }
    return String(dateVal)
  }
  return getRelativeTime(date)
}

export default function ExploreFeed({ searchTerm = '' }: { searchTerm?: string }) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [author, setAuthor] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [isInitiatingChat, setIsInitiatingChat] = useState(false)
  
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentUserEmailState, setCurrentUserEmailState] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [text, setText] = useState('')
  const [image, setImage] = useState('')
  const [imageName, setImageName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [goalJoined, setGoalJoined] = useState(false)
  const [activeCommentPost, setActiveCommentPost] = useState<string | number | null>(null)
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const [publicGoals, setPublicGoals] = useState<PublicGoal[]>([])
  const [publicGoalsLoading, setPublicGoalsLoading] = useState(true)
  const [publicGoalsError, setPublicGoalsError] = useState('')

  // Dynamic topics/tags parsed from DB
  const [trendingTopics, setTrendingTopics] = useState<Array<{ tag: string, count: number }>>([])

  // AI-generated challenges
  const [challenges, setChallenges] = useState<any[]>([])
  const [loadingChallenges, setLoadingChallenges] = useState(true)
  const [joinedChallengeTitles, setJoinedChallengeTitles] = useState<string[]>([])

  // Real Database Leaderboard state
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)

  // Followers & Following list for direct sharing
  const [connections, setConnections] = useState<any[]>([])
  const [sharingPost, setSharingPost] = useState<Post | null>(null)
  const [sharingStatus, setSharingStatus] = useState('')

  const handleUserClick = async (email: string | undefined) => {
    if (!email) {
      alert("This is a seed post template. You can view profiles and start chats with registered members who post on the feed!")
      return
    }
    try {
      const res = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/profile/${data.id}`)
      }
    } catch (err) {
      console.error('User profile redirect failed:', err)
    }
  }

  const handleMessageClick = async (email: string | undefined) => {
    if (!email || isInitiatingChat) return
    setIsInitiatingChat(true)
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      setIsInitiatingChat(false)
      return
    }

    try {
      const userRes = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`)
      if (!userRes.ok) {
        alert('Could not find user details.')
        setIsInitiatingChat(false)
        return
      }
      const userData = await userRes.json()
      
      const chatRes = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: userData.id }),
      })

      if (chatRes.ok) {
        const chatData = await chatRes.json()
        router.push(`/dashboard/chats/${chatData.chat.id}`)
      } else if (chatRes.status === 403) {
        alert('Chatting is only allowed between mutual followers. Make sure you follow each other!')
        setIsInitiatingChat(false)
      } else {
        alert('Unable to start a conversation with this user.')
        setIsInitiatingChat(false)
      }
    } catch (err) {
      console.error(err)
      alert('Error initiating chat room.')
      setIsInitiatingChat(false)
    }
  }

  const fetchPosts = async () => {
    setLoadingPosts(true)
    try {
      const res = await fetch('/api/posts')
      if (res.ok) {
        const data = await res.json()
        const dbPosts = data.posts || []
        
        const storedUser = window.localStorage.getItem('user')
        const parsedUser = storedUser ? JSON.parse(storedUser) : null
        const currentUserId = parsedUser?.id || ''

        const mappedPosts = dbPosts.map((p: any) => ({
          id: p.id,
          author: p.user.name,
          authorEmail: p.user.email,
          profileImage: p.user.profileImage || undefined,
          role: 'Dream Builder',
          text: p.text,
          image: p.image || undefined,
          date: p.createdAt,
          likes: p.likes?.length || 0,
          liked: p.likes?.some((l: any) => l.userId === currentUserId) || false,
          views: (p.likes?.length || 0) * 11 + p.text.length + 15,
          comments: (p.comments || []).map((c: any) => ({
            id: c.id,
            author: c.user?.name || 'Dream Builder',
            text: c.content,
            date: c.createdAt
          }))
        }))
        setPosts(mappedPosts)
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoadingPosts(false)
    }
  }

  // Fetch real leaderboard stats from the new dynamic database endpoint
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/community/leaderboard', { headers })
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  // Parse trending hashtags dynamically from DB posts and goals
  useEffect(() => {
    if (posts.length > 0 || publicGoals.length > 0) {
      const counts: Record<string, number> = {}
      
      // Parse hashtags from actual posts
      posts.forEach(p => {
        const hashtags = p.text.match(/#\w+/g)
        if (hashtags) {
          hashtags.forEach(h => {
            const clean = h.replace('#', '')
            counts[clean] = (counts[clean] || 0) + 1
          })
        }
      })

      // Parse categories of public goals
      publicGoals.forEach(g => {
        if (g.category) {
          counts[g.category] = (counts[g.category] || 0) + 1
        }
      })

      const topicsList = Object.entries(counts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)

      if (topicsList.length === 0) {
        setTrendingTopics([
          { tag: 'Skills', count: 3 },
          { tag: 'Travel', count: 2 },
          { tag: 'Health', count: 2 }
        ])
      } else {
        setTrendingTopics(topicsList.slice(0, 5))
      }
    }
  }, [posts, publicGoals])

  // Generate random live challenges using AI recommendations
  useEffect(() => {
    const fetchAiChallenges = async () => {
      setLoadingChallenges(true)
      try {
        const categories = ['Skills', 'Health', 'Adventure', 'Personal', 'Travel']
        const randomCat = categories[Math.floor(Math.random() * categories.length)]
        
        const res = await fetch('/api/ai/recommend-goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '',
            description: '',
            category: randomCat,
            budget: '',
            targetDate: '',
            userGoals: []
          })
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.recommendations) {
            const list = data.recommendations.map((rec: any, index: number) => ({
              title: rec.title,
              participants: Math.floor(Math.random() * 180) + 30,
              xp: 150 * (index + 2),
              emoji: randomCat === 'Skills' ? '💻' : randomCat === 'Health' ? '🏃' : randomCat === 'Adventure' ? '⛰️' : randomCat === 'Travel' ? '✈️' : '🎯'
            }))
            setChallenges(list)
            setLoadingChallenges(false)
            return
          }
        }
      } catch (err) {
        console.error('Failed to generate AI challenges:', err)
      }
      
      // Fallback
      setChallenges([
        { title: 'Master React 19 Ecosystem', participants: 142, xp: 500, emoji: '💻' },
        { title: 'Morning Jog 20m Daily', participants: 98, xp: 350, emoji: '🏃' },
        { title: 'Track Weekly Milestones', participants: 65, xp: 200, emoji: '📊' }
      ])
      setLoadingChallenges(false)
    }

    if (isLoggedIn) {
      fetchAiChallenges()
    }
  }, [isLoggedIn])

  // Fetch follower/following connections list for chat sharing
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) return
        const parsed = JSON.parse(storedUser)
        
        const resF = await fetch(`/api/users/${parsed.id}/followers`)
        const resG = await fetch(`/api/users/${parsed.id}/following`)
        
        if (resF.ok && resG.ok) {
          const fData = await resF.json()
          const gData = await resG.json()
          
          const followers = fData.followers || []
          const followingList = gData.following || []
          
          const combined = [...followers, ...followingList]
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
          setConnections(unique)
        }
      } catch (err) {
        console.error('Error fetching connections:', err)
      }
    }
    
    if (isLoggedIn) {
      fetchConnections()
    }
  }, [isLoggedIn])

  useEffect(() => {
    setIsMounted(true)
    if (typeof window === 'undefined') return

    fetchPosts()
    fetchLeaderboard()

    const fetchPublicGoals = async () => {
      setPublicGoalsLoading(true)
      setPublicGoalsError('')

      try {
        const response = await fetch('/api/goals/explore')
        if (!response.ok) throw new Error('Failed to load public goals')

        const goals = (await response.json()) as PublicGoal[]
        setPublicGoals(goals)
      } catch (error) {
        setPublicGoalsError('Unable to load public goals right now.')
      } finally {
        setPublicGoalsLoading(false)
      }
    }

    fetchPublicGoals()

    const storedFollowing = window.localStorage.getItem(FOLLOWING_KEY)
    if (storedFollowing) {
      try {
        setFollowing(JSON.parse(storedFollowing))
      } catch {}
    }
    try {
      const storedUser = window.localStorage.getItem('user')
      const storedToken = window.localStorage.getItem('token')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null

      if (parsedUser?.name) {
        setAuthor(parsedUser.name)
        setCurrentUserName(parsedUser.name)
      }
      if (parsedUser?.email) {
        setCurrentUserEmailState(parsedUser.email)
      }
      const loggedIn = Boolean(parsedUser && storedToken)
      setIsLoggedIn(loggedIn)

      if (loggedIn && parsedUser?.id) {
        const fetchDbFollowing = async () => {
          try {
            const res = await fetch(`/api/users/${parsedUser.id}/following`)
            if (res.ok) {
              const data = await res.json()
              const map: Record<string, boolean> = {}
              ;(data.following || []).forEach((f: any) => {
                map[f.name] = true
                if (f.email) map[f.email] = true
              })
              setFollowing(map)
            }
          } catch (err) {
            console.error('Failed to sync following list from DB:', err)
          }
        }
        fetchDbFollowing()
      }
    } catch {
      // ignore user load errors
    }
  }, [])

  async function toggleFollow(post: Post) {
    const authorVal = post.author
    const email = post.authorEmail || ''
    const isNowFollowing = !(following[email] || following[authorVal])

    setFollowing((prev) => ({ 
      ...prev, 
      [authorVal]: isNowFollowing,
      ...(email ? { [email]: isNowFollowing } : {})
    }))

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (token && email) {
        const lookup = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`)
        if (lookup.ok) {
          const data = await lookup.json()
          const targetId = data.id
          if (isNowFollowing) {
            await fetch('/api/follow', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ followingId: targetId }) })
          } else {
            await fetch(`/api/follow?followingId=${encodeURIComponent(targetId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
          }
          return
        }
      }
    } catch (err) {
      console.error('Follow API error', err)
      setFollowing((prev) => ({ 
        ...prev, 
        [authorVal]: !isNowFollowing,
        ...(email ? { [email]: !isNowFollowing } : {})
      }))
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(FOLLOWING_KEY, JSON.stringify(following))
    } catch {}
  }, [following])

  const canSubmit = isLoggedIn && author.trim().length > 0 && text.trim().length > 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text.trim(),
          image: image || null
        })
      })

      if (res.ok) {
        setText('')
        setImage('')
        setImageName('')
        setSubmitted(true)
        window.setTimeout(() => setSubmitted(false), 2600)
        fetchPosts()
      } else {
        alert('Failed to share story.')
      }
    } catch (err) {
      console.error(err)
      alert('Error sharing story.')
    }
  }

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImage('')
      setImageName('')
      return
    }

    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const toggleLike = async (id: string | number) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== id) return post
        const liked = !post.liked
        return {
          ...post,
          liked,
          likes: liked ? post.likes + 1 : Math.max(post.likes - 1, 0),
        }
      })
    )

    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch(`/api/posts/${id}/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (err) {
      console.error('Failed to toggle like on server:', err)
    }
  }

  // Handle direct sharing to user's follower/following via chats API
  const handleShareToConnection = async (conn: any) => {
    if (!sharingPost) return
    setSharingStatus('Sharing...')
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const chatRes = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ participantId: conn.id })
      })

      if (chatRes.ok) {
        const chatData = await chatRes.json()
        const chatId = chatData.chat.id

        const msgRes = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            text: `Community Share: Check out this post from ${sharingPost.author}:\n\n"${sharingPost.text.slice(0, 100)}..."`
          })
        })

        if (msgRes.ok) {
          setSharingStatus(`Post shared to ${conn.name}!`)
          setTimeout(() => {
            setSharingPost(null)
            setSharingStatus('')
          }, 1500)
        }
      }
    } catch (err) {
      console.error(err)
      setSharingStatus('Error sharing.')
    }
  }

  // Action function to add challenge as goal to user dashboard and update leaderboard XP
  const handleJoinChallenge = async (challenge: any) => {
    await joinGoal({
      title: challenge.title,
      description: `AI-Recommended Live Community Challenge (+${challenge.xp} XP)`,
      category: 'Skills'
    })
    setJoinedChallengeTitles(prev => [...prev, challenge.title])
    
    // Dynamic leaderboard update after logging goal
    setTimeout(() => {
      fetchLeaderboard()
    }, 1200)
  }

  const joinGoal = async (goal: { title: string; description?: string; category?: string }) => {
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null
      if (!currentUser) return

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (token) {
        try {
          const res = await fetch('/api/goals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: goal.title,
              description: goal.description || '',
              category: goal.category || 'Personal',
              targetDate: null,
              progress: 0,
              status: 'Not Started'
            })
          })
          if (res.ok) {
            setGoalJoined(true)
            return
          }
        } catch (err) {
          console.error(err)
        }
      }
      setGoalJoined(true)
    } catch {
      setGoalJoined(true)
    }
  }

  const handleCommentChange = (postId: string | number, value: string) => {
    setCommentDrafts((drafts) => ({ ...drafts, [postId]: value }))
  }

  const handleAddComment = async (postId: string | number) => {
    const commentText = commentDrafts[postId]?.trim()
    if (!commentText) return

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      })

      if (res.ok) {
        const data = await res.json()
        const newComment = {
          id: data.comment.id,
          author: data.comment.user.name,
          text: data.comment.content,
          date: new Date(data.comment.createdAt).toLocaleDateString()
        }

        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id !== postId
              ? post
              : {
                  ...post,
                  comments: [...post.comments, newComment]
                }
          )
        )
        setCommentDrafts((drafts) => ({ ...drafts, [postId]: '' }))
      } else {
        alert('Failed to post comment.')
      }
    } catch (err) {
      console.error(err)
      alert('Error posting comment.')
    }
  }

  const visiblePosts = searchTerm
    ? posts.filter(post => 
        post.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : posts

  const visibleGoals = searchTerm
    ? publicGoals.filter(goal => 
        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (goal.description && goal.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : publicGoals

  return (
    <div className="relative">
      
      {/* Locked Overlay if not logged in */}
      {!isLoggedIn && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-955/70 backdrop-blur-md p-6 rounded-[2.5rem] min-h-[600px]">
          <div className="max-w-md text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-white font-display">Feed is locked</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Sign in or create a MyBuko account to participate in community stories, see trending goals, follow peers, and share your growth milestones.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-full font-bold hover:shadow-lg transition-all text-sm"
              >
                Login to unlock
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-3 border border-white/10 bg-white/5 text-slate-200 rounded-full font-bold hover:bg-white/10 transition-all text-sm"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Spacious 2-Column Desktop Grid Layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-start ${!isLoggedIn ? 'filter blur-md select-none pointer-events-none opacity-40' : ''}`}>
        
        {/* LEFT COMPONENT: Primary feed (8 cols) */}
        <main className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Create Post Card */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 shadow-sm space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {author ? author[0].toUpperCase() : 'U'}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Document your milestones or ask the community..."
                  className="flex-1 bg-transparent text-sm placeholder-slate-400 focus:outline-none resize-none pt-2 min-h-[90px]"
                />
              </div>

              {image && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 p-1">
                  <img src={image} className="max-h-48 w-full object-cover rounded-xl" alt="upload preview" />
                  <button 
                    type="button" 
                    onClick={() => { setImage(''); setImageName('') }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
                <label className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 cursor-pointer transition">
                  <Camera className="w-4 h-4" />
                  <span>Attach Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!canSubmit}
                  className="px-6 py-2.5 rounded-full text-xs font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-500 hover:shadow-lg"
                >
                  Share Story
                </motion.button>
              </div>
            </form>
          </div>

          {/* Public Goals Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">Public Goals Feed</h3>
            
            {publicGoalsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 rounded-3xl bg-slate-200 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : visibleGoals.length === 0 ? (
              <div className="p-8 rounded-3xl border border-slate-200/60 dark:border-white/5 text-center text-xs text-slate-400">
                No public goals posted yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {visibleGoals.map(goal => (
                  <motion.article 
                    whileHover={{ y: -2 }}
                    key={goal.id}
                    className="p-5 rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400">
                          {goal.category || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{goal.status || 'Not Started'}</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{goal.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{goal.description || 'No description provided.'}</p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-indigo-405">Progress: {goal.progress ?? 0}%</span>
                        {goal.user && (
                          <span 
                            onClick={() => handleUserClick(goal.user?.email)}
                            className="cursor-pointer hover:underline font-bold text-slate-350"
                          >
                            By {goal.user.name.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${goal.progress ?? 0}%` }} />
                      </div>

                      <button
                        onClick={() => joinGoal({ title: goal.title, description: goal.description, category: goal.category })}
                        disabled={!isLoggedIn}
                        className="w-full py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-[10px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition"
                      >
                        Join Goal Trend
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>

          {/* Spotlight Feed */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">Spotlight Feed</h3>

            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-64 rounded-[2.5rem] bg-slate-200 dark:bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="py-12 text-center rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 text-xs text-slate-400">
                No community stories published yet. Be the first to share one!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {visiblePosts.map(post => (
                  <motion.article 
                    whileHover={{ y: -2 }}
                    key={post.id}
                    className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm overflow-hidden"
                  >
                    {/* Header info */}
                    <div className="p-6 pb-4 flex justify-between items-start gap-4">
                      <div 
                        onClick={() => handleUserClick(post.authorEmail)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        {post.profileImage ? (
                          <img src={post.profileImage} className="w-11 h-11 rounded-full object-cover border border-white/10" alt="avatar" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-850 flex items-center justify-center text-white font-black">
                            {post.author[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white hover:underline">{post.author}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{post.role} • {formatPostDate(post.date)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {post.authorEmail && post.authorEmail !== currentUserEmailState && (
                          <button
                            onClick={() => handleMessageClick(post.authorEmail)}
                            className="p-2 rounded-full border border-slate-200/60 dark:border-white/5 text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                            title="Direct Message"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleFollow(post)}
                          className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase transition ${
                            following[post.authorEmail || ''] || following[post.author]
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          {following[post.authorEmail || ''] || following[post.author] ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>

                    {/* Text description */}
                    <div className="px-6 pb-4">
                      <p className="text-xs leading-relaxed text-slate-750 dark:text-slate-300">{post.text}</p>
                    </div>

                    {/* Post Image */}
                    {post.image && (
                      <div className="max-h-[500px] overflow-hidden border-y border-slate-100 dark:border-white/5 bg-slate-950/30 flex items-center justify-center">
                        <img src={post.image} className="w-full max-h-[500px] object-contain" alt="Post visual" />
                      </div>
                    )}

                    {/* Card Actions bar - ONLY heart like, comment, views count, share */}
                    <div className="px-6 py-4 flex justify-between items-center border-t border-slate-100 dark:border-white/5 text-xs text-slate-400 font-semibold bg-slate-50/20 dark:bg-slate-950/20">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1.5 transition ${post.liked ? 'text-rose-505' : 'hover:text-rose-500'}`}
                        >
                          <Heart className={`w-4 h-4 ${post.liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{post.likes}</span>
                        </button>

                        <button 
                          onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                          className="flex items-center gap-1.5 hover:text-indigo-400"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments.length}</span>
                        </button>
                      </div>

                      <div className="flex gap-4 items-center">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 select-none">
                          <Eye className="w-3.5 h-3.5" />
                          {post.views} views
                        </span>
                        
                        {/* Share Button (triggers connection share panel) */}
                        <button 
                          onClick={() => setSharingPost(post)} 
                          className="hover:text-indigo-400 p-1.5 rounded-full hover:bg-white/5 transition"
                          title="Share to chat"
                        >
                          <Send className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Comments Toggle */}
                    <AnimatePresence>
                      {activeCommentPost === post.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/30 p-5 space-y-4"
                        >
                          {post.comments.length > 0 && (
                            <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                              {post.comments.map(c => (
                                <div key={c.id} className="text-xs bg-white dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5 space-y-1">
                                  <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                                    <span>{c.author}</span>
                                    <span className="text-[9px] text-slate-400">{formatPostDate(c.date)}</span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-355">{c.text}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <input
                              value={commentDrafts[post.id] || ''}
                              onChange={(e) => handleCommentChange(post.id, e.target.value)}
                              placeholder="Write a comment..."
                              className="flex-1 text-xs rounded-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-500 text-slate-900 dark:text-slate-100"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold"
                            >
                              Reply
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.article>
                ))}
              </div>
            )}
          </div>

        </main>

        {/* RIGHT COMPONENT: Consolidated stacked side widgets (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-24">
          
          {/* Weekly Contributor Leaderboard (PODIUM STYLE) */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-405 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
              Leaderboard Podium
            </h3>

            {leaderboardLoading ? (
              <div className="py-6 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex justify-between items-end gap-1.5 pt-6 pb-2">
                {/* 2nd Place (Left) */}
                {leaderboard[1] && (
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-lg">🥈</span>
                    {leaderboard[1].profileImage ? (
                      <img src={leaderboard[1].profileImage} className="w-11 h-11 rounded-full object-cover border-2 border-slate-400" alt="avatar" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-500 text-slate-150 font-black text-xs shadow-md">
                        {leaderboard[1].name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-[10px] font-black text-slate-350 mt-1.5 truncate max-w-[60px] text-center">{leaderboard[1].name}</p>
                    <span className="text-[9px] text-slate-550 font-bold">{leaderboard[1].xp} XP</span>
                    <div className="w-full h-8 bg-slate-800/40 dark:bg-white/5 rounded-t-xl mt-2 flex items-center justify-center text-[9px] font-black text-slate-450 border-t border-slate-700">2nd</div>
                  </div>
                )}
                
                {/* 1st Place (Center) */}
                {leaderboard[0] && (
                  <div className="flex flex-col items-center flex-1 relative -top-2">
                    <span className="text-xl animate-bounce">👑</span>
                    {leaderboard[0].profileImage ? (
                      <img src={leaderboard[0].profileImage} className="w-14 h-14 rounded-full object-cover border-2 border-amber-350" alt="avatar" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center border-2 border-amber-300 text-slate-955 font-black text-sm shadow-lg shadow-yellow-500/20">
                        {leaderboard[0].name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-[11px] font-black text-white mt-1.5 truncate max-w-[70px] text-center">{leaderboard[0].name}</p>
                    <span className="text-[10px] text-amber-450 font-black">{leaderboard[0].xp} XP</span>
                    <div className="w-full h-12 bg-gradient-to-t from-yellow-500/10 to-amber-500/20 rounded-t-xl mt-2 flex items-center justify-center text-xs font-black text-amber-300 border-t border-amber-500/30">1st</div>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {leaderboard[2] && (
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-lg">🥉</span>
                    {leaderboard[2].profileImage ? (
                      <img src={leaderboard[2].profileImage} className="w-9 h-9 rounded-full object-cover border-2 border-amber-800" alt="avatar" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center border-2 border-amber-800 text-slate-300 font-bold text-[10px] shadow-sm">
                        {leaderboard[2].name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-[10px] font-black text-slate-350 mt-1.5 truncate max-w-[55px] text-center">{leaderboard[2].name}</p>
                    <span className="text-[9px] text-slate-550 font-bold">{leaderboard[2].xp} XP</span>
                    <div className="w-full h-6 bg-slate-800/20 dark:bg-white/5 rounded-t-xl mt-2 flex items-center justify-center text-[8px] font-black text-slate-500 border-t border-slate-800">3rd</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Challenges (AI-GENERATED RECOMMENDATIONS WITH JOIN OPTION) */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-500 animate-pulse" />
                Live Challenges
              </h3>
              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded uppercase">AI Coach</span>
            </div>

            <div className="space-y-3">
              {loadingChallenges ? (
                <div className="space-y-2 py-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                challenges.map(c => {
                  const hasJoined = joinedChallengeTitles.includes(c.title)
                  return (
                    <div key={c.title} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 space-y-2 border dark:border-white/5 border-slate-100 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[150px]">{c.emoji} {c.title}</p>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-1.5 py-0.5 rounded shrink-0">+{c.xp} XP</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5">
                        <p className="text-[10px] text-slate-500">{c.participants} competing</p>
                        <button
                          onClick={() => handleJoinChallenge(c)}
                          disabled={hasJoined || !isLoggedIn}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition ${
                            hasJoined 
                              ? 'bg-emerald-500/15 text-emerald-450 cursor-default' 
                              : isLoggedIn 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-102' 
                                : 'bg-slate-400 text-white cursor-not-allowed'
                          }`}
                        >
                          {hasJoined ? 'Joined ✓' : 'Join'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Trending hashtags list (REAL DATA FROM DB) */}
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-indigo-500" />
              Trending Topics
            </h3>

            <div className="space-y-2.5">
              {trendingTopics.map(item => (
                <div key={item.tag} className="flex justify-between items-center text-xs group cursor-pointer hover:translate-x-1 transition-transform">
                  <span className="font-semibold text-slate-650 dark:text-slate-350 group-hover:text-indigo-505">
                    #{item.tag}
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-slate-400">
                    {item.count} items
                  </span>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>

      {/* Share to chat connections overlay modal */}
      <AnimatePresence>
        {sharingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-[2rem] p-6 border shadow-2xl backdrop-blur-xl bg-slate-900 border-white/5 text-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-indigo-400" />
                  Share to Connection
                </h3>
                <button 
                  onClick={() => setSharingPost(null)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {sharingStatus && (
                <p className="text-xs text-indigo-400 font-bold mb-3 text-center">{sharingStatus}</p>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                {connections.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No followers or following to share with.</p>
                ) : (
                  connections.map(conn => (
                    <button
                      key={conn.id}
                      onClick={() => handleShareToConnection(conn)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-left transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-black">
                        {conn.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{conn.name}</p>
                        <p className="text-[10px] text-slate-400">Click to send in DM</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}