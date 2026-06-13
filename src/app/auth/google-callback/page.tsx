'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const user = searchParams.get('user')

    if (token && user) {
      // Persist user & token on the client side
      localStorage.setItem('token', token)
      localStorage.setItem('user', user)
      
      // Cookie is already set by the server callback redirect
      router.replace('/dashboard')
    } else {
      router.replace('/auth/login?error=Google+authentication+failed')
    }
  }, [router, searchParams])

  return (
    <div className="flex flex-col items-center justify-center relative z-20">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 animate-pulse font-medium text-sm">Completing Google authentication...</p>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#030712] text-slate-100 flex flex-col justify-center items-center p-6">
      
      {/* Noise Texture Overlay */}
      <div className="noise-overlay z-10" />

      {/* Atmospheric Background & Pulsing Aurora Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '13s' }} />
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center relative z-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Syncing authentication credentials...</p>
        </div>
      }>
        <GoogleCallbackContent />
      </Suspense>
    </div>
  )
}
