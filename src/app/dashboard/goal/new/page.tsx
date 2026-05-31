'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Sparkles } from 'lucide-react'
import { useTheme } from '../../../theme-provider'

const CATEGORIES = [
  { name: 'Travel', color: 'from-cyan-500 to-blue-500' },
  { name: 'Skills', color: 'from-violet-500 to-purple-500' },
  { name: 'Health', color: 'from-emerald-500 to-green-500' },
  { name: 'Adventure', color: 'from-orange-500 to-red-500' },
  { name: 'Personal', color: 'from-pink-500 to-rose-500' },
]

export default function AddGoalPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Travel',
    targetDate: '',
    budget: '',
    priority: 'Medium',
    difficulty: 'Medium',
    location: '',
    tags: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()),
          budget: formData.budget ? parseFloat(formData.budget) : null
        })
      })

      if (res.ok) {
        const goal = await res.json()
        router.push(`/goal/${goal.id}`)
      } else {
        alert('Failed to create goal')
      }
    } catch (error) {
      alert('Error creating goal')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-900'} p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className={`inline-flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-blue-600 hover:text-blue-700'} mb-4`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'} mb-2`}>Add New Goal</h1>
          <p className={`${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Turn your dreams into actionable plans</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${isDark ? 'bg-slate-800/60' : 'bg-white'} rounded-2xl shadow-xl p-8 space-y-6`}>
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Visit Japan, Learn Guitar, Run a Marathon"
              required
              className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'text-slate-200' : 'text-black'}`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us more about this goal..."
              rows={4}
              className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'text-slate-200' : 'text-black'}`}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                  className={`p-4 rounded-xl transition-all ${
                    formData.category === cat.name
                      ? `bg-gradient-to-br ${cat.color} text-white shadow-lg scale-105`
                            : `${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  <div className="text-sm font-medium">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Row: Target Date, Budget */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'text-slate-200' : 'text-black'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget (₹)</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="e.g., 200000"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>

          {/* Row: Priority, Difficulty */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'text-slate-200' : 'text-black'}`}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'text-slate-200' : 'text-black'}`}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          {/* Location & Tags */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Tokyo, Japan"
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'text-slate-200' : 'text-black'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., adventure, travel, expensive"
                className={`w-full px-4 py-3 ${isDark ? 'bg-slate-700/60' : 'bg-gray-50'} border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'text-slate-200' : 'text-black'}`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Goal'}
            </button>
            <button
              type="button"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}