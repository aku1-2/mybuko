"use client"

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '../../../theme-provider'
import {
  ArrowLeft,
  Smile,
  Paperclip,
  Palette,
  Send,
  Download,
  FileText,
  Video,
  Image,
  Flame,
  ThumbsUp,
  Heart,
  Sparkles,
  PartyPopper
} from 'lucide-react'

// Define the chat theme structures
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
    bg: 'bg-slate-50 dark:bg-slate-950',
    listBg: 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
    sentBubble: 'bg-blue-600 text-white shadow-sm shadow-blue-500/10',
    receivedBubble: 'bg-slate-100 text-slate-950 dark:bg-slate-850 dark:text-slate-100 border-slate-100 dark:border-slate-800',
    inputBg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'sunset',
    name: 'Sunset Peach',
    bg: 'bg-orange-50/20 dark:bg-slate-955',
    listBg: 'bg-gradient-to-b from-orange-50/30 via-white to-pink-50/30 dark:from-slate-950 dark:via-slate-900/40 dark:to-pink-950/10 border-orange-100 dark:border-pink-900/25',
    sentBubble: 'bg-gradient-to-r from-orange-500 via-pink-550 to-rose-600 text-white shadow-md shadow-pink-500/20',
    receivedBubble: 'bg-white/90 text-orange-950 dark:bg-slate-900/90 dark:text-orange-100 border-orange-100/50 dark:border-orange-900/15',
    inputBg: 'bg-orange-50/40 dark:bg-slate-955 border-orange-200/50 dark:border-orange-900/20',
    accent: 'text-orange-500 dark:text-orange-400'
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    bg: 'bg-emerald-50/10 dark:bg-slate-955',
    listBg: 'bg-gradient-to-b from-emerald-50/30 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900/40 dark:to-teal-950/10 border-emerald-100 dark:border-emerald-900/25',
    sentBubble: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-500/20',
    receivedBubble: 'bg-white/95 text-slate-900 dark:bg-slate-900/90 dark:text-emerald-100 border-emerald-100/50 dark:border-emerald-900/15',
    inputBg: 'bg-emerald-50/30 dark:bg-slate-955 border-emerald-200/50 dark:border-emerald-900/20',
    accent: 'text-emerald-600 dark:text-emerald-450'
  },
  {
    id: 'lavender',
    name: 'Lavender Dream',
    bg: 'bg-indigo-50/10 dark:bg-slate-955',
    listBg: 'bg-gradient-to-b from-indigo-50/30 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900/40 dark:to-purple-950/10 border-indigo-100 dark:border-purple-900/25',
    sentBubble: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-550 text-white shadow-md shadow-purple-500/20',
    receivedBubble: 'bg-white/95 text-indigo-950 dark:bg-slate-900/90 dark:text-indigo-100 border-indigo-100/50 dark:border-indigo-900/15',
    inputBg: 'bg-indigo-50/30 dark:bg-slate-955 border-indigo-200/50 dark:border-indigo-900/20',
    accent: 'text-indigo-500 dark:text-indigo-400'
  },
  {
    id: 'neon',
    name: 'Neo Cyberpunk',
    bg: 'bg-black text-cyan-400',
    listBg: 'bg-zinc-950 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.08)]',
    sentBubble: 'bg-gradient-to-r from-fuchsia-600 to-pink-655 text-white border border-fuchsia-400 shadow-[0_0_12px_rgba(240,46,170,0.4)]',
    receivedBubble: 'bg-zinc-900 text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
    inputBg: 'bg-black border-cyan-550/40 text-cyan-100 placeholder-cyan-700',
    accent: 'text-cyan-500'
  }
]

