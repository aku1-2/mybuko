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
  const [chatsLoading, setChatsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [mutualFollowers, setMutualFollowers] = useState<any[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [initiateError, setInitiateError] = useState('')
  const [initiating, setInitiating] = useState(false)

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!storedUser || !token) { router.push('/auth/login'); return }
    const parsed = JSON.parse(storedUser)
    setUser(parsed)

    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } })
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
          return
        }
        if (res.ok) {
          const data = await res.json()
          setChats(data.chats || [])
        }
      } catch (err) { 
        console.error(err) 
      } finally {
        setChatsLoading(false)
      }
    }

    const fetchMutuals = async () => {
      setContactsLoading(true)
      try {
        const resF = await fetch(`/api/users/${parsed.id}/followers`)
        const resG = await fetch(`/api/users/${parsed.id}/following`)
        if (resF.ok && resG.ok) {
          const fData = await resF.json()
          const gData = await resG.json()
          const followers = fData.followers || []
          const following = gData.following || []
          const mutuals = following.filter((f: any) => followers.some((fol: any) => fol.id === f.id))
          setMutualFollowers(mutuals)
        }
      } catch (err) {
        console.error('Failed to fetch mutual followers:', err)
      } finally {
        setContactsLoading(false)
      }
    }

    fetchChats()
    fetchMutuals()
  }, [router])

  const handleStartChat = async (participantId: string) => {
    if (initiating) return
    setInitiating(true)
    setInitiateError('')
    const token = localStorage.getItem('token')
    if (!token) {
      setInitiating(false)
      return
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/chats/${data.chat.id}`)
      } else {
        const errData = await res.json()
        setInitiateError(errData.error || 'Unable to start chat room.')
        setInitiating(false)
      }
    } catch (err) {
      console.error(err)
      setInitiateError('Network error starting chat.')
      setInitiating(false)
    }
  }

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
              href="/dashboard?tab=community"
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
          {chatsLoading ? (
            <div className={`rounded-3xl p-12 text-center border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-gray-200'} flex flex-col items-center justify-center space-y-4`}>
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm opacity-70">Loading conversations...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="space-y-6">
              <div className={`rounded-3xl p-8 text-center border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-gray-200'}`}>
                <p className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                  No active conversations yet
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-505'} max-w-md mx-auto mb-6`}>
                  Start chatting with your mutual connections. You can message users who follow you back.
                </p>
                
                {initiateError && (
                  <p className="text-red-500 text-sm mb-4 font-semibold">⚠️ {initiateError}</p>
                )}

                {contactsLoading ? (
                  <p className="text-sm animate-pulse">Loading mutual connections...</p>
                ) : mutualFollowers.length > 0 ? (
                  <div className="space-y-3 max-w-lg mx-auto text-left">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Mutual Connections
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {mutualFollowers.map((contact) => (
                        <button
                          key={contact.id}
                          disabled={initiating}
                          onClick={() => handleStartChat(contact.id)}
                          className={`flex items-center gap-3 w-full p-4 rounded-2xl border transition text-left hover:scale-[1.02] ${initiating ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'}`}
                        >
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-sm truncate">{contact.name}</p>
                            <p className="text-xs text-slate-400 truncate">Click to message</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className={`text-sm italic ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-4`}>
                      No mutual followers yet. Follow back other goal-builders in the community to unlock direct messaging.
                    </p>
                    <Link
                      href="/dashboard?tab=community"
                      className="inline-flex px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full font-semibold hover:shadow-lg transition-all text-sm"
                    >
                      Go to Community
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            chats.map((chat) => {
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
            })
          )}
        </div>
      </div>
    </div>
  )
}
