'use client'

import { useState } from 'react'
import { X, Sparkles, Loader, Plus } from 'lucide-react'
import { useTheme } from '../app/theme-provider'

interface RecommendationsModalProps {
  isOpen: boolean
  onClose: () => void
  category: string
  userGoals: any[]
  onSelect: (goal: any) => void
}

export function AIRecommendationsModal({
  isOpen,
  onClose,
  category,
  userGoals,
  onSelect
}: RecommendationsModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])

  const getRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/recommend-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, userGoals })
      })

      const data = await res.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500 animate-spin" />
            <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              AI-Powered Recommendations
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {recommendations.length === 0 && !loading && (
            <button
              onClick={getRecommendations}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Get AI Recommendations for {category}
            </button>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader className="w-8 h-8 animate-spin text-purple-500" />
              <p className={`text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Thinking of amazing goals...
              </p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-2xl border-2 ${isDark ? 'bg-slate-800/50 border-purple-500/30' : 'bg-purple-50 border-purple-200'} space-y-4`}
                >
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                      {rec.title}
                    </h3>
                    <p className={`${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {rec.why}
                    </p>
                  </div>

                  <div>
                    <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      Key Milestones:
                    </p>
                    <ul className="space-y-1">
                      {rec.milestones?.map((m: string, j: number) => (
                        <li key={j} className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          ✓ {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      ⏱️ {rec.timeframe}
                    </p>
                    <button
                      onClick={() => onSelect(rec)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Goal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}