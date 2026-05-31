'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Trash2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../theme-provider'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('account')
  const { theme } = useTheme()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      // Call delete API
      handleLogout()
    }
  }

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-900'} p-8`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/profile" className={`inline-flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-blue-600 hover:text-blue-700'} mb-4`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Settings</h1>
        </div>

        <div className={`flex gap-4 mb-6 ${isDark ? 'border-b border-slate-700' : 'border-b border-gray-200'}`}>
          {[
            { id: 'account', label: 'Account' },
            { id: 'theme', label: 'Theme' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'privacy', label: 'Privacy' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : `border-transparent ${isDark ? 'text-slate-300 hover:text-slate-100' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

            <div className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
                  <Lock className="w-5 h-5" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'} mb-4`}>Session Management</h3>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-red-400' : 'text-red-600'} mb-4 flex items-center gap-2`}>
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </h3>
                <button
                  onClick={handleDeleteAccount}
                  className="px-6 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                >
                  Delete Account
                </button>
                <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Dark Mode</h3>
                  <p className={`${isDark ? 'text-slate-300' : 'text-sm text-gray-600'}`}>Theme is controlled from the landing page.</p>
                </div>
                <div className={`${isDark ? 'rounded-full bg-slate-700/60 px-4 py-2 text-sm font-semibold text-slate-100' : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900'}`}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {[
                { label: 'Goal Reminders', desc: 'Get reminded about your goals' },
                { label: 'Weekly Summary', desc: 'Receive weekly progress updates' },
                { label: 'Milestone Alerts', desc: 'Be notified when you complete milestones' },
              ].map((notif, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{notif.label}</p>
                    <p className="text-sm text-gray-600">{notif.desc}</p>
                  </div>
                  <button className="relative w-14 h-8 bg-blue-600 rounded-full">
                    <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full"></div>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Public Profile</p>
                  <p className="text-sm text-gray-600">Let others see your profile</p>
                </div>
                <button className="relative w-14 h-8 bg-gray-300 rounded-full">
                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full"></div>
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Share Goals</p>
                  <p className="text-sm text-gray-600">Allow sharing your progress</p>
                </div>
                <button className="relative w-14 h-8 bg-gray-300 rounded-full">
                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full"></div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
