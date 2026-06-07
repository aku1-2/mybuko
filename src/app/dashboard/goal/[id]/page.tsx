'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Plus, Check, Calendar, DollarSign, TrendingUp, Sparkles, Loader, ChevronDown } from 'lucide-react'

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [goal, setGoal] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newMilestone, setNewMilestone] = useState('')
  const [newNote, setNewNote] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  
  // ===== NEW AI STATE =====
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTips, setAiTips] = useState('')
  const [showAiTips, setShowAiTips] = useState(false)
  const [improvedGoal, setImprovedGoal] = useState<any>(null)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    fetchGoal()
  }, [params.id])

  const fetchGoal = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setGoal(data)
        setEditData(data)
      } else if (res.status === 404) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching goal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addMilestone = async () => {
    if (!newMilestone.trim()) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${params.id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newMilestone })
      })

      if (res.ok) {
        setNewMilestone('')
        fetchGoal()
      }
    } catch (error) {
      console.error('Error adding milestone:', error)
    }
  }

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/goals/${params.id}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !completed })
      })
      fetchGoal()
    } catch (error) {
      console.error('Error updating milestone:', error)
    }
  }

  const deleteMilestone = async (milestoneId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/goals/${params.id}/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchGoal()
    } catch (error) {
      console.error('Error deleting milestone:', error)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${params.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newNote })
      })

      if (res.ok) {
        setNewNote('')
        fetchGoal()
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/goals/${params.id}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchGoal()
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const updateGoal = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      if (res.ok) {
        setIsEditing(false)
        fetchGoal()
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const deleteGoal = async () => {
    if (!window.confirm('Delete this goal? This cannot be undone!')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/goals/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  // ===== NEW AI FUNCTIONS =====
  const getAiTips = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const daysActive = goal.createdAt 
        ? Math.floor((new Date().getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const res = await fetch('/api/ai/progress-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: goal.title,
          currentProgress: goal.progress,
          lastUpdate: new Date().toLocaleDateString(),
          daysActive: daysActive
        })
      })

      const data = await res.json()
      if (data.success) {
        setAiTips(data.tips)
        setShowAiTips(true)
      } else {
        setAiError('Failed to get AI tips')
      }
    } catch (error) {
      console.error('AI Error:', error)
      setAiError('Error connecting to AI. Make sure GROQ API key is set in .env.local')
    } finally {
      setAiLoading(false)
    }
  }

  const improveGoal = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ai/improve-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: goal.title,
          goalDescription: goal.description
        })
      })

      const data = await res.json()
      if (data.success) {
        setImprovedGoal(data.improved)
      } else {
        setAiError('Failed to improve goal')
      }
    } catch (error) {
      console.error('AI Error:', error)
      setAiError('Error connecting to AI. Make sure GROQ API key is set in .env.local')
    } finally {
      setAiLoading(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!goal) return <div className="flex items-center justify-center min-h-screen">Goal not found</div>

  const savedPercentage = goal.estimatedCost ? (goal.amountSaved / goal.estimatedCost) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Goal Title Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="text-4xl font-bold text-gray-900 border-2 border-blue-500 rounded-lg p-2 w-full"
                />
              ) : (
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{goal.title}</h1>
              )}
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="text-gray-600 border-2 border-blue-500 rounded-lg p-2 w-full"
                  rows={2}
                />
              ) : (
                <p className="text-gray-600">{goal.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={deleteGoal}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={updateGoal}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditData(goal)
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Goal Info Grid */}
          <div className="grid md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-semibold text-gray-900">{goal.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Target Date</p>
              <p className="font-semibold text-gray-900">
                {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <select
                value={goal.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                disabled={!isEditing}
                className="font-semibold text-gray-900 p-1 border rounded"
              >
                <option>In Progress</option>
                <option>Completed</option>
                <option>On Hold</option>
              </select>
            </div>
            <div>
              <p className="text-sm text-gray-600">Priority</p>
              <p className="font-semibold text-gray-900">{goal.priority}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
            {isEditing && (
              <input
                type="number"
                min="0"
                max="100"
                value={editData.progress}
                onChange={(e) => setEditData({ ...editData, progress: parseInt(e.target.value) })}
                className="border-2 border-blue-500 rounded-lg p-2 w-20"
              />
            )}
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {goal.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-teal-600 h-full transition-all duration-500"
              style={{ width: `${goal.progress}%` }}
            ></div>
          </div>
        </div>

        {/* ===== NEW: AI ASSISTANT SECTION ===== */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-purple-600 animate-spin" />
            <h2 className="text-2xl font-bold text-purple-900">AI Assistant ✨</h2>
          </div>

          {aiError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800">
              ⚠️ {aiError}
            </div>
          )}

          <p className="text-gray-700 mb-6">
            Get AI-powered tips to achieve your goal faster, or improve your goal to make it more SMART!
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={getAiTips}
              disabled={aiLoading}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                aiLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {aiLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Getting Tips...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  💡 Get Progress Tips
                </>
              )}
            </button>

            <button
              onClick={improveGoal}
              disabled={aiLoading}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                aiLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {aiLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  ✨ Improve Goal
                </>
              )}
            </button>
          </div>

          {/* AI Tips Display */}
          {showAiTips && aiTips && (
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6 mb-4">
              <button
                onClick={() => setShowAiTips(!showAiTips)}
                className="flex items-center justify-between w-full mb-4 cursor-pointer"
              >
                <h3 className="text-lg font-bold text-purple-900">💡 AI Suggestions</h3>
                <ChevronDown className={`w-5 h-5 transition-transform ${showAiTips ? 'rotate-180' : ''}`} />
              </button>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiTips}
              </p>
            </div>
          )}

          {/* Improved Goal Display */}
          {improvedGoal && (
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-900 mb-4">✨ Improved Goal</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">📌 Better Title:</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{improvedGoal.improvedTitle}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600">📝 Improved Description:</p>
                  <p className="text-gray-800 mt-1">{improvedGoal.improvedDescription}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">⏱️ Timeline:</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{improvedGoal.timelineWeeks} weeks</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">ℹ️ Why Better:</p>
                    <p className="text-gray-800 mt-1">{improvedGoal.whyBetter}</p>
                  </div>
                </div>

                {improvedGoal.benefits && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">🎯 Key Benefits:</p>
                    <ul className="space-y-2">
                      {improvedGoal.benefits.map((benefit: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-gray-800">
                          <span className="text-green-600 font-bold">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => {
                    setEditData({
                      ...editData,
                      title: improvedGoal.improvedTitle,
                      description: improvedGoal.improvedDescription
                    })
                    setIsEditing(true)
                    setImprovedGoal(null)
                  }}
                  className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
                >
                  👍 Use This Improved Goal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Budget */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Budget Tracking
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Estimated Cost</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.estimatedCost || ''}
                  onChange={(e) => setEditData({ ...editData, estimatedCost: parseFloat(e.target.value) })}
                  className="border-2 border-blue-500 rounded-lg p-2 w-full"
                />
              ) : (
                <p className="text-3xl font-bold text-gray-900">₹{goal.estimatedCost?.toLocaleString() || 'Not set'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Saved</p>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.amountSaved || ''}
                  onChange={(e) => setEditData({ ...editData, amountSaved: parseFloat(e.target.value) })}
                  className="border-2 border-blue-500 rounded-lg p-2 w-full"
                />
              ) : (
                <p className="text-3xl font-bold text-green-600">₹{goal.amountSaved?.toLocaleString() || '0'}</p>
              )}
            </div>
          </div>
          {goal.estimatedCost && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Savings Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-600 to-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${Math.min(savedPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{Math.round(savedPercentage)}% of target saved</p>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Milestones</h2>
          <div className="space-y-3 mb-6">
            {goal.milestones?.map((milestone: any) => (
              <div key={milestone.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <button
                  onClick={() => toggleMilestone(milestone.id, milestone.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    milestone.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {milestone.completed && <Check className="w-4 h-4 text-white" />}
                </button>
                <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                  {milestone.title}
                </span>
                <button
                  onClick={() => deleteMilestone(milestone.id)}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Milestone */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMilestone()}
              placeholder="Add new milestone..."
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addMilestone}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Notes</h2>
          <div className="space-y-3 mb-6">
            {goal.notes?.map((note: any) => (
              <div key={note.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-start">
                <div>
                  <p className="text-gray-800">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Note */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNote()}
              placeholder="Add a note..."
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addNote}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
