"use client"

import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { ImagePlus, Heart, Send, Camera, TrendingUp, Trophy, Users } from 'lucide-react'

type Comment = {
  id: number
  author: string
  text: string
  date: string
}

type Post = {
  id: number
  author: string
  authorEmail?: string
  role: string
  text: string
  image?: string
  date: string
  likes: number
  liked?: boolean
  comments: Comment[]
}

type TrendingGoal = {
  id: string
  title: string
  subtitle: string
}

const STORAGE_KEY = 'mybuko-explore-posts'
const FOLLOWING_KEY = 'mybuko-following'
const TRENDING_GOALS: TrendingGoal[] = [
  { id: 'learn-web', title: 'Learn Web Development', subtitle: 'Build your next portfolio or landing page' },
  { id: 'get-fit', title: 'Get Fit in 90 Days', subtitle: 'Track workouts and wellness goals' },
  { id: 'save-money', title: 'Save ₹50,000', subtitle: 'Plan savings with weekly milestones' },
  { id: 'start-business', title: 'Start a Business', subtitle: 'Map your idea, launch, and grow' },
  { id: 'read-books', title: 'Read 24 Books', subtitle: 'Set a reading goal and share the best takeaways' },
]

const initialPosts: Post[] = [
  {
    id: 1,
    author: 'Ananya',
    authorEmail: '',
    role: 'Traveler',
    text: 'MyBuko helped me finally book the mountain trek I always dreamed of. The planner made everything feel simple and exciting!',
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80',
    date: '2 days ago',
    likes: 148,
    liked: false,
    comments: [
      { id: 101, author: 'Riya', text: 'This looks amazing! How did you manage the planning?', date: '1 day ago' },
    ],
  },
  {
    id: 2,
    author: 'Kabir',
    authorEmail: '',
    role: 'Fitness Enthusiast',
    text: 'Just completed my first 10K run using the weekly habit tracker. The small daily prompts kept me consistent and motivated.',
    image: 'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=900&q=80',
    date: '5 hours ago',
    likes: 100,
    liked: false,
    comments: [
      { id: 102, author: 'Neha', text: 'Amazing work, Kabir! What was your favorite training tip?', date: '3 hours ago' },
    ],
  },
  {
    id: 3,
    author: 'Sonal',
    authorEmail: '',
    role: 'Freelance Designer',
    text: 'I used MyBuko to organize my client workflow and it finally feels like my projects are under control. The deadline reminders are a lifesaver.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    date: '1 day ago',
    likes: 60,
    liked: false,
    comments: [
      { id: 103, author: 'Arjun', text: 'Love the energy here! How long did it take you to build the routine?', date: '20 hours ago' },
    ],
  },
  {
    id: 4,
    author: 'Devika',
    authorEmail: '',
    role: 'Product Manager',
    text: 'Using MyBuko for sprint planning made our team more predictable and reduced last-minute work. Highly recommend the milestone view.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    date: '3 days ago',
    likes: 58,
    liked: false,
    comments: [
      { id: 104, author: 'Sam', text: 'Great to hear — which milestone feature helped most?', date: '2 days ago' },
    ],
  },
]

