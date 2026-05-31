'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Plus, Check, Calendar, DollarSign, TrendingUp } from 'lucide-react'

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [goal, setGoal] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newMilestone, setNewMilestone] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`/api/goals/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (res.ok) {
          const data = await res.json()
          setGoal(data)
        }
      } catch (error) {
        console.error('Error fetching goal:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) fetchGoal()
  }, [params.id])

  const addMilestone = async () => {
    if (!newMilestone.trim()) return
    
    try {
      const token = localStorage.getItem('token')
      // We'll create this API endpoint later
      setNewMilestone('')
    } catch (error) {
      console.error('Error adding milestone:', error)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    
    try {
      const token = localStorage.getItem('token')
      // We'll create this API endpoint later
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!goal) return <div className="flex items-center justify-center min-h-screen">Goal not found</div>

  const savedPercentage = goal.estimatedCost ? (goal.amountSaved / goal.estimatedCost) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Goal Title & Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{goal.title}</h1>
              <p className="text-gray-600">{goal.description}</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
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
              <p className="font-semibold text-gray-900">{goal.status}</p>
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

        {/* Budget */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Budget Tracking
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Estimated Cost</p>
              <p className="text-3xl font-bold text-gray-900">₹{goal.estimatedCost?.toLocaleString() || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Saved</p>
              <p className="text-3xl font-bold text-green-600">₹{goal.amountSaved?.toLocaleString() || '0'}</p>
            </div>
          </div>
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
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Milestones</h2>
          <div className="space-y-3 mb-6">
            {goal.milestones?.map((milestone: any) => (
              <div key={milestone.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <button className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  milestone.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 hover:border-blue-500'
                }`}>
                  {milestone.completed && <Check className="w-4 h-4 text-white" />}
                </button>
                <span className={milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                  {milestone.title}
                </span>
              </div>
            ))}
          </div>
          
          {/* Add Milestone */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
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
              <div key={note.id} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-gray-800">{note.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          
          {/* Add Note */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
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