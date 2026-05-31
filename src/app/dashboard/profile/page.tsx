"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, Calendar, Target, Award, TrendingUp, Settings } from 'lucide-react'
import { useTheme } from '../../theme-provider'

export default function ProfilePage() {
  const { theme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    completionRate: 0
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      let currentUser = null

      if (userData) {
        currentUser = JSON.parse(userData)
      } else {
        currentUser = {
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          createdAt: new Date().toISOString(),
          bio: 'Welcome to your profile! Add a bio and start planning your goals.'
        }
        localStorage.setItem('user', JSON.stringify(currentUser))
      }

      setUser(currentUser)
      setStats({
        totalGoals: 12,
        completedGoals: 5,
        inProgressGoals: 7,
        completionRate: 42
      })
    }
  }, [])

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-900'} p-8`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Profile</h1>
          <Link href="/settings" className={`${isDark ? 'p-3 bg-slate-800/60' : 'p-3 bg-white'} rounded-xl shadow hover:shadow-lg transition-all`}>
            <Settings className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
          </Link>
        </div>

        {/* Profile Card */}
        <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-8 mb-6`}>
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'} mb-2`}>{user.name}</h2>
              <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'} mb-4`}>{user.email}</p>
              <p className={`${isDark ? 'text-slate-400' : 'text-sm text-gray-500'}`}>
                Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className={`${isDark ? 'pt-6 border-t border-slate-700' : 'pt-6 border-t border-gray-200'}`}>
            <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              {user.bio || 'No bio yet. Start planning your dreams!'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Total Goals</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{stats.totalGoals}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedGoals}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>In Progress</p>
                <p className="text-3xl font-bold text-orange-600">{stats.inProgressGoals}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mb-1`}>Completion Rate</p>
                <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
            <Award className="w-6 h-6" />
            Achievements
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`${isDark ? 'p-6 bg-slate-800/50 rounded-xl border-2 border-slate-700' : 'p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200'}`}>
              <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>🎯 Goal Setter</p>
              <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mt-2`}>Created your first goal</p>
            </div>
            <div className={`${isDark ? 'p-6 bg-slate-800/50 rounded-xl border-2 border-slate-700' : 'p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200'}`}>
              <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>✅ First Victory</p>
              <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mt-2`}>Completed your first goal</p>
            </div>
            <div className={`${isDark ? 'p-6 bg-slate-800/40 rounded-xl border-2 border-slate-700 opacity-60' : 'p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 opacity-50'}`}>
              <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>🏆 Power User</p>
              <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'} mt-2`}>Complete 10 goals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}