// Mock Sticker Collection
const MOCK_STICKERS = [
  { id: 'st1', label: 'Great Job', url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&auto=format&fit=crop&q=60' },
  { id: 'st2', label: 'Awesome', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60' },
  { id: 'st3', label: 'Level Up', url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=100&auto=format&fit=crop&q=60' },
  { id: 'st4', label: 'Winner', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=100&auto=format&fit=crop&q=60' },
  { id: 'st5', label: 'Keep Going', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=60' }
]

// Curated reaction GIFs
const MOCK_GIF_REACTIONS = [
  { id: 'gif1', name: 'Congratulations', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hveXZwZTFkbG82cTRlOWZpd25mNzI1cG9iNTR3b3I1NGtqYWJxbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9M29jRDR5R2pPZ3U3RzlHZWw2JmN0PWc/3ocD4yGjOgu7G9Gel6/giphy.gif' },
  { id: 'gif2', name: 'Celebration Dance', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2RmcHBrczM5ajk2eHlsMzRkMTQzdG44bnB1MjdseHYwZnBwYXFnbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9MmRkNzE5YTItY2ExNy00MGNkLWJiNzQtNjZmNGZjNTMyNTRmJmN0PWc/l3vRlTKuRxCwpSVQQ/giphy.gif' },
  { id: 'gif3', name: 'Success Goal', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm41cTV4eGJkMTFjZjBncjcycWphMW9ocGNpNDNzYzJleDhhMnVwMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9cTdPdzU4eExyMUpzNCZjdD1n/q7Ow58xLr1Js4/giphy.gif' },
  { id: 'gif4', name: 'Thumbs Up Work', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtoc3EzaDh3MDhzMnNpOXc1czBveDZpdm0yMXJidWd1NGdudWdyaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9MTExYTkxYTgtZmQ4MC00MmJmLTk5Y2YtNmRjNTExNTg4NGVlJmN0PWc/1236TCtCO5dsGE/giphy.gif' },
  { id: 'gif5', name: 'High Five Team', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqdWg0ZWhlOWQzaWF0bHFsdWlyNm5tZmszMWV2bmpycGdzajR4NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfZ2lmcyZnaWZfaWQ9MzA2Mjg3MCZjdD1n/3oEjHV0zqZuR596caa/giphy.gif' }
]

// Popular emojis grid
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
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileNameText, setFileNameText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [other, setOther] = useState<any>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Custom theme choices (Local state default: classic)
  const [chatTheme, setChatTheme] = useState<ChatTheme>(CHAT_THEMES[0])
  const [showThemePicker, setShowThemePicker] = useState(false)

  // Smileys/stickers selector panel states
  const [showPickerPanel, setShowPickerPanel] = useState(false)
  const [activePickerTab, setActivePickerTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji')

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

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
          
          const chatsRes = await fetch('/api/chats', { headers: { Authorization: `Bearer ${token}` } })
          if (chatsRes.ok) {
            const list = await chatsRes.json()
            const chat = list.chats.find((c: any) => c.id === chatId)
            if (chat) {
              const otherP = chat.participants.find((p: any) => p.userId !== parsed.id)?.user
              setOther(otherP)
            }
          }
        }
      } catch (err) {
        console.error(err)
      }
    }

    fetchMessages()
    const iv = setInterval(fetchMessages, 3000)
    return () => clearInterval(iv)
  }, [chatId, router])

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

    // Refresh messages
    const res = await fetch(`/api/chats/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }
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
      
      const res = await fetch(`/api/chats/${chatId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
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

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  // helper to check if file is document
  const isDocument = (type: string | undefined, url: string | null) => {
    if (!url) return false
    if (!type) {
      const ext = url.split('.').pop()?.toLowerCase()
      return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'].includes(ext || '')
    }
    return !type.startsWith('image/') && !type.startsWith('video/')
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${chatTheme.bg} ${chatTheme.id === 'neon' ? 'text-cyan-400' : ''}`}>
      <div className="max-w-4xl mx-auto flex flex-col h-[90vh]">
        
        {/* Chat Room Header */}
        <div className="mb-4 flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/chats"
              className={`p-2 rounded-full border transition hover:bg-opacity-80 ${isGlobalDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-gray-700 border-gray-200'}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className={`text-xl font-bold ${chatTheme.id === 'neon' ? 'text-fuchsia-500' : 'text-slate-900 dark:text-white'}`}>{other?.name || 'Loading Chat...'}</h2>
              <p className="text-xs text-slate-400">{other?.email}</p>
            </div>
          </div>

          {/* Theme Palette Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border shadow-sm transition hover:scale-103 ${isGlobalDark ? 'bg-slate-800 border-slate-700 text-slate-250' : 'bg-white border-gray-255 text-gray-700'}`}
            >
              <Palette className="w-4 h-4 text-purple-500" />
              Theme: {chatTheme.name}
            </button>

            {showThemePicker && (
              <div className={`absolute right-0 mt-2 z-50 w-48 rounded-2xl border p-2 shadow-2xl ${isGlobalDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-gray-200 text-slate-900'}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-opacity-50 dark:border-slate-850">Select Theme</p>
                <div className="space-y-1 mt-1">
                  {CHAT_THEMES.map((themeItem) => (
                    <button
                      key={themeItem.id}
                      onClick={() => changeTheme(themeItem)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${chatTheme.id === themeItem.id ? 'bg-purple-100/60 dark:bg-purple-900/30 text-purple-650 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-850'}`}
                    >
                      {themeItem.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Window */}
        <div
          ref={listRef}
          className={`flex-1 rounded-[32px] p-6 h-[60vh] overflow-y-auto border space-y-4 mb-4 transition-all duration-300 shadow-md ${chatTheme.listBg}`}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-60">
              <Sparkles className="w-12 h-12 text-slate-400 animate-spin-slow" />
              <p className="font-semibold text-lg">No Messages Yet</p>
              <p className="text-sm max-w-xs">Start the conversation by typing a greeting or sending a file.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === user.id
              const isDoc = isDocument(m.fileType, m.fileUrl)
              const isVid = m.fileType?.startsWith('video/')
              const isImg = m.fileType?.startsWith('image/') || m.fileType === 'sticker'

              return (
                <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 border border-opacity-40 ${isMine ? chatTheme.sentBubble : chatTheme.receivedBubble}`}>
                    
                    {/* Text content */}
                    {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                    {/* Rich media renderings */}
                    {m.fileUrl && (
                      <div className={m.text ? "mt-3" : ""}>
                        {isImg && (
                          <div className="relative group overflow-hidden rounded-xl bg-slate-100/10">
                            <img
                              src={m.fileUrl}
                              alt="Attachment"
                              className="max-h-60 max-w-full rounded-xl object-contain transition group-hover:scale-101 cursor-pointer"
                            />
                            <a
                              href={m.fileUrl}
                              download
                              className="absolute bottom-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition duration-300 hover:bg-black/80"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                        {isVid && (
                          <video src={m.fileUrl} controls className="max-h-60 max-w-full rounded-xl shadow-sm" />
                        )}

                        {isDoc && (
                          <div className={`flex items-center gap-3 p-3 rounded-xl border ${isMine ? 'bg-black/10 border-white/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-205">
                                {m.fileUrl.split('/').pop()?.substring(13) || 'Shared Document'}
                              </p>
                              <p className="text-xs text-slate-400">File Attachment</p>
                            </div>
                            <a
                              href={m.fileUrl}
                              download
                              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition flex-shrink-0 text-slate-550"
                              title="Download Attachment"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-450 mt-1 px-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Emojis, Stickers, GIFs pickers panel */}
        {showPickerPanel && (
          <div className={`mb-4 p-4 rounded-3xl border shadow-xl animate-fade-in ${isGlobalDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-150'}`}>
            
            {/* Panel Tabs */}
            <div className="flex gap-2 border-b pb-3 border-opacity-40 border-slate-350 mb-3">
              <button
                onClick={() => setActivePickerTab('emoji')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${activePickerTab === 'emoji' ? 'bg-purple-100 text-purple-650 dark:bg-purple-900/30' : 'text-slate-455 hover:bg-slate-100'}`}
              >
                😊 Emojis
              </button>
              <button
                onClick={() => setActivePickerTab('gif')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${activePickerTab === 'gif' ? 'bg-purple-100 text-purple-650 dark:bg-purple-900/30' : 'text-slate-455 hover:bg-slate-100'}`}
              >
                🎥 GIFs
              </button>
              <button
                onClick={() => setActivePickerTab('sticker')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${activePickerTab === 'sticker' ? 'bg-purple-100 text-purple-650 dark:bg-purple-900/30' : 'text-slate-455 hover:bg-slate-100'}`}
              >
                🎨 Stickers
              </button>
            </div>

            {/* Emojis Grid */}
            {activePickerTab === 'emoji' && (
              <div className="grid grid-cols-8 gap-3 max-h-40 overflow-y-auto p-1 justify-items-center">
                {POPULAR_EMOJIS.map((emoji, idx) => (
                  <button
                    key={`em-${idx}`}
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:scale-120 transition focus:outline-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Curated GIFs Grid */}
            {activePickerTab === 'gif' && (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {MOCK_GIF_REACTIONS.map((gif) => (
                  <div
                    key={gif.id}
                    onClick={() => sendGif(gif.url)}
                    className="relative rounded-xl overflow-hidden cursor-pointer h-20 bg-slate-100 border dark:border-slate-800 transition hover:opacity-90"
                  >
                    <img src={gif.url} alt={gif.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                      <p className="text-[10px] text-white font-semibold truncate w-full">{gif.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sticker Grid */}
            {activePickerTab === 'sticker' && (
              <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 justify-items-center">
                {MOCK_STICKERS.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => sendSticker(st.url)}
                    className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border dark:border-slate-800 transition focus:outline-none"
                    title={st.label}
                  >
                    <img src={st.url} alt={st.label} className="w-12 h-12 rounded-lg object-cover" />
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Input Bar */}
        <div className={`rounded-3xl p-4 border flex flex-col gap-3 shadow-md ${chatTheme.inputBg}`}>
          
          {/* File Selected Indicator */}
          {fileNameText && (
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-blue-100/50 text-blue-750 dark:bg-blue-900/20 dark:text-blue-300">
              <span className="font-semibold truncate max-w-xs">📎 Selected file: {fileNameText}</span>
              <button
                onClick={() => { setFile(null); setFileNameText('') }}
                className="text-[10px] hover:underline font-bold"
              >
                Clear
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Smileys button */}
            <button
              onClick={() => setShowPickerPanel(!showPickerPanel)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition text-slate-550"
              title="Add Emoji, GIF, or Sticker"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Custom styled File Upload icon */}
            <label className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition text-slate-550" title="Attach file">
              <Paperclip className="w-5 h-5" />
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
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
              placeholder={uploading ? "Uploading file..." : "Type a message..."}
              disabled={uploading}
              className="flex-1 bg-transparent text-sm focus:outline-none outline-none py-1 placeholder-slate-400"
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={uploading || (!text.trim() && !file)}
              className={`p-3 rounded-full text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${chatTheme.id === 'neon' ? 'bg-pink-600 hover:bg-pink-750' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
