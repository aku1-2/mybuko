'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, X, Heart, MessageCircle, Send, Sparkles, Image as ImageIcon, Lock } from 'lucide-react'
import { useTheme } from '@/app/theme-provider'
import { motion, AnimatePresence } from 'framer-motion'

interface Comment {
    id: string
    content: string
    user: { id: string; name: string }
}

interface Like {
    id: string
    userId: string
}

interface Story {
    id: string
    mediaUrl: string
    mediaType: string
    createdAt: string
    user: { id: string; name: string; profileImage?: string }
    likes: Like[]
    comments: Comment[]
}

interface GroupedStory {
    user: Story['user']
    stories: Story[]
}

export default function StoriesBar() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [grouped, setGrouped] = useState<GroupedStory[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [viewingGroup, setViewingGroup] = useState<GroupedStory | null>(null)
    const [storyIndex, setStoryIndex] = useState(0)
    const [uploading, setUploading] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [likePulse, setLikePulse] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('user')
        const token = localStorage.getItem('token')
        if (stored && token) {
            setIsLoggedIn(true)
            setCurrentUserId(JSON.parse(stored).id)
        }
        fetchStories()
    }, [])

    async function fetchStories() {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/stories', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
            })
            if (!res.ok) return
            const data: Story[] = await res.json()
            const map = new Map<string, GroupedStory>()
            for (const story of data) {
                if (!map.has(story.user.id)) map.set(story.user.id, { user: story.user, stories: [] })
                map.get(story.user.id)!.stories.push(story)
            }
            setGrouped(Array.from(map.values()))
        } catch (e) {
            console.error(e)
        }
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            // Upload to Cloudinary
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
            if (!uploadRes.ok) throw new Error('Upload failed')
            const { url, mediaType } = await uploadRes.json()
            const token = localStorage.getItem('token')

            // Save story to DB
            await fetch('/api/stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ mediaUrl: url, mediaType })
            })

            await fetchStories()
        } catch (err) {
            console.error(err)
            alert('Failed to upload story.')
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    async function handleLike(storyId: string) {
        setLikePulse(true)
        setTimeout(() => setLikePulse(false), 500)
        
        const token = localStorage.getItem('token')
        await fetch(`/api/stories/${storyId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ action: 'like' })
        })
        await fetchStories()
        // refresh viewing group
        if (viewingGroup) {
            const updated = grouped.find(g => g.user.id === viewingGroup.user.id)
            if (updated) setViewingGroup({ ...updated })
        }
    }

    async function handleComment(storyId: string) {
        if (!commentText.trim()) return
        const token = localStorage.getItem('token')
        await fetch(`/api/stories/${storyId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ action: 'comment', content: commentText })
        })
        setCommentText('')
        await fetchStories()
        if (viewingGroup) {
            const updated = grouped.find(g => g.user.id === viewingGroup.user.id)
            if (updated) setViewingGroup({ ...updated })
        }
    }

    function openStory(group: GroupedStory) {
        setViewingGroup(group)
        setStoryIndex(0)
        setCommentText('')
    }

    function nextStory() {
        if (!viewingGroup) return
        if (storyIndex < viewingGroup.stories.length - 1) {
            setStoryIndex(i => i + 1)
            setCommentText('')
        } else {
            setViewingGroup(null)
        }
    }

    function formatPostDate(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const myGroup = grouped.find(g => g.user.id === currentUserId)
    const othersGroups = grouped.filter(g => g.user.id !== currentUserId)
    const currentStory = viewingGroup?.stories[storyIndex]

    return (
        <div className="relative">
            {/* Locked Overlay if not logged in */}
            {!isLoggedIn && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/40 dark:bg-[#030712]/50 backdrop-blur-xs p-4 rounded-3xl">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-500 text-white rounded-full font-bold text-xs shadow-md">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Login to view moments</span>
                    </div>
                </div>
            )}

            {/* Stories Bar Container */}
            <div className={`rounded-3xl border p-5 transition-all duration-300 ${
                !isLoggedIn ? 'filter blur-xs select-none pointer-events-none opacity-40' : ''
            } ${
                isDark 
                    ? 'bg-[#0b0f19]/80 backdrop-blur-xl border-white/5 shadow-glow-violet' 
                    : 'bg-white border-slate-200 shadow-sm'
            }`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    <h3 className="text-xs uppercase font-extrabold tracking-[0.2em] text-slate-450 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Community Moments
                    </h3>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Your Story Upload Circle */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="relative w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center cursor-pointer shadow-md"
                        >
                            <div className={`w-full h-full rounded-full flex items-center justify-center border-2 border-white dark:border-[#0b0f19] ${
                                isDark ? 'bg-slate-900' : 'bg-slate-50'
                            }`}>
                                {myGroup?.user.profileImage ? (
                                    <img src={myGroup.user.profileImage} className="w-full h-full rounded-full object-cover" alt="You" />
                                ) : (
                                    <Plus className="w-5 h-5 text-violet-500" />
                                )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0b0f19]">
                                <Plus className="w-3 h-3 text-white" />
                            </span>
                        </motion.button>
                        <span className={`text-[11px] font-bold tracking-wide ${isDark ? 'text-slate-455' : 'text-slate-500'}`}>
                            {uploading ? 'Adding...' : 'Post Story'}
                        </span>
                    </div>

                    {/* My story play button */}
                    {myGroup && (
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            onClick={() => openStory(myGroup)} 
                            className="flex flex-col items-center gap-2 flex-shrink-0"
                        >
                            <div className="w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-violet-600 via-pink-500 to-rose-500 animate-gradient-xy">
                                <div className={`w-full h-full rounded-full p-0.5 ${isDark ? 'bg-[#0b0f19]' : 'bg-white'}`}>
                                    {myGroup.user.profileImage ? (
                                        <img src={myGroup.user.profileImage} className="w-full h-full rounded-full object-cover" alt="My story" />
                                    ) : (
                                        <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                            {myGroup.user.name[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-655'}`}>My posts</span>
                        </motion.button>
                    )}

                    {/* Others stories */}
                    {othersGroups.map(group => (
                        <motion.button 
                            key={group.user.id} 
                            whileHover={{ scale: 1.05 }}
                            onClick={() => openStory(group)} 
                            className="flex flex-col items-center gap-2 flex-shrink-0"
                        >
                            <div className="w-15 h-15 rounded-full p-0.5 bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 hover:rotate-12 transition-transform duration-300">
                                <div className={`w-full h-full rounded-full p-0.5 ${isDark ? 'bg-[#0b0f19]' : 'bg-white'}`}>
                                    {group.user.profileImage ? (
                                        <img src={group.user.profileImage} className="w-full h-full rounded-full object-cover" alt={group.user.name} />
                                    ) : (
                                        <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-750'}`}>
                                            {group.user.name[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className={`text-[11px] font-bold max-w-[60px] truncate ${isDark ? 'text-slate-400' : 'text-slate-655'}`}>
                                {group.user.name.split(' ')[0]}
                            </span>
                        </motion.button>
                    ))}

                    {grouped.length === 0 && (
                        <p className={`text-xs self-center ml-2 italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            No active moments yet. Share your first moment!
                        </p>
                    )}
                </div>
            </div>

            {/* Hidden Input file */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Premium Glassmorphic Modal Viewer */}
            <AnimatePresence>
                {viewingGroup && currentStory && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-0 sm:p-4"
                    >
                        <div className="relative w-full h-full sm:max-w-md sm:h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col bg-slate-955 shadow-[0_30px_70px_rgba(0,0,0,0.8)] border border-white/5">
                            
                            {/* Top Progress Bars */}
                            <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-30">
                                {viewingGroup.stories.map((_, i) => (
                                    <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: i < storyIndex ? '100%' : i === storyIndex ? '100%' : '0%' }}
                                            transition={{ 
                                                duration: i === storyIndex ? 5 : 0.1, 
                                                ease: "linear" 
                                            }}
                                            onAnimationComplete={() => {
                                                if (i === storyIndex) nextStory()
                                            }}
                                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* User Info Header */}
                             <div className="absolute top-6 left-4 right-4 flex items-center justify-between z-30">
                                <div className="flex items-center gap-3">
                                    {viewingGroup.user.profileImage ? (
                                        <img src={viewingGroup.user.profileImage} className="w-9 h-9 rounded-full object-cover border border-white/10" alt="avatar" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-black">
                                            {viewingGroup.user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-white leading-tight">{viewingGroup.user.name}</p>
                                        <p className="text-[9px] text-slate-400">{formatPostDate(currentStory.createdAt)}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setViewingGroup(null)}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Media Viewer */}
                            <div className="flex-1 bg-black flex items-center justify-center min-h-0 relative">
                                {currentStory.mediaType.startsWith('image') ? (
                                    <img src={currentStory.mediaUrl} className="max-w-full max-h-full object-contain" alt="Story" />
                                ) : (
                                    <video src={currentStory.mediaUrl} controls autoPlay className="max-w-full max-h-full object-contain" />
                                )}

                                {/* Left & Right navigation tap zones */}
                                <div className="absolute inset-0 flex z-10">
                                    <div 
                                        className="w-1/3 h-full cursor-pointer" 
                                        onClick={() => {
                                            if (storyIndex > 0) {
                                                setStoryIndex(i => i - 1)
                                                setCommentText('')
                                            }
                                        }} 
                                    />
                                    <div className="w-1/3 h-full" />
                                    <div 
                                        className="w-1/3 h-full cursor-pointer" 
                                        onClick={nextStory} 
                                    />
                                </div>
                                
                                {/* Animated Heart Overlay on Double Tap or Like Action */}
                                <AnimatePresence>
                                    {likePulse && (
                                        <motion.div 
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: [1, 1.4, 1.2], opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute pointer-events-none z-20"
                                        >
                                            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Bottom Interactivity Drawer */}
                            <div className="p-4 bg-slate-900 border-t border-white/5 space-y-4 shrink-0 z-20">
                                
                                {/* Likes & Comments stats row */}
                                <div className="flex items-center justify-between text-xs text-slate-350">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => handleLike(currentStory.id)}
                                            className="flex items-center gap-1.5 hover:text-rose-500 transition cursor-pointer"
                                        >
                                            <Heart className={`w-4 h-4 ${
                                                currentStory.likes.some(l => l.userId === currentUserId)
                                                    ? 'text-rose-500 fill-rose-500'
                                                    : ''
                                            }`} />
                                            <span className="font-bold">{currentStory.likes.length}</span>
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            <MessageCircle className="w-4 h-4" />
                                            <span className="font-bold">{currentStory.comments.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Thread Section */}
                                {currentStory.comments.length > 0 && (
                                    <div className="max-h-24 overflow-y-auto space-y-2.5 pr-1 border-t border-white/5 pt-3 scrollbar-hide">
                                        {currentStory.comments.map(c => (
                                            <div key={c.id} className="text-[11px] leading-relaxed">
                                                <span className="font-extrabold text-white mr-1.5">{c.user.name}:</span>
                                                <span className="text-slate-300 font-medium">{c.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Comment Reply Input Box */}
                                <div className="flex gap-2.5 items-center">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleComment(currentStory.id)}
                                        placeholder="Send a direct reply..."
                                        className="flex-1 text-xs rounded-full px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                    />
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleComment(currentStory.id)}
                                        className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </motion.button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}