export default function ExploreFeed() {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [author, setAuthor] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [text, setText] = useState('')
  const [image, setImage] = useState('')
  const [imageName, setImageName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [goalJoined, setGoalJoined] = useState(false)
  const [activeTrendingGoal, setActiveTrendingGoal] = useState<TrendingGoal>(TRENDING_GOALS[0])
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null)
  const [following, setFollowing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Post[]
        const cleaned = parsed
          .map((post) => ({
            ...post,
            comments: post.comments ?? [],
            liked: post.liked ?? false,
          }))
          .filter((post) => {
            return !(
              (post.author === 'Meera' && post.text.includes('The experience feed feels so lively')) ||
              post.author === 'Vikram'
            )
          })
        setPosts(cleaned)
      }
    } catch {
      // ignore local storage read errors
    }
    const storedFollowing = window.localStorage.getItem(FOLLOWING_KEY)
    if (storedFollowing) {
      try {
        setFollowing(JSON.parse(storedFollowing))
      } catch {}
    }
    try {
      const storedUser = window.localStorage.getItem('user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser?.name) {
          setAuthor(parsedUser.name)
          setCurrentUserName(parsedUser.name)
        }
        if (parsedUser?.email) {
          setCurrentUserEmail(parsedUser.email)
        }
      }
    } catch {
      // ignore user load errors
    }
  }, [])

  function toggleFollow(author: string) {
    setFollowing((prev) => {
      const next = { ...prev, [author]: !prev[author] }
      return next
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(FOLLOWING_KEY, JSON.stringify(following))
    } catch {}
  }, [following])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    } catch {
      // ignore local storage write errors
    }
  }, [posts])

  const canSubmit = author.trim().length > 0 && text.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) return

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const currentUser = storedUser ? JSON.parse(storedUser) : null

    const newPost: Post = {
      id: Date.now(),
      author: author.trim() || currentUser?.name || 'Community Member',
      authorEmail: currentUser?.email,
      role: 'Community Member',
      text: text.trim(),
      image: image || undefined,
      date: 'Just now',
      likes: 0,
      liked: false,
      comments: [],
    }

    setPosts((currentPosts) => [newPost, ...currentPosts])
    setAuthor('')
    setText('')
    setImage('')
    setImageName('')
    setSubmitted(true)
    window.setTimeout(() => setSubmitted(false), 2600)
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

  const toggleLike = (id: number) => {
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
  }

  const handleShare = async (post: Post) => {
    const shareText = `${post.author} (${post.role}) shared on MyBuko:\n\n${post.text}${post.image ? `\n\nImage: ${post.image}` : ''}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `MyBuko story by ${post.author}`,
          text: shareText,
        })
        return
      }

      await navigator.clipboard.writeText(shareText)
      setShareMessage('Post copied to clipboard!')
      window.setTimeout(() => setShareMessage(''), 2600)
    } catch {
      setShareMessage('Unable to share right now. Please try again.')
      window.setTimeout(() => setShareMessage(''), 2600)
    }
  }

  const joinGoal = (goal: { title: string; description?: string; category?: string }) => {
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null

      const joinedKey = 'mybuko-joined-goals'
      const existing = typeof window !== 'undefined' ? localStorage.getItem(joinedKey) : null
      const parsed = existing ? JSON.parse(existing) : []

      const newGoal = {
        id: `local-${Date.now()}`,
        title: goal.title,
        description: goal.description || '',
        category: goal.category || 'Personal',
        targetDate: null,
        progress: 0,
        status: 'Not Started',
        ownerEmail: currentUser?.email,
        ownerName: currentUser?.name,
      }

      const already = parsed.find((g: any) => g.title === newGoal.title && (g.ownerEmail === newGoal.ownerEmail || g.ownerName === newGoal.ownerName))
      if (!already) {
        parsed.unshift(newGoal)
        try {
          localStorage.setItem(joinedKey, JSON.stringify(parsed))
        } catch {
          // ignore
        }
      }

      setGoalJoined(true)
    } catch {
      setGoalJoined(true)
    }
  }

  const visiblePosts = posts.filter((post) => {
    if (!currentUserName && !currentUserEmail) return true
    return post.authorEmail !== currentUserEmail && post.author !== currentUserName
  })

  const handleCommentChange = (postId: number, value: string) => {
    setCommentDrafts((drafts) => ({ ...drafts, [postId]: value }))
  }

  const handleAddComment = (postId: number) => {
    const commentText = commentDrafts[postId]?.trim()
    if (!commentText) return

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id !== postId
          ? post
          : {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: Date.now(),
                  author: 'You',
                  text: commentText,
                  date: 'Just now',
                },
              ],
            }
      )
    )

    setCommentDrafts((drafts) => ({ ...drafts, [postId]: '' }))
    setActiveCommentPost(postId)
  }

  return (
    <section id="explore" className="py-20 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-slate-950 dark:via-slate-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm shadow-sm ring-1 ring-emerald-200">
            <Camera className="w-4 h-4" />
            Explore Stories
          </div>
          <h2 className="mt-5 text-4xl md:text-5xl font-bold text-slate-900 tracking-tight dark:text-white">
            Share your experience with MyBuko
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Write about how you used the app, what you felt, and add an image to inspire others. Every story makes the community stronger.
          </p>
          {shareMessage ? (
            <div className="mx-auto mt-6 inline-flex items-center rounded-3xl bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-100">
              {shareMessage}
            </div>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-emerald-200 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(16,185,129,0.45)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_-35px_rgba(16,185,129,0.35)] dark:border-emerald-400/20 dark:bg-slate-950/90">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Share your story</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">A simple post to show how MyBuko helped you grow.</p>
                </div>
                <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-emerald-700 font-semibold text-sm">
                  + Good Vibes
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Your Name
                    <input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Ananya"
                      className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                  </label>
                  <label className="space-y-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Add a photo (optional)
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 dark:border-emerald-500/40 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400" htmlFor="explore-image-upload">
                        <ImagePlus className="w-4 h-4" />
                        Choose photo
                      </label>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{imageName || 'No file selected yet'}</span>
                    </div>
                    <input
                      id="explore-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Your Experience
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    placeholder="Tell us how MyBuko helped you plan something special..."
                    className="w-full rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your story will appear instantly for the community.</p>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    Share Post
                  </button>
                </div>

                {submitted && (
                  <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
                    Your story is live! Thank you for sharing.
                  </p>
                )}
              </form>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[32px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-[0_26px_70px_-40px_rgba(16,185,129,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_-35px_rgba(16,185,129,0.6)] dark:border-emerald-400/20 dark:from-slate-900 dark:via-slate-950 dark:to-teal-900 lg:sticky lg:top-28">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-emerald-700 font-semibold">Trending Goals</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">See what the community is currently working on.</h3>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm dark:bg-emerald-600/15 dark:text-emerald-100">Live</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {TRENDING_GOALS.map((goal) => {
                  const isActive = activeTrendingGoal.id === goal.id
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setActiveTrendingGoal(goal)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${isActive ? 'border-emerald-600 bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'border-emerald-200 bg-emerald-100 text-emerald-900 hover:scale-[1.03] hover:border-emerald-300 hover:bg-emerald-200 hover:text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/25'}`}
                    >
                      {goal.title}
                    </button>
                  )
                })}
              </div>
              <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-slate-700 dark:border-emerald-500/20 dark:bg-slate-950 dark:text-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-emerald-700 font-semibold">Current pick</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{activeTrendingGoal.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activeTrendingGoal.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setText(`I am working on ${activeTrendingGoal.title}! ${activeTrendingGoal.subtitle}`)}
                    className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow hover:bg-emerald-800 transition"
                  >
                    Start this trend
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 p-6 shadow-[0_24px_70px_-35px_rgba(16,185,129,0.35)] transition hover:-translate-y-1 hover:shadow-[0_28px_75px_-35px_rgba(16,185,129,0.45)] dark:border-emerald-400/20 dark:from-slate-900 dark:via-slate-900 dark:to-teal-900">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-700 dark:text-slate-200 font-semibold">Goal of the Week</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Build a Daily Study Habit</h3>
                </div>
              </div>
              <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-emerald-600/10 dark:text-emerald-100">Featured</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed mb-5">Develop consistency by studying for at least 30 minutes every day.</p>
            <div className="rounded-3xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-emerald-500/20 dark:bg-slate-950 dark:text-slate-100">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-slate-900 font-semibold dark:text-white"><Users className="w-4 h-4 text-emerald-600" /> 1,243 people working on this goal</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => joinGoal({ title: 'Build a Daily Study Habit', description: 'Develop consistency by studying for at least 30 minutes every day.', category: 'Personal' })}
              className="mt-5 inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              {goalJoined ? 'Joined' : 'Join Goal'}
            </button>
            {goalJoined && (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100">
                You&apos;re now part of this goal. Check your dashboard for updates.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Community Posts</p>
              <h3 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Spotlight stories from the community</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Balanced posts across both columns, starting below Goal of the Week.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {visiblePosts.length === 0 ? (
              <div className="rounded-3xl border border-emerald-200 bg-white p-6 text-center text-slate-700 shadow-xl dark:border-emerald-400/20 dark:bg-slate-950 dark:text-slate-200">
                No posts yet. Share your story to appear in the Explore feed.
              </div>
            ) : visiblePosts.map((post) => (
              <article
                key={post.id}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="px-6 py-5 sm:px-8 sm:py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 font-semibold">
                        {post.author
                          .split(' ')
                          .map((word) => word[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{post.author}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{post.role} • {post.date}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFollow(post.author)}
                      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${following[post.author] ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'}`}
                    >
                      {following[post.author] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  <div className="mt-4">
                    <p className="text-slate-700 leading-relaxed dark:text-slate-300">{post.text}</p>
                  </div>
                </div>
                {post.image ? (
                  <div className="overflow-hidden bg-slate-100 transition duration-300 group-hover:scale-[1.01]">
                    <img src={post.image} alt={`${post.author} shared`} className="h-64 w-full object-cover" />
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 bg-white dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${post.liked ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800'}`}
                    >
                      <Heart className={`w-4 h-4 ${post.liked ? 'text-white' : 'text-blue-600'}`} />
                      {post.likes} {post.likes === 1 ? 'Like' : 'Likes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                    >
                      Comment
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                  >
                    Share
                  </button>
                </div>

                {activeCommentPost === post.id && (
                  <div className="border-t border-slate-200 px-6 py-4 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex gap-3">
                      <input
                        value={commentDrafts[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}

                {post.comments.length > 0 && (
                  <div className="border-t border-slate-100 px-6 py-4 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {post.comments.map((c) => (
                      <div key={c.id} className="mb-3">
                        <p className="text-sm"><span className="font-semibold">{c.author}</span> <span className="text-slate-500">• {c.date}</span></p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}