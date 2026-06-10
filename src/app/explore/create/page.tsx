"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ImagePlus, Send, Camera, ArrowLeft, Eye } from 'lucide-react'
import { useTheme } from '../../theme-provider'

export default function CreateExplorePostPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [image, setImage] = useState('')
  const [imageName, imageNameSet] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storedUser = localStorage.getItem('user')
      const storedToken = localStorage.getItem('token')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null

      if (parsedUser && storedToken) {
        setIsLoggedIn(true)
        setCurrentUser(parsedUser)
        setAuthor(parsedUser.name || '')
      } else {
        router.push('/auth/login')
      }
    } catch (err) {
      console.error(err)
      router.push('/auth/login')
    }
  }, [router])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImage('')
      imageNameSet('')
      setImageFile(null)
      return
    }

    imageNameSet(file.name)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isLoggedIn || !author.trim() || !text.trim()) return

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      let finalImageUrl = null

      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          finalImageUrl = uploadData.url
        } else {
          console.error('Failed to upload image to /api/upload')
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: text.trim(),
          image: finalImageUrl
        })
      })

      if (res.ok) {
        router.push('/explore')
      } else {
        alert('Failed to publish story to the database.')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to the server.')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <p className="animate-pulse text-lg">Checking authentication...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header bar */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" /> Share Your Story
          </h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          
          {/* Creator Form */}
          <div className="rounded-[32px] border border-emerald-250 bg-white p-8 shadow-xl dark:border-emerald-500/10 dark:bg-slate-900">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Write a story</h2>
              <p className="text-sm text-slate-500 mt-1">Tell the community about your goals, habits, and progress.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Author Name
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g., Kabir"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Add a photo
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-850">
                    <ImagePlus className="w-5 h-5 text-emerald-600" />
                    <span>Choose file</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-xs text-slate-550 truncate max-w-xs">{imageName || "No file selected"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Your Experience
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  rows={6}
                  placeholder="Type your story here... what milestones did you hit? How did you stay motivated?"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !author.trim() || !text.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-550/20 transition hover:bg-emerald-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Posting Story..." : "Publish Story"}
                </button>
              </div>

            </form>
          </div>

          {/* Live Preview Column */}
          <div className="lg:sticky lg:top-28">
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-400 font-semibold uppercase tracking-wider">
              <Eye className="w-4 h-4 text-emerald-600" /> Live Feed Preview
            </div>
            
            <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 transition duration-300">
              <div className="px-6 py-5 sm:px-8 sm:py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 font-bold">
                    {author
                      ? author.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
                      : "ME"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{author || "Author Name"}</p>
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">Community Member • Just now</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-slate-750 leading-relaxed dark:text-slate-300 whitespace-pre-wrap">
                    {text || "Your experience content will show up here as you type..."}
                  </p>
                </div>
              </div>

              {image ? (
                <div className="overflow-hidden bg-slate-100">
                  <img src={image} alt="Story Preview" className="h-64 w-full object-cover" />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 flex items-center justify-center border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-450 italic">No image uploaded</p>
                </div>
              )}
            </article>
          </div>

        </div>
      </main>

    </div>
  )
}
