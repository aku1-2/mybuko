'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, X, Heart, MessageCircle, Send } from 'lucide-react'
import { useTheme } from '@/app/theme-provider'

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

    useEffect(() => {
        const stored = localStorage.getItem('user')
        if (stored) setCurrentUserId(JSON.parse(stored).id)
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
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    async function handleLike(storyId: string) {
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

    const myGroup = grouped.find(g => g.user.id === currentUserId)
    const othersGroups = grouped.filter(g => g.user.id !== currentUserId)
    const currentStory = viewingGroup?.stories[storyIndex]

    return (
        <>
            {/* Stories Bar */}
            <div className={`rounded-2xl border p-4 mb-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">

                    {/* Your Story */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="relative w-14 h-14 rounded-full"
                        >
                            {myGroup?.user.profileImage
                                ? <img src={myGroup.user.profileImage} className="w-14 h-14 rounded-full object-cover border-2 border-violet-500" alt="You" />
                                : <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-dashed ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-100'}`}>
                                    {uploading
                                        ? <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                        : <Plus className="w-5 h-5 text-violet-500" />}
                                </div>}
                            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                                <Plus className="w-3 h-3 text-white" />
                            </span>
                        </button>
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {uploading ? 'Uploading...' : 'Your story'}
                        </span>
                    </div>

                    {/* Your existing stories (clickable) */}
                    {myGroup && (
                        <button onClick={() => openStory(myGroup)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-violet-500 to-pink-500">
                                {myGroup.user.profileImage
                                    ? <img src={myGroup.user.profileImage} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900" alt="Your story" />
                                    : <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold border-2 ${isDark ? 'border-slate-900 bg-slate-800 text-white' : 'border-white bg-slate-200 text-slate-700'}`}>
                                        {myGroup.user.name[0].toUpperCase()}
                                    </div>}
                            </div>
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>My posts</span>
                        </button>
                    )}

                    {/* Others */}
                    {othersGroups.map(group => (
                        <button key={group.user.id} onClick={() => openStory(group)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-violet-500 to-pink-500">
                                {group.user.profileImage
                                    ? <img src={group.user.profileImage} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900" alt={group.user.name} />
                                    : <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold border-2 ${isDark ? 'border-slate-900 bg-slate-800 text-white' : 'border-white bg-slate-200 text-slate-700'}`}>
                                        {group.user.name[0].toUpperCase()}
                                    </div>}
                            </div>
                            <span className={`text-xs font-medium max-w-[56px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {group.user.name.split(' ')[0]}
                            </span>
                        </button>
                    ))}

                    {grouped.length === 0 && (
                        <p className={`text-sm self-center ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Follow people to see their stories here!
                        </p>
                    )}
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* View Story Modal - FULL SCREEN */}
            {viewingGroup && currentStory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-0">
                    <div className="w-full h-full flex flex-col bg-black">

                        {/* Progress bars */}
                        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
                            {viewingGroup.stories.map((_, i) => (
                                <div key={i} className={`h-0.5 flex-1 rounded-full ${i <= storyIndex ? 'bg-white' : 'bg-white/30'}`} />
                            ))}
                        </div>

                        {/* Header */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                    {viewingGroup.user.name[0]}
                                </div>
                                <div>
                                    <p className="text-white text-sm font-semibold">{viewingGroup.user.name}</p>
                                    <p className="text-white/50 text-xs">{new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingGroup(null)} className="p-1">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Media - Fill screen */}
                        <div
                            className="flex-1 flex items-center justify-center bg-black cursor-pointer relative"
                            onClick={nextStory}
                        >
                            {currentStory.mediaType === 'video'
                                ? <video
                                    src={currentStory.mediaUrl}
                                    className="max-w-full max-h-full object-contain"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                                : <img
                                    src={currentStory.mediaUrl}
                                    className="max-w-full max-h-full object-contain"
                                    alt="story"
                                />}
                        </div>

                        {/* Like & Comment Bar */}
                        <div className={`border-t p-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            {/* Like and comment count */}
                            <div className="flex items-center gap-4 mb-3">
                                <button
                                    onClick={() => handleLike(currentStory.id)}
                                    className="flex items-center gap-1.5 hover:opacity-80 transition"
                                >
                                    <Heart className={`w-5 h-5 ${currentStory.likes.some(l => l.userId === currentUserId) ? 'fill-red-500 text-red-500' : isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                                    <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {currentStory.likes.length}
                                    </span>
                                </button>
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                                    <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {currentStory.comments.length}
                                    </span>
                                </div>
                            </div>

                            {/* Comments list */}
                            {currentStory.comments.length > 0 && (
                                <div className="mb-3 max-h-24 overflow-y-auto space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    {currentStory.comments.map(c => (
                                        <div key={c.id} className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <span className="font-semibold text-violet-500">{c.user.name}</span>
                                            <span className={`ml-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.content}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                             {/* Comment input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleComment(currentStory.id)}
                                    placeholder="Reply to story via DM..."
                                    className={`flex-1 text-sm rounded-full px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-violet-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                                />
                                <button
                                    onClick={() => handleComment(currentStory.id)}
                                    className="text-violet-500 hover:opacity-80 transition"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}