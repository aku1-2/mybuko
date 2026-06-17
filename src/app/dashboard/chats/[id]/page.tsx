"use client"

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '../../../theme-provider'
import {
  ArrowLeft, Smile, Paperclip, Palette, Send, Download,
  FileText, Sparkles, Trash2, Search, Star, Globe, Mic,
  CirclePlay, CheckCheck, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'

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
    bg: 'bg-slate-55 dark:bg-[#030712]',
    listBg: 'bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 backdrop-blur-xl',
    sentBubble: 'bg-indigo-650 text-white shadow-sm shadow-indigo-500/10',
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
  { id: 'gif1', name: 'Congratulations', url: 'https://i.giphy.com/3ocD4yGjOgu7G9Gel6.gif' },
  { id: 'gif2', name: 'Celebration Dance', url: 'https://i.giphy.com/l3vRlTKuRxCwpSVQQ.gif' },
  { id: 'gif3', name: 'Success Goal', url: 'https://i.giphy.com/q7Ow58xLr1Js4.gif' },
  { id: 'gif4', name: 'Thumbs Up Work', url: 'https://i.giphy.com/1236TCtCO5dsGE.gif' },
  { id: 'gif5', name: 'High Five Team', url: 'https://i.giphy.com/3oEjHV0zqZuR596caa.gif' },
  { id: 'gif6', name: 'Celebration Confetti', url: 'https://i.giphy.com/l41YkxvU8c7J7B9a8.gif' },
  { id: 'gif7', name: 'Minions Happy', url: 'https://i.giphy.com/Is1O1TWVgtg4c.gif' },
  { id: 'gif8', name: 'Success Yes', url: 'https://i.giphy.com/chzz1FQgqhytWRWbp3.gif' },
  { id: 'gif9', name: 'Rocket Launch', url: 'https://i.giphy.com/txlxp5iSp6IE8.gif' },
  { id: 'gif10', name: 'Winner Trophy', url: 'https://i.giphy.com/2s1152aX1xN1S.gif' }
]

const POPULAR_EMOJIS = [
  '😊', '😂', '😍', '👍', '🔥', '🎉', '🚀', '❤️',
  '👏', '🥳', '🌟', '💪', '💯', '✨', '🎈', '🤩',
  '🙌', '👌', '⚡', '💡', '🏆', '🎯', '📍', '🗺️'
]

const renderMessageText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-cyan-400 dark:text-cyan-300 hover:opacity-85 break-all font-bold"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

function AudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(src)
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().catch(err => console.error("Playback failed", err))
      setPlaying(true)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-black/20 text-white min-w-[200px] border border-white/5 shadow-inner">
      <button
        onClick={togglePlay}
        className="p-1.5 bg-indigo-500 hover:bg-indigo-650 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
      >
        {playing ? (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-white/20 rounded-full overflow-hidden w-full relative">
          <div className="absolute top-0 left-0 h-full bg-indigo-400" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[8px] text-slate-350 mt-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
      <span className="text-[9px] font-bold tracking-wider shrink-0 text-indigo-300">Voice Note</span>
    </div>
  )
}

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

  // Real-time states
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [otherTypingName, setOtherTypingName] = useState('')
  const [otherLastSeenAt, setOtherLastSeenAt] = useState<string | null>(null)

  // Infinite Scroll Pagination states
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<any>(null)

  // Sidebar Chats List state
  const [chats, setChats] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<'all' | 'unread' | 'favorites'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Simulated recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const recordInterval = useRef<any>(null)

  // Real recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Custom theme choices
  const [chatTheme, setChatTheme] = useState<ChatTheme>(CHAT_THEMES[0])
  const [showThemePicker, setShowThemePicker] = useState(false)

  // Smileys/stickers selector panel states
  const [showPickerPanel, setShowPickerPanel] = useState(false)
  const [activePickerTab, setActivePickerTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji')

  // Selected message for deletion modal
  const [selectedDeleteMessage, setSelectedDeleteMessage] = useState<any | null>(null)
  const [bubbleHoverReactionId, setBubbleHoverReactionId] = useState<string | number | null>(null)

  // Keep scroll position relative to bottom when loading more messages
  const lastScrollHeightRef = useRef<number>(0)
  const keepScrollPositionRef = useRef<boolean>(false)

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

  // Initial Load of Messages (latest 20)
  const fetchMessagesInitial = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        const parsedMsgs = (data.messages || []).map((m: any) => ({
          ...m,
          reactions: typeof m.reactions === 'string'
            ? m.reactions.split(',').filter(Boolean)
            : Array.isArray(m.reactions) ? m.reactions : []
        }))
        setMessages(parsedMsgs)
        setHasMore(parsedMsgs.length === 20)
        if (data.other) {
          setOther(data.other)
        }
        if (data.otherLastSeenAt) {
          setOtherLastSeenAt(data.otherLastSeenAt)
        }

        // Emit mark_seen to tell the socket server we read the conversation
        if (socketRef.current) {
          socketRef.current.emit('mark_seen', { chatId })
        }
      }
    } catch (err) {
      console.error('Initial messages fetch error:', err)
    } finally {
      setLoading(false)
      // Scroll to bottom on initial load
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      }, 50)
    }
  }, [chatId, router])

  // Load older messages on scroll top (Infinite Scroll)
  const fetchMessagesMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)

    const token = localStorage.getItem('token')
    if (!token) {
      setLoadingMore(false)
      return
    }

    try {
      const oldestMsg = messages[0]
      const url = `/api/chats/${chatId}/messages?cursor=${encodeURIComponent(oldestMsg.id)}`

      // Save scroll metrics before updating state
      if (listRef.current) {
        lastScrollHeightRef.current = listRef.current.scrollHeight
        keepScrollPositionRef.current = true
      }

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        const olderMessages = (data.messages || []).map((m: any) => ({
          ...m,
          reactions: typeof m.reactions === 'string'
            ? m.reactions.split(',').filter(Boolean)
            : Array.isArray(m.reactions) ? m.reactions : []
        }))

        if (olderMessages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const uniqueOlder = olderMessages.filter((m: any) => !existingIds.has(m.id))
            return [...uniqueOlder, ...prev]
          })
          setHasMore(olderMessages.length === 20)
        } else {
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error('Failed to load older messages:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [chatId, messages, loadingMore, hasMore])

  // Handle restoring scroll position when prepending messages
  useLayoutEffect(() => {
    if (keepScrollPositionRef.current && listRef.current) {
      const scrollContainer = listRef.current
      const delta = scrollContainer.scrollHeight - lastScrollHeightRef.current
      scrollContainer.scrollTop = delta
      keepScrollPositionRef.current = false
    }
  }, [messages])

  // Scroll event listener for infinite scroll triggering
  const handleScroll = () => {
    if (listRef.current) {
      const container = listRef.current
      // If user scrolled to the top, trigger loading more messages
      if (container.scrollTop <= 5) {
        fetchMessagesMore()
      }
    }
  }

  // Socket.IO connection and event listener setup
  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!storedUser || !token) {
      router.push('/auth/login')
      return
    }
    const parsed = JSON.parse(storedUser)
    setUser(parsed)

    // Load theme preference
    const savedThemeId = localStorage.getItem(`mybuko-chat-theme-${chatId}`)
    if (savedThemeId) {
      const match = CHAT_THEMES.find(t => t.id === savedThemeId)
      if (match) setChatTheme(match)
    }

    fetchChats()
    fetchMessagesInitial()

    // Initialize WebSockets
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    const socket = io(socketUrl, {
      auth: { token }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to socket server in Chat Room')
      socket.emit('join_room', { chatId })
    })

    // Listen for live messages in the room
    socket.on('message', (message) => {
      const parsedMessage = {
        ...message,
        reactions: typeof message.reactions === 'string'
          ? message.reactions.split(',').filter(Boolean)
          : Array.isArray(message.reactions) ? message.reactions : []
      }
      // 1. Add message to feed (and clear matching optimistic message if any)
      setMessages(prev => {
        // If message already exists, skip
        if (prev.some(m => m.id === parsedMessage.id)) return prev

        // Remove optimistic message that matches the same sender and content
        let filtered = prev
        if (parsedMessage.senderId === parsed.id) {
          filtered = prev.filter(m => !(m.sending && m.text === parsedMessage.text))
        }

        return [...filtered, parsedMessage]
      })

      // 2. Clear typing indicator for the sender
      if (parsedMessage.senderId !== parsed.id) {
        setIsOtherTyping(false)
        // Mark seen in database via WebSockets immediately since the chat is open
        socket.emit('mark_seen', { chatId })
      }

      // 3. Scroll to bottom
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
        }
      }, 50)
    })

    // Listen for typing indicators
    socket.on('typing', ({ name }) => {
      setOtherTypingName(name)
      setIsOtherTyping(true)

      // Auto scroll to typing indicator if scrolled to bottom
      setTimeout(() => {
        if (listRef.current) {
          const c = listRef.current
          if (c.scrollHeight - c.scrollTop - c.clientHeight < 100) {
            c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' })
          }
        }
      }, 50)
    })

    socket.on('stop_typing', () => {
      setIsOtherTyping(false)
    })

    // Listen for read receipts
    socket.on('mark_seen', ({ lastSeenAt }) => {
      setOtherLastSeenAt(lastSeenAt)
    })

    // Listen for incoming message reactions
    socket.on('message_reaction', ({ messageId, emoji }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const reacts = Array.isArray(m.reactions) ? m.reactions : []
          return { ...m, reactions: [...reacts, emoji] }
        }
        return m
      }))
    })

    // Listen for live updates to the chat list (sidebar synchronization)
    socket.on(`chat_list_update:${parsed.id}`, ({ chatId: updatedChatId, lastMessage, updatedAt }) => {
      setChats(prevChats => {
        const existingChatIdx = prevChats.findIndex(c => c.id === updatedChatId)
        if (existingChatIdx === -1) {
          fetchChats()
          return prevChats
        }

        const updatedChats = [...prevChats]
        const existingChat = updatedChats[existingChatIdx]

        // Keep unreadCount 0 if we are actively viewing this chat room
        const isFromOther = lastMessage.senderId !== parsed.id
        const isCurrentlyViewing = updatedChatId === chatId
        const newUnread = (isFromOther && !isCurrentlyViewing) ? existingChat.unreadCount + 1 : 0

        updatedChats[existingChatIdx] = {
          ...existingChat,
          lastMessage,
          updatedAt,
          unreadCount: newUnread
        }

        return updatedChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      })
    })

    return () => {
      if (socket) {
        socket.emit('leave_room', { chatId })
        socket.disconnect()
      }
    }
  }, [chatId, router, fetchMessagesInitial, fetchChats])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)

    if (!socketRef.current || !user) return

    // Emit typing indicator
    socketRef.current.emit('typing', { chatId, name: user.name })

    // Debounce stop_typing emission
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { chatId })
      }
    }, 2000)
  }

  const handleInputBlur = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { chatId })
    }
  }

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

  const sendMsgREST = async (messageText: string, fileUrl: string | null = null, fileType: string | null = null) => {
    if (!user) return
    const token = localStorage.getItem('token')
    if (!token) return

    // Optimistic UI update: append message instantly to feed
    const tempId = `temp-${Date.now()}`
    const tempMsg = {
      id: tempId,
      text: messageText,
      fileUrl: fileUrl,
      fileType: fileType,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      sending: true
    }
    setMessages(prev => [...prev, tempMsg])
    setText('')

    // Scroll immediately
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }, 20)

    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: messageText,
          fileUrl,
          fileType
        })
      })

      if (res.ok) {
        const data = await res.json()
        const savedMessage = data.message

        // Replace optimistic message with the saved one
        setMessages(prev => prev.map(m => m.id === tempId ? savedMessage : m))

        // Emit broadcast via WebSocket if connected
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('broadcast_saved_message', {
            chatId,
            message: savedMessage
          })
        }
      } else {
        console.error('Failed to send message via REST')
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sending: false, error: true } : m))
      }
    } catch (err) {
      console.error('REST send message error:', err)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sending: false, error: true } : m))
    }
  }

  const handleSendFileMsg = (fileUrl: string, fileType: string) => {
    sendMsgREST('', fileUrl, fileType)
  }

  // Send message over REST API with optimistic UI and socket broadcast
  const sendMessage = async () => {
    if (!text.trim() && !file) return
    if (!user) return

    // Clear typing indicator timeouts
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stop_typing', { chatId })
    }

    setUploading(true)

    try {
      if (file) {
        // Upload media attachments via API POST first to get the URL
        const fd = new FormData()
        fd.append('file', file)
        const up = await fetch('/api/files/upload', { method: 'POST', body: fd })
        if (up.ok) {
          const d = await up.json()
          await sendMsgREST('', d.url, file.type)
        }
        setFile(null)
        setFileNameText('')
      } else {
        const messageText = text.trim()
        await sendMsgREST(messageText)
      }
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMessage = async (deleteType: 'me' | 'everyone') => {
    if (!selectedDeleteMessage) return
    const token = localStorage.getItem('token')
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
    } finally {
      setSelectedDeleteMessage(null)
    }
  }

  // Handle real voice note recording and upload
  const handleToggleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        audioChunksRef.current = []

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

          // Create file upload Form Data
          const fd = new FormData()
          fd.append('file', audioBlob, `voice-note-${Date.now()}.webm`)

          try {
            const up = await fetch('/api/files/upload', { method: 'POST', body: fd })
            if (up.ok) {
              const d = await up.json()
              await sendMsgREST('', d.url, 'audio/webm')
            } else {
              console.error('Failed to upload real voice note')
            }
          } catch (err) {
            console.error('Error uploading voice note:', err)
          }
          audioChunksRef.current = []
        }

        recorder.start()
        setIsRecording(true)
        setRecordingSeconds(0)
        recordInterval.current = setInterval(() => {
          setRecordingSeconds(prev => prev + 1)
        }, 1000)

      } catch (err) {
        console.error('Mic permission denied or MediaRecorder error:', err)
        alert('Please enable microphone access to record voice notes.')
      }
    } else {
      // Stop timer
      if (recordInterval.current) clearInterval(recordInterval.current)
      setIsRecording(false)

      // Stop recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      // Stop mic streams to release the device
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
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

  const reactMessage = (msgId: string, emoji: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('react_message', { chatId, messageId: msgId, emoji })
    }

    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reacts = Array.isArray(m.reactions) ? m.reactions : []
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

  // Sidebar Chats List search
  const filteredChats = chats
    .filter(chat => {
      const otherUser = chat.otherParticipant
      if (!otherUser) return false
      const nameMatch = otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())

      if (activeCategory === 'unread') return nameMatch && chat.unreadCount > 0
      if (activeCategory === 'favorites') return nameMatch && chat.id.charCodeAt(0) % 2 === 0
      return nameMatch
    })

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${isGlobalDark ? 'bg-[#030712] text-slate-100' : 'bg-slate-55 text-slate-900'
      }`}>

      {/* Background patterns */}
      <div className="absolute inset-0 noise-overlay pointer-events-none z-0" />

      {/* Main Split Layout container */}
      <div className="max-w-7xl mx-auto px-4 py-6 h-[95vh] relative z-10 flex flex-col lg:flex-row gap-6">

        {/* LEFT PANEL: Messages Sidebar (Desktop only) */}
        <aside className="hidden lg:flex w-[320px] shrink-0 rounded-3xl border flex-col overflow-hidden shadow-lg bg-[#0b0f19]/80 border-white/5 shadow-glow-violet">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <Link
                href="/dashboard/chats"
                className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 hover:text-indigo-300"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Messages
              </Link>
            </div>

            {/* Sidebar search */}
            <div className="relative flex items-center rounded-xl bg-slate-950/60 border border-white/5 px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-550 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-[11px] focus:outline-none placeholder-slate-500 text-white"
              />
            </div>

            {/* Sidebar Categories tab filters */}
            <div className="flex gap-0.5 bg-slate-955/50 p-0.5 rounded-lg border border-white/5">
              {(['all', 'unread', 'favorites'] as const).map(tab => {
                const isActive = activeCategory === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveCategory(tab)}
                    className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer ${isActive ? 'bg-white/5 text-violet-400 font-bold' : 'text-slate-400 hover:text-slate-200'
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
              const otherUser = c.otherParticipant
              const active = c.id === chatId
              const isUnread = c.unreadCount > 0
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/dashboard/chats/${c.id}`)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${active
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
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {c.lastMessage?.text ? c.lastMessage.text : c.lastMessage?.fileUrl ? 'Attachment' : 'No messages'}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="w-2 h-2 bg-indigo-550 rounded-full shrink-0 animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* RIGHT PANEL: Active conversation view */}
        <main className={`flex-1 min-w-0 rounded-3xl border overflow-hidden flex flex-col shadow-lg transition-all ${chatTheme.listBg
          }`}>

          {/* Conversation Header */}
          <div className="p-4 border-b flex items-center justify-between dark:border-white/5 border-slate-150 shrink-0">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/chats"
                className={`p-2 rounded-full border transition-all lg:hidden ${isGlobalDark ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
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
                <p className="text-[9px] text-slate-500">{other?.email || 'Synchronizing chat...'}</p>
              </div>
            </div>

            {/* Theme switcher palette */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className={`p-2 rounded-full border transition-all ${isGlobalDark ? 'bg-slate-900 border-white/5 text-purple-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-purple-600 hover:bg-slate-50'
                  } cursor-pointer`}
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
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${chatTheme.id === themeItem.id
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
            onScroll={handleScroll}
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
              <>
                {/* Scroll Loader indicator */}
                {loadingMore && (
                  <div className="py-2 flex justify-center items-center gap-1 text-[10px] text-slate-500">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span>Loading history...</span>
                  </div>
                )}

                {messages.map((m) => {
                  const isMine = m.senderId === user.id
                  const isDoc = isDocument(m.fileType, m.fileUrl)
                  const isVid = m.fileType?.startsWith('video/')
                  const isImg = m.fileType?.startsWith('image/') || m.fileType === 'sticker'
                  const isAudio = m.fileType?.startsWith('audio/')

                  // Read Receipt check based on lastSeenAt
                  const isSeen = isMine && otherLastSeenAt && new Date(m.createdAt) <= new Date(otherLastSeenAt)

                  return (
                    <div key={m.id} className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`flex items-center gap-2.5 max-w-[80%] group relative ${isMine ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        onMouseEnter={() => setBubbleHoverReactionId(m.id)}
                        onMouseLeave={() => setBubbleHoverReactionId(null)}
                      >

                        {/* Message Bubble box */}
                        <div className={`rounded-3xl px-4 py-3 border border-opacity-10 shadow-sm relative transition-all ${m.deletedForEveryone
                            ? 'bg-slate-100/30 text-slate-400 dark:bg-white/5 dark:text-slate-500 italic border-dashed'
                            : isMine ? chatTheme.sentBubble : chatTheme.receivedBubble
                          } ${m.sending ? 'opacity-60 duration-150 animate-pulse' : ''}`}>
                          {m.deletedForEveryone ? (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span>🚫 Message deleted for everyone</span>
                            </div>
                          ) : (
                            <>
                              {/* Text content */}
                              {m.text && <p className="text-xs leading-relaxed whitespace-pre-wrap">{renderMessageText(m.text)}</p>}

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
                                    <AudioPlayer src={m.fileUrl} />
                                  )}

                                  {isDoc && (
                                    <div className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left ${isMine ? 'bg-black/10 border-white/10' : 'bg-slate-55 dark:bg-slate-900 border-slate-200 dark:border-white/5'
                                      }`}>
                                      <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                                          {m.fileUrl.split('/').pop()?.substring(13) || 'Attached Document'}
                                        </p>
                                        <p className="text-[9px] text-slate-500">File Attachment</p>
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
                        {!m.deletedForEveryone && !m.sending && bubbleHoverReactionId === m.id && (
                          <div className={`flex gap-1.5 items-center absolute z-25 ${isMine ? '-left-16' : '-right-16'
                            } bg-slate-900 border border-white/10 px-2 py-1.5 rounded-full shadow-xl animate-fade-in`}>

                            <button
                              onClick={() => reactMessage(m.id, '❤️')}
                              className="hover:scale-120 transition text-xs cursor-pointer"
                            >
                              ❤️
                            </button>

                            <button
                              onClick={() => reactMessage(m.id, '👍')}
                              className="hover:scale-120 transition text-xs cursor-pointer"
                            >
                              👍
                            </button>

                            <button
                              onClick={() => setSelectedDeleteMessage(m)}
                              className="p-1 rounded-full text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
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
                        {isMine && (
                          <span className="text-[9px] text-indigo-400 flex items-center gap-0.5">
                            <CheckCheck className="w-3 h-3 text-indigo-400" />
                            {isSeen ? 'Seen' : 'Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {/* Live Typing indicator animation */}
            {isOtherTyping && (
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-650 to-indigo-500 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                    {other?.name ? other.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 border dark:border-white/5 flex gap-1 items-center ${chatTheme.receivedBubble}`}>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:0.6s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]" />
                  </div>
                </div>
                <span className="text-[8px] text-slate-550 ml-9 font-semibold">{otherTypingName} is typing...</span>
              </div>
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
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${activePickerTab === tab ? 'bg-violet-650 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        {tab === 'emoji' ? '😊 Emojis' : tab === 'gif' ? '🎬 GIFs' : '🎨 Stickers'}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setShowPickerPanel(false)} className="text-slate-500 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activePickerTab === 'emoji' && (
                  <div className="grid grid-cols-8 sm:grid-cols-12 gap-3 max-h-32 overflow-y-auto p-1 justify-items-center scrollbar-hide">
                    {POPULAR_EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertEmoji(emoji)}
                        className="text-xl hover:scale-125 transition focus:outline-none cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {activePickerTab === 'gif' && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-32 overflow-y-auto p-1 scrollbar-hide">
                    {MOCK_GIF_REACTIONS.map((gif) => (
                      <img
                        key={gif.id}
                        src={gif.url}
                        alt={gif.name}
                        onClick={() => sendGif(gif.url)}
                        className="h-16 w-full object-cover rounded-xl hover:scale-102 cursor-pointer transition border border-white/5"
                      />
                    ))}
                  </div>
                )}

                {activePickerTab === 'sticker' && (
                  <div className="grid grid-cols-5 gap-3 max-h-32 overflow-y-auto p-1 scrollbar-hide justify-items-center">
                    {MOCK_STICKERS.map((sticker) => (
                      <img
                        key={sticker.id}
                        src={sticker.url}
                        alt={sticker.label}
                        onClick={() => sendSticker(sticker.url)}
                        className="h-14 w-14 object-contain rounded-xl hover:scale-110 cursor-pointer transition"
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice note simulated indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mx-4 my-2 p-3 bg-indigo-650/15 border border-indigo-500/20 text-indigo-300 text-xs rounded-2xl flex items-center justify-between z-10"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Recording voice note...</span>
                </div>
                <span className="font-mono font-bold">{recordingSeconds}s</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message input area */}
          <div className="p-4 border-t border-slate-150 dark:border-white/5 flex gap-2.5 items-center shrink-0">
            <button
              onClick={() => setShowPickerPanel(!showPickerPanel)}
              className={`p-2.5 rounded-full border transition-all ${isGlobalDark ? 'bg-slate-900 border-white/5 text-slate-350 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                } cursor-pointer`}
              title="Add Sticker / Emoji"
            >
              <Smile className="w-4.5 h-4.5" />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={text}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={fileNameText ? `File attached: ${fileNameText}` : "Message..."}
                disabled={uploading}
                className={`w-full pl-4 pr-12 py-3 text-xs border rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder-slate-500 transition-all ${chatTheme.inputBg
                  }`}
              />

              <label className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 hover:text-slate-300">
                <Paperclip className="w-4.5 h-4.5" />
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Mic / Voice Message Trigger */}
            <button
              onClick={handleToggleRecord}
              className={`p-2.5 rounded-full border transition-all ${isRecording
                  ? 'bg-rose-600/15 border-rose-500/30 text-rose-400 hover:bg-rose-600/20'
                  : isGlobalDark ? 'bg-slate-900 border-white/5 text-slate-350 hover:bg-slate-850' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-150'
                } cursor-pointer`}
              title={isRecording ? 'Stop & Send Recording' : 'Record Voice Note'}
            >
              <Mic className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={sendMessage}
              disabled={(!text.trim() && !file) || uploading}
              className="p-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50 transition shadow-md cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </main>
      </div>

      {/* Delete message verification modal dialog */}
      <AnimatePresence>
        {selectedDeleteMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeleteMessage(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0c101a] p-6 shadow-2xl relative z-10 text-center space-y-4 text-slate-200"
            >
              <h3 className="text-sm font-black tracking-wide text-white uppercase">Delete message?</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Are you sure you want to delete this message? You can delete it for just yourself or for everyone.
              </p>

              <div className="flex flex-col gap-2 pt-2">
                {selectedDeleteMessage.senderId === user.id && (
                  <button
                    onClick={() => handleDeleteMessage('everyone')}
                    className="w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition cursor-pointer"
                  >
                    Delete for Everyone
                  </button>
                )}

                <button
                  onClick={() => handleDeleteMessage('me')}
                  className="w-full py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Delete for Me
                </button>

                <button
                  onClick={() => setSelectedDeleteMessage(null)}
                  className="w-full py-2 text-slate-500 rounded-xl text-xs hover:text-slate-350 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
