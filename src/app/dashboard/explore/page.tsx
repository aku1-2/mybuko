'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Eye, TrendingUp } from 'lucide-react'

export default function ExplorePage() {
  const [goals, setGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('trending')

  const CATEGORIES = ['All', 'Travel', 'Skills', 'Health', 'Adventure', 'Personal']
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    fetchGoals()
  }, [filter, selectedCategory])

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = `/api/goals/explore?filter=${filter}`
      
      if (selectedCategory !== 'All') {
        url += `&category=${selectedCategory}`
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Error fetching explore goals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Explore</h1>
          <p className="text-blue-100">Discover goals from our community and get inspired</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="space-y-4">
            {/* Filter Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Sort By</label>
              <div className="flex gap-2 flex-wrap">
                {['trending', 'recent', 'popular', 'nearby'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg transition-all capitalize ${
                      filter === f
                        ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <p className="text-gray-600">No goals found in this category</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <Link
                key={goal.id}
                href={`/dashboard/goal/${goal.id}`}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition-all overflow-hidden group"
              >
                {/* Cover Image */}
                <div className="h-32 bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                  <div className="text-white text-center">
                    <p className="text-3xl mb-1">
                      {goal.category === 'Travel' && '✈️'}
                      {goal.category === 'Skills' && '🎯'}
                      {goal.category === 'Health' && '💪'}
                      {goal.category === 'Adventure' && '🏔️'}
                      {goal.category === 'Personal' && '⭐'}
                    </p>
                    <p className="text-sm font-semibold">{goal.category}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {goal.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {goal.description}
                  </p>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-600">Progress</span>
                      <span className="text-xs font-bold text-blue-600">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-teal-600 h-full rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-600">By <span className="font-semibold text-gray-900">{goal.user?.name}</span></p>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mt-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{goal.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{goal.comments || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{goal.views || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}