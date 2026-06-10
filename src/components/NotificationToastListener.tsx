"use client"

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Notification = {
  id: string
  userId: string
  senderId: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationToastListener() {
  const [toasts, setToasts] = useState<Notification[]>([])
  const [followingIds, setFollowingIds] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const controller = new AbortController()
    const { signal } = controller

    // Set up local state for current user id when available
    const initUser = () => {
      const userRaw = localStorage.getItem('user')
      if (userRaw) {
        try {
          const parsed = JSON.parse(userRaw)
          if (parsed && parsed.id) {
            setCurrentUserId(parsed.id)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }

    initUser()

    const fetchFollowing = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const token = localStorage.getItem('token')
      const userRaw = localStorage.getItem('user')
      if (!token || !userRaw) return

      try {
        const parsed = JSON.parse(userRaw)
        const res = await fetch(`/api/users/${parsed.id}/following`, { signal })
        if (res.ok) {
          const data = await res.json()
          const list = data.following || []
          setFollowingIds(list.map((u: any) => u.id))
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Failed to fetch following list:', err.message || err)
        }
      }
    }

    // Check notifications periodically
    const checkNotifications = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const token = localStorage.getItem('token')
      const userRaw = localStorage.getItem('user')
      if (!token || !userRaw) return

      // Sync following list on check as well to be up-to-date
      fetchFollowing()

      try {
        const res = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal
        })
        if (!res.ok) return

        const data = await res.json()
        const fetchedNotifications: Notification[] = data.notifications || []

        // Filter for follow notifications
        const followNotifications = fetchedNotifications.filter(
          (n) => n.type === 'FOLLOW' && !n.isRead
        )

        if (followNotifications.length === 0) return

        // Read seen notifications from localStorage to avoid popping up again
        const seenRaw = localStorage.getItem('mybuko-seen-follow-notifs')
        const seenIds: string[] = seenRaw ? JSON.parse(seenRaw) : []

        // Find notifications that haven't been shown in a toast yet
        const newNotifs = followNotifications.filter(
          (n) => !seenIds.includes(n.id) && !toasts.some((t) => t.id === n.id)
        )

        if (newNotifs.length > 0) {
          setToasts((prev) => {
            const combined = [...prev, ...newNotifs]
            const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
            return unique
          })

          const updatedSeenIds = [...seenIds, ...newNotifs.map((n) => n.id)]
          localStorage.setItem('mybuko-seen-follow-notifs', JSON.stringify(updatedSeenIds))
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Error polling follow notifications:', err.message || err)
        }
      }
    }

    // Run checks
    checkNotifications()
    const interval = setInterval(checkNotifications, 5000) // Poll every 5 seconds for quicker updates

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [toasts])

  const handleDismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const handleFollowBack = async (notification: Notification) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Follow the user back
      const followRes = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ followingId: notification.senderId })
      })

      if (followRes.ok) {
        setFollowingIds((prev) => [...prev, notification.senderId])
        
        // Remove toast from state
        setToasts((prev) => prev.filter((t) => t.id !== notification.id))

        // Mark as read in DB because follow back action completed
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id: notification.id })
          })
        } catch (dbErr: any) {
          console.warn('Failed to mark notification as read in DB:', dbErr.message || dbErr)
        }
      }
    } catch (err: any) {
      console.warn('Failed to follow back:', err.message || err)
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-55 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((notif) => {
        const isAlreadyFollowing = followingIds.includes(notif.senderId)
        
        // Parse follower's name from message (usually "Name has followed you...")
        const followerName = notif.message.split(' has followed ')[0] || 'Someone'
        const initials = followerName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()

        return (
          <div
            key={notif.id}
            className="pointer-events-auto flex items-center justify-between w-full rounded-xl bg-white p-3.5 shadow-xl ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/15 border border-slate-100 dark:border-slate-800 transition-all duration-300 animate-slide-in"
          >
            {/* Instagram Style Layout */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Profile Avatar Circle */}
              <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 border-2 border-white dark:border-slate-900">
                  {initials}
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  <span className="font-bold hover:underline cursor-pointer">{followerName}</span>{' '}
                  started following you.
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Follow back to stay connected
                </p>
              </div>
            </div>

            {/* Action buttons on the right, like Instagram */}
            <div className="flex items-center gap-2 shrink-0 ml-3">
              {!isAlreadyFollowing ? (
                <button
                  onClick={() => handleFollowBack(notif)}
                  className="rounded-lg bg-[#0095f6] hover:bg-[#1877f2] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors focus:outline-none shadow-sm"
                >
                  Follow Back
                </button>
              ) : (
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Following
                </span>
              )}
              
              <button
                onClick={() => handleDismiss(notif.id)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
