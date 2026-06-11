"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '../../../theme-provider'
import {
  ArrowLeft, Smile, Paperclip, Palette, Send, Download, 
  FileText, Sparkles, Trash2, Search, Star, Globe, Mic, 
  SmilePlus, CirclePlay, CheckCheck, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ChatTheme = {
  id: string
  name: string
  bg: string
  listBg: string
  sentBubble: string
  receivedBubble: string
  inputBg: string
  accent: string
}

const CHAT_THEMES: ChatTheme[] = [
  {
    id: 'classic',
    name: 'Classic Slate',
    bg: 'bg-slate-50 dark:bg-[#030712]',
    listBg: 'bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 backdrop-blur-xl',
    sentBubble: 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/10',
    receivedBubble: 'bg-slate-100 text-slate-950 dark:bg-white/5 dark:text-slate-100 border-slate-100 dark:border-white/5',
    inputBg: 'bg-slate-100 dark:bg-slate-950/65 border-slate-200/60 dark:border-white/5',
    accent: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    id: 'sunset',
    name: 'Sunset Peach',
    bg: 'bg-orange-50/20 dark:bg-[#030712]',
    listBg: 'bg-gradient-to-b from-orange-50/20 via-white to-pink-50/25 dark:from-slate-900/10 dark:via-slate-900/30 dark:to-pink-900/5 border-orange-100 dark:border-pink-900/15 backdrop-blur-xl',
    sentBubble: 'bg-gradient-to-r from-orange-500 via-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20',
    receivedBubble: 'bg-white/90 text-orange-950 dark:bg-slate-900/90 dark:text-orange-100 border-orange-100/50 dark:border-orange-900/15',
    inputBg: 'bg-orange-50/40 dark:bg-slate-950/40 border-orange-200/50 dark:border-orange-900/20',
    accent: 'text-orange-500 dark:text-orange-400'
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    bg: 'bg-emerald-50/10 dark:bg-[#030712]',
    listBg: 'bg-gradient-to-b from-emerald-50/20 via-white to-teal-55/25 dark:from-slate-900/10 dark:via-slate-900/30 dark:to-teal-900/5 border-emerald-100 dark:border-emerald-900/15 backdrop-blur-xl',
    sentBubble: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-500/20',
    receivedBubble: 'bg-white/95 text-slate-900 dark:bg-slate-900/90 dark:text-emerald-100 border-emerald-100/50 dark:border-emerald-900/15',
    inputBg: 'bg-emerald-50/30 dark:bg-slate-950/40 border-emerald-200/50 dark:border-emerald-900/20',
    accent: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    bg: 'bg-indigo-50/10 dark:bg-[#030712]',
    listBg: 'bg-gradient-to-b from-indigo-50/20 via-white to-purple-55/25 dark:from-slate-900/10 dark:via-slate-900/30 dark:to-purple-900/5 border-indigo-100 dark:border-purple-900/15 backdrop-blur-xl',
    sentBubble: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-650 text-white shadow-md shadow-purple-500/20',
    receivedBubble: 'bg-white/95 text-indigo-950 dark:bg-slate-900/90 dark:text-indigo-100 border-indigo-100/50 dark:border-indigo-900/15',
    inputBg: 'bg-indigo-50/30 dark:bg-slate-950/40 border-indigo-200/50 dark:border-indigo-900/20',
    accent: 'text-indigo-505'
  },
  {
    id: 'neon',
    name: 'Neo Cyberpunk',
    bg: 'bg-black text-cyan-400',
    listBg: 'bg-zinc-950 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.08)] backdrop-blur-xl',
    sentBubble: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white border border-fuchsia-400 shadow-[0_0_12px_rgba(240,46,170,0.4)]',
    receivedBubble: 'bg-zinc-900 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
    inputBg: 'bg-black border-cyan-500/40 text-cyan-150 placeholder-cyan-700',
    accent: 'text-cyan-500'
  }
]

const MOCK_STICKERS = [
  { id: 'st1', label: 'Great Job', url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&auto=format&fit=crop&q=60' },
  { id: 'st2', label: 'Awesome', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60' },
  { id: 'st3', label: 'Level Up', url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=100&auto=format&fit=crop&q=60' },
  { id: 'st4', label: 'Winner', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=100&auto=format&fit=crop&q=60' },
  { id: 'st5', label: 'Keep Going', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=60' }
]

const MOCK_GIF_REACTIONS = [
  { id: 'gif1', name: 'Congratulations', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hveXZwZTFkbG82cTRlOWZpd25mNzI1cG9iNTR3b3I1NGtqYWJxbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9M29jRDR5R2pPZ3U3RzlHZWw2JmN0PWc/3ocD4yGjOgu7G9Gel6/giphy.gif' },
  { id: 'gif2', name: 'Celebration Dance', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RmcHBrczM5ajk2eHlsMzRkMTQzdG44bnB1MjdseHYwZnBwYXFnbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9MmRkNzE5YTItY2ExNy00MGNkLWJiNzQtNjZmNGZjNTMyNTRmJmN0PWc/l3vRlTKuRxCwpSVQQ/giphy.gif' },
  { id: 'gif3', name: 'Success Goal', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm41cTV4eGJkMTFjZjBncjcycWphMW9ocGNpNDNzYzJleDhhMnVwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9cTdPdzU4eExyMUpzNCZjdD1n/q7Ow58xLr1Js4/giphy.gif' },
  { id: 'gif4', name: 'Thumbs Up Work', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtoc3EzaDh3MDhzMnNpOXc1czBveDZpdm0yMXJidWd1NGdudWdyaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9MTExYTkxYTgtZmQ4MC00MmJmLTk5Y2YtNmRjNTExNTg4NGVlJmN0PWc/1236TCtCO5dsGE/giphy.gif' },
  { id: 'gif5', name: 'High Five Team', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqdWg0ZWhlOWQzaWF0bHFsdWlyNm5tZmszMWV2bmpycGdzajR4NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9MzA2Mjg3MCZjdD1n/3oEjHV0zqZuR596caa/giphy.gif' }
]

const POPULAR_EMOJIS = [
  '😊', '😂', '😍', '👍', '🔥', '🎉', '🚀', '❤️',
  '👏', '🥳', '🌟', '💪', '💯', '✨', '🎈', '🤩',
  '🙌', '👌', '⚡', '💡', '🏆', '🎯', '📍', '🗺️'
]

export default function ChatRoomPage() {
  const { theme } = useTheme()
  const isGlobalDark = theme === 'dark'
  const router = useRouter()
  const params = useParams()
  const chatId = params?.id as string

  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileNameText, setFileNameText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [other, setOther] = useState<any>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Split-layout Chats List loading
  const [chats, setChats] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<'all' | 'unread' | 'favorites' | 'groups'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Simulated recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const recordInterval = useRef<any>(null)

  const messagesRef = useRef<any[]>([])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const fetchChats = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setChats(data.chats || [])
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  const fetchMessages = useCallback(async (isInitial = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return

    try {
      const currentMessages = messagesRef.current
      const lastMsg = currentMessages[currentMessages.length - 1]
      const since = !isInitial && lastMsg ? lastMsg.createdAt : ''
      
      const url = `/api/chats/${chatId}/messages` + (since ? `?since=${encodeURIComponent(since)}` : '')
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        if (isInitial || !since) {
          setMessages(data.messages || [])
          if (data.other) {
            setOther(data.other)
          }
        } else if (data.messages && data.messages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const uniqueNew = data.messages.filter((m: any) => !existingIds.has(m.id))
            if (uniqueNew.length === 0) return prev
            return [...prev, ...uniqueNew]
          })
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [chatId, router])

  // Custom theme choices
  const [chatTheme, setChatTheme] = useState<ChatTheme>(CHAT_THEMES[0])
  const [showThemePicker, setShowThemePicker] = useState(false)

  // Smileys/stickers selector panel states
  const [showPickerPanel, setShowPickerPanel] = useState(false)
  const [activePickerTab, setActivePickerTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji')

  // Selected message for deletion modal
  const [selectedDeleteMessage, setSelectedDeleteMessage] = useState<any | null>(null)

  // Message reaction active IDs
  const [bubbleHoverReactionId, setBubbleHoverReactionId] = useState<string | number | null>(null)

  const handleDeleteMessage = async (deleteType: 'me' | 'everyone') => {
    if (!selectedDeleteMessage) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return

    try {
      const res = await fetch(`/api/messages/${selectedDeleteMessage.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deleteType })
      })

      if (res.ok) {
        setMessages(prev => {
          if (deleteType === 'everyone') {
            return prev.map(m => m.id === selectedDeleteMessage.id ? { ...m, deletedForEveryone: true, text: 'This message was deleted', fileUrl: null, fileType: null } : m)
          } else {
            return prev.filter(m => m.id !== selectedDeleteMessage.id)
          }
        })
      } else {
        alert('Failed to delete message.')
      }
    } catch (err) {
      console.error('Error deleting message:', err)
      alert('Error deleting message.')
    } finally {
      setSelectedDeleteMessage(null)
    }
  }

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!storedUser || !token) { router.push('/auth/login'); return }
    const parsed = JSON.parse(storedUser)
    setUser(parsed)

    // Load theme preference
    const savedThemeId = localStorage.getItem(`mybuko-chat-theme-${chatId}`)
    if (savedThemeId) {
      const match = CHAT_THEMES.find(t => t.id === savedThemeId)
      if (match) setChatTheme(match)
    }

    fetchChats()
    fetchMessages(true)
    const iv = setInterval(() => {
      fetchMessages(false)
    }, 3000)
    return () => clearInterval(iv)
  }, [chatId, router, fetchMessages, fetchChats])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setFileNameText(selected ? selected.name : '')
  }

  const changeTheme = (themeItem: ChatTheme) => {
    setChatTheme(themeItem)
    localStorage.setItem(`mybuko-chat-theme-${chatId}`, themeItem.id)
    setShowThemePicker(false)
  }

  const handleSendFileMsg = async (fileUrl: string, fileType: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return

    await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: '', fileUrl, fileType })
    })

    await fetchMessages(false)
  }

  const sendMessage = async () => {
    if (!text.trim() && !file) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) { router.push('/auth/login'); return }

    setUploading(true)
    let fileUrl = null
    let fileType = null

    try {
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const up = await fetch('/api/files/upload', { method: 'POST', body: fd })
        if (up.ok) {
          const d = await up.json()
          fileUrl = d.url
          fileType = file.type
        }
      }

      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: text.trim() || null, fileUrl, fileType })
      })

      setText('')
      setFile(null)
      setFileNameText('')
      await fetchMessages(false)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  // Handle mock voice note dispatch
  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true)
      setRecordingSeconds(0)
      recordInterval.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(recordInterval.current)
      setIsRecording(false)
      // Send a simulated Voice message
      const audioMockUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      handleSendFileMsg(audioMockUrl, 'audio/mpeg')
    }
  }

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji)
  }

  const sendGif = (gifUrl: string) => {
    handleSendFileMsg(gifUrl, 'image/gif')
    setShowPickerPanel(false)
  }

  const sendSticker = (stickerUrl: string) => {
    handleSendFileMsg(stickerUrl, 'image/sticker')
    setShowPickerPanel(false)
  }

  // React to a bubble locally
  const reactMessage = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reacts = m.reactions || []
        return { ...m, reactions: [...reacts, emoji] }
      }
      return m
    }))
    setBubbleHoverReactionId(null)
  }

  const isDocument = (type: string | undefined, url: string | null) => {
    if (!url) return false
    if (!type) {
      const ext = url.split('.').pop()?.toLowerCase()
      return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'].includes(ext || '')
    }
    return !type.startsWith('image/') && !type.startsWith('video/') && !type.startsWith('audio/')
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen dark:bg-slate-950 bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Sidebar dynamic chats computed filter
  const filteredChats = chats
    .filter(chat => {
      const otherUser = chat.participants.find((p: any) => p.userId !== user.id)?.user
      if (!otherUser) return false
      const nameMatch = otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (activeCategory === 'unread') return nameMatch && chat.id.charCodeAt(0) % 2 === 0
      if (activeCategory === 'favorites') return nameMatch && chat.id.charCodeAt(0) % 3 === 0
      return nameMatch
    })

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${
      isGlobalDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Background patterns */}
      <div className="absolute inset-0 noise-overlay pointer-events-none z-0" />
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />

      {/* Main Split Layout container */}
      <div className="max-w-7xl mx-auto px-4 py-6 h-[95vh] relative z-10 flex gap-6">
        
        {/* LEFT PANEL: Chats Sidebar (Desktop only) */}
        <aside className="hidden lg:flex w-[320px] shrink-0 rounded-3xl border flex-col overflow-hidden shadow-lg bg-[#0b0f19]/80 border-white/5 shadow-glow-violet">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <Link
                href="/dashboard/chats"
                className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 hover:text-indigo-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Channels Hub
              </Link>
            </div>

            {/* Sidebar search */}
            <div className="relative flex items-center rounded-xl bg-slate-950/60 border border-white/5 px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-[11px] focus:outline-none placeholder-slate-650 text-white"
              />
            </div>

            {/* Sidebar Categories tab filters */}
            <div className="flex gap-0.5 bg-slate-950/50 p-0.5 rounded-lg border border-white/5">
              {(['all', 'unread', 'favorites'] as const).map(tab => {
                const isActive = activeCategory === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveCategory(tab)}
                    className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-colors ${
                      isActive ? 'bg-white/5 text-violet-400 font-black' : 'text-slate-450 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {filteredChats.map(c => {
              const otherUser = c.participants.find((p: any) => p.userId !== user.id)?.user
              const active = c.id === chatId
              const isUnread = c.id.charCodeAt(0) % 2 === 0
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/dashboard/chats/${c.id}`)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    active 
                      ? 'bg-violet-600/10 border-violet-500/30' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="relative shrink-0">
                    {otherUser?.profileImage ? (
                      <img src={otherUser.profileImage} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="avatar" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black">
                        {otherUser?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0b0f19] rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-extrabold truncate ${active ? 'text-violet-400' : 'text-white'}`}>
                      {otherUser?.name || 'Dream Builder'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.messages?.[0]?.text || 'No messages'}</p>
                  </div>
                  {isUnread && (
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* RIGHT PANEL: Active conversation view */}
        <main className={`flex-1 rounded-3xl border overflow-hidden flex flex-col shadow-lg transition-all ${
          chatTheme.listBg
        }`}>
          
          {/* Conversation Header */}
          <div className="p-4 border-b flex items-center justify-between dark:border-white/5 border-slate-150 shrink-0">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/chats"
                className={`p-2 rounded-full border transition-all lg:hidden ${
                  isGlobalDark ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div className="relative shrink-0">
                {other?.profileImage ? (
                  <img src={other.profileImage} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="avatar" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-black text-xs">
                    {other?.name ? other.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0b0f19] rounded-full" />
              </div>

              <div>
                <h2 className="text-xs font-black tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
                  {other?.name || 'Loading Conversation...'}
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase px-1 py-0.2 rounded-md">online</span>
                </h2>
                <p className="text-[9px] text-slate-500">{other?.email || 'Synchronizing DM channel...'}</p>
              </div>
            </div>

            {/* Theme switcher palette */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className={`p-2 rounded-full border transition-all ${
                  isGlobalDark ? 'bg-slate-900 border-white/5 text-purple-400' : 'bg-white border-slate-200 text-purple-600'
                }`}
                title="Select Theme"
              >
                <Palette className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showThemePicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 z-50 w-44 rounded-2xl border p-1 shadow-2xl backdrop-blur-xl bg-slate-900/90 border-white/10 text-slate-200"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 py-2 border-b border-white/5">Select Theme</p>
                    <div className="space-y-0.5 mt-1">
                      {CHAT_THEMES.map((themeItem) => (
                        <button
                          key={themeItem.id}
                          onClick={() => changeTheme(themeItem)}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition-colors ${
                            chatTheme.id === themeItem.id 
                              ? 'bg-violet-600/10 text-violet-400 font-bold' 
                              : 'hover:bg-white/5'
                          }`}
                        >
                          {themeItem.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Messages Feed View */}
          <div
            ref={listRef}
            className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-hide"
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-semibold animate-pulse">Loading secure chat...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50 max-w-sm mx-auto text-center">
                <Sparkles className="w-10 h-10 text-indigo-400 animate-spin-slow" />
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">Start the conversation</p>
                <p className="text-[11px] text-slate-400">Send a greeting, upload a document, or share an achievement sticker.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === user.id
                const isDoc = isDocument(m.fileType, m.fileUrl)
                const isVid = m.fileType?.startsWith('video/')
                const isImg = m.fileType?.startsWith('image/') || m.fileType === 'sticker'
                const isAudio = m.fileType?.startsWith('audio/')

                return (
                  <div key={m.id} className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`flex items-center gap-2.5 max-w-[80%] group relative ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      }`}
                      onMouseEnter={() => setBubbleHoverReactionId(m.id)}
                      onMouseLeave={() => setBubbleHoverReactionId(null)}
                    >
                      
                      {/* Message Bubble box */}
                      <div className={`rounded-3xl px-4 py-3 border border-opacity-10 shadow-sm relative transition-all ${
                        m.deletedForEveryone 
                          ? 'bg-slate-100/30 text-slate-400 dark:bg-white/5 dark:text-slate-500 italic border-dashed' 
                          : isMine ? chatTheme.sentBubble : chatTheme.receivedBubble
                      }`}>
                        {m.deletedForEveryone ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span>🚫 Message deleted for everyone</span>
                          </div>
                        ) : (
                          <>
                            {/* Text content */}
                            {m.text && <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                            {/* Rich media attachments */}
                            {m.fileUrl && (
                              <div className={m.text ? "mt-3" : ""}>
                                
                                {isImg && (
                                  <div className="relative overflow-hidden rounded-2xl bg-white/5">
                                    <img
                                      src={m.fileUrl}
                                      alt="attachment preview"
                                      className="max-h-52 max-w-full rounded-2xl object-contain hover:scale-101 cursor-pointer transition"
                                    />
                                    <a
                                      href={m.fileUrl}
                                      download
                                      className="absolute bottom-2.5 right-2.5 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}

                                {isVid && (
                                  <video src={m.fileUrl} controls className="max-h-52 max-w-full rounded-2xl" />
                                )}

                                {isAudio && (
                                  <div className="flex items-center gap-3 py-1.5 px-3 rounded-2xl bg-black/10 text-white">
                                    <CirclePlay className="w-5 h-5 cursor-pointer shrink-0" />
                                    <div className="w-24 h-1 bg-white/35 rounded-full overflow-hidden shrink-0">
                                      <div className="w-3/4 h-full bg-white" />
                                    </div>
                                    <span className="text-[10px] shrink-0">Voice note</span>
                                  </div>
                                )}

                                {isDoc && (
                                  <div className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left ${
                                    isMine ? 'bg-black/10 border-white/10' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5'
                                  }`}>
                                    <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                                        {m.fileUrl.split('/').pop()?.substring(13) || 'Attached Document'}
                                      </p>
                                      <p className="text-[9px] text-slate-550">File Attachment</p>
                                    </div>
                                    <a href={m.fileUrl} download className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-slate-500">
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Floating Reactions on bubble */}
                            {m.reactions && m.reactions.length > 0 && (
                              <div className="absolute -bottom-2.5 right-3 flex gap-1 bg-slate-900 border border-white/10 rounded-full px-1.5 py-0.5 z-10 text-[10px]">
                                {m.reactions.map((emoji, idx) => (
                                  <span key={idx}>{emoji}</span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Micro-interaction controls on hover */}
                      {!m.deletedForEveryone && bubbleHoverReactionId === m.id && (
                        <div className={`flex gap-1.5 items-center absolute z-20 ${
                          isMine ? '-left-16' : '-right-16'
                        } bg-slate-900 border border-white/10 px-2 py-1.5 rounded-full shadow-xl animate-fade-in`}>
                          
                          {/* Quick Emoji reaction trigger */}
                          <button 
                            onClick={() => reactMessage(m.id, '❤️')}
                            className="hover:scale-120 transition text-xs"
                          >
                            ❤️
                          </button>
                          
                          <button 
                            onClick={() => reactMessage(m.id, '👍')}
                            className="hover:scale-120 transition text-xs"
                          >
                            👍
                          </button>

                          <button
                            onClick={() => setSelectedDeleteMessage(m)}
                            className="p-1 rounded-full text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 transition"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 items-center mt-1 px-1.5">
                      <span className="text-[9px] text-slate-500">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Stickers/GIFs/Emojis Picker window drawer */}
          <AnimatePresence>
            {showPickerPanel && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 border-t bg-slate-950/90 border-white/5 space-y-4 shrink-0"
              >
                <div className="flex gap-2 border-b border-white/5 pb-2.5 justify-between items-center">
                  <div className="flex gap-1.5">
                    {(['emoji', 'gif', 'sticker'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActivePickerTab(tab)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                          activePickerTab === tab ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab === 'emoji' ? '😊 Emojis' : tab === 'gif' ? '🎬 GIFs' : '🎨 Stickers'}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setShowPickerPanel(false)} className="text-slate-450 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activePickerTab === 'emoji' && (
                  <div className="grid grid-cols-8 sm:grid-cols-12 gap-3 max-h-32 overflow-y-auto p-1 justify-items-center scrollbar-hide">
                    {POPULAR_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertEmoji(emoji)}
                        className="text-xl hover:scale-125 transition focus:outline-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {activePickerTab === 'gif' && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-32 overflow-y-auto p-1 scrollbar-hide">
                    {MOCK_GIF_REACTIONS.map(gif => (
                      <div
                        key={gif.id}
                        onClick={() => sendGif(gif.url)}
                        className="relative rounded-xl overflow-hidden cursor-pointer h-16 border border-white/5 hover:opacity-90"
                      >
                        <img src={gif.url} className="w-full h-full object-cover" alt="reaction gif" />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                          <p className="text-[9px] text-white truncate w-full font-bold">{gif.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePickerTab === 'sticker' && (
                  <div className="grid grid-cols-5 gap-3 max-h-32 overflow-y-auto p-1 justify-items-center scrollbar-hide">
                    {MOCK_STICKERS.map(st => (
                      <button
                        key={st.id}
                        onClick={() => sendSticker(st.url)}
                        className="p-1 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition"
                      >
                        <img src={st.url} className="w-10 h-10 rounded-lg object-cover" alt="sticker icon" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Input area */}
          <div className={`p-4 border-t flex flex-col gap-3 dark:border-white/5 border-slate-150 shrink-0 ${
            chatTheme.inputBg
          }`}>
            
            {/* File selection details */}
            {fileNameText && (
              <div className="flex items-center justify-between text-[10px] px-3 py-1.5 rounded-xl bg-violet-650/20 text-violet-400 border border-violet-500/10">
                <span className="font-extrabold truncate">📎 Attachment selected: {fileNameText}</span>
                <button onClick={() => { setFile(null); setFileNameText('') }} className="font-black hover:underline uppercase text-[8px]">Clear</button>
              </div>
            )}

            {/* Typing status / Voice Recording visualizer */}
            {isRecording && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Recording voice note...</span>
                </div>
                <span>0:0{recordingSeconds}s</span>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowPickerPanel(!showPickerPanel)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition"
                title="Emojis, Stickers, GIFs"
              >
                <Smile className="w-4 h-4" />
              </button>

              <label className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition cursor-pointer">
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="sr-only"
                  accept="image/*,video/*,.pdf,.docx,.zip,.txt"
                />
              </label>

              {/* Text Input */}
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={uploading ? "Uploading media..." : "Send a message..."}
                disabled={uploading || isRecording}
                className="flex-1 bg-transparent text-xs focus:outline-none placeholder-slate-500 text-slate-900 dark:text-white py-1"
              />

              {/* Micro-interaction mock voice recorder */}
              <button
                onClick={handleToggleRecord}
                className={`p-2 rounded-full transition ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-bounce' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 hover:text-red-500'
                }`}
                title="Simulated Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={uploading || (!text.trim() && !file)}
                className={`p-3 rounded-full text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  chatTheme.id === 'neon' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

        </main>

      </div>

      {/* Delete confirmation modal */}
      {selectedDeleteMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2rem] p-6 border shadow-2xl backdrop-blur-xl bg-slate-900 border-white/5 text-slate-200">
            <h3 className="text-sm font-black mb-3 uppercase tracking-wider">Delete Message?</h3>
            <p className="text-xs opacity-75 mb-6 leading-relaxed">
              Would you like to delete this message locally, or delete it for everyone in the DM channel?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDeleteMessage('me')}
                className="w-full py-3 text-xs font-bold rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition"
              >
                Delete for me
              </button>
              
              {selectedDeleteMessage.senderId === user?.id && (
                <button
                  onClick={() => handleDeleteMessage('everyone')}
                  className="w-full py-3 text-xs font-bold rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg hover:shadow-red-500/20 text-white transition"
                >
                  Delete for everyone
                </button>
              )}

              <button
                onClick={() => setSelectedDeleteMessage(null)}
                className="w-full py-3 text-xs font-bold rounded-full border border-white/10 bg-transparent text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
