"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../theme-provider'
import { ArrowLeft, User, Globe } from 'lucide-react'

export default function ChatsListPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [chats, setChats] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!storedUser || !token) { router.push('/auth/login'); return }
    const parsed = JSON.parse(storedUser)
    setUser(parsed)

    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setChats(data.chats || [])
        }
      } catch (err) { console.error(err) }
    }

    fetchChats()
  }, [router])

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-opacity-80 ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-opacity-80 ${isDark ? 'bg-slate-800 text-slate-250 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              <User className="w-4 h-4 text-blue-500" />
              Profile
            </Link>
            <Link
              href="/explore"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-opacity-80 ${isDark ? 'bg-slate-800 text-slate-250 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              Community
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Chats</h1>
        </div>

        <div className="space-y-3">
          {chats.length === 0 ? (
            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>No chats yet. Start a conversation from a profile or a post.</p>
          ) : chats.map((chat) => {
            const other = chat.participants.find((p: any) => p.userId !== user.id)?.user
            const last = chat.messages?.[0]
            return (
              <Link key={chat.id} href={`/dashboard/chats/${chat.id}`} className={`block rounded-2xl p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} border`}> 
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{other?.name || 'Unknown'}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{last?.text ? last.text.slice(0,60) : 'No messages yet'}</p>
                  </div>
                  <div className="text-sm text-slate-400">{last ? new Date(last.createdAt).toLocaleString() : ''}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
