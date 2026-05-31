"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTheme } from '../theme-provider'
import {
    Plus, Trash2, Check, Target, TrendingUp,
    Filter, CheckCircle2, Circle,
    User, Settings
} from 'lucide-react'

type BucketItem = {
    id: number
    title: string
    completed: boolean
    category: string
    createdAt: string
}

const CATEGORIES = [
    { name: 'Travel', gradient: 'from-cyan-500 to-blue-500', icon: 'plane' },
    { name: 'Skills', gradient: 'from-violet-500 to-purple-500', icon: 'book' },
    { name: 'Health', gradient: 'from-emerald-500 to-green-500', icon: 'activity' },
    { name: 'Adventure', gradient: 'from-orange-500 to-red-500', icon: 'mountain' },
    { name: 'Personal', gradient: 'from-pink-500 to-rose-500', icon: 'heart' },
]

const STORAGE_KEY = 'bucket-list-items'

function Dashboard() {
    const { theme } = useTheme()
    const [items, setItems] = useState<BucketItem[]>([])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                setItems(JSON.parse(saved))
            }
        }
    }, [])

    const [filterCategory, setFilterCategory] = useState('All')
    const darkMode = theme === 'dark'

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }, [items])

    const toggleComplete = (id: number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ))
    }

    const deleteItem = (id: number) => {
        setItems(items.filter(item => item.id !== id))
    }

    const filteredItems = filterCategory === 'All'
        ? items
        : items.filter(item => item.category === filterCategory)

    const completionRate = items.length > 0
        ? Math.round((items.filter(item => item.completed).length / items.length) * 100)
        : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">

            {/* Floating Particles Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="particle particle-1 bg-blue-400 dark:bg-blue-500"></div>
                <div className="particle particle-2 bg-purple-400 dark:bg-purple-500"></div>
                <div className="particle particle-3 bg-pink-400 dark:bg-pink-500"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 transition-colors text-gray-900 dark:text-white">
                            Bucket List
                        </h1>
                        <p className="text-lg transition-colors text-gray-600 dark:text-slate-400">
                            Your goals, tracked and achieved
                        </p>
                    </div>

                </div>

                <div className="grid gap-3 sm:grid-cols-3 mb-10">
                    <Link href="/dashboard/profile" className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white/90 px-5 py-4 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-100 dark:hover:border-blue-500 dark:hover:bg-slate-800">
                        <User className="w-5 h-5" />
                        Profile
                    </Link>

                    <Link href="/dashboard/settings" className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white/90 px-5 py-4 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-100 dark:hover:border-blue-500 dark:hover:bg-slate-800">
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>

                    <Link href="/dashboard/goal/new" className="flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-purple-500/30">
                        <Plus className="w-5 h-5" />
                        Add Goal
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className={`stat-card group ${darkMode ? 'stat-card-dark' : 'stat-card-light'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Total
                                </p>
                                <p className={`text-3xl font-bold transition-colors ${darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    {items.length}
                                </p>
                            </div>
                            <div className="stat-icon bg-gradient-to-br from-blue-500 to-cyan-500">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className={`stat-card group ${darkMode ? 'stat-card-dark' : 'stat-card-light'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Completed
                                </p>
                                <p className="text-3xl font-bold text-green-500">
                                    {items.filter(item => item.completed).length}
                                </p>
                            </div>
                            <div className="stat-icon bg-gradient-to-br from-green-500 to-emerald-500">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className={`stat-card group ${darkMode ? 'stat-card-dark' : 'stat-card-light'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Active
                                </p>
                                <p className="text-3xl font-bold text-orange-500">
                                    {items.filter(item => !item.completed).length}
                                </p>
                            </div>
                            <div className="stat-icon bg-gradient-to-br from-orange-500 to-red-500">
                                <Circle className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className={`stat-card group ${darkMode ? 'stat-card-dark' : 'stat-card-light'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium mb-1 transition-colors ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Progress
                                </p>
                                <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                    {completionRate}%
                                </p>
                            </div>
                            <div className="stat-icon bg-gradient-to-br from-purple-500 to-pink-500">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {items.length > 0 && (
                    <div className={`rounded-2xl p-6 mb-8 ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/80 backdrop-blur-xl border border-gray-200'
                        }`}>
                        <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Overall Progress
                            </span>
                            <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {completionRate}%
                            </span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${completionRate}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
                    <Filter className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <button
                        onClick={() => setFilterCategory('All')}
                        className={`px-4 py-2 rounded-xl transition-all font-medium flex-shrink-0 ${filterCategory === 'All'
                            ? darkMode
                                ? 'bg-white text-gray-900 shadow-lg'
                                : 'bg-gray-900 text-white shadow-lg'
                            : darkMode
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        All ({items.length})
                    </button>
                    {CATEGORIES.map((cat) => {
                        const count = items.filter(item => item.category === cat.name).length
                        return (
                            <button
                                key={cat.name}
                                onClick={() => setFilterCategory(cat.name)}
                                className={`px-4 py-2 rounded-xl transition-all font-medium flex-shrink-0 ${filterCategory === cat.name
                                    ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                                    : darkMode
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {cat.name} ({count})
                            </button>
                        )
                    })}
                </div>

                {/* Goals List */}
                <div className="space-y-3">
                    {filteredItems.map((item, index) => {
                        const category = CATEGORIES.find(cat => cat.name === item.category)

                        return (
                            <div
                                key={item.id}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`goal-card group ${darkMode ? 'goal-card-dark' : 'goal-card-light'} ${item.completed ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleComplete(item.id)}
                                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed
                                            ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/50'
                                            : darkMode
                                                ? 'border-gray-600 hover:border-purple-500'
                                                : 'border-gray-300 hover:border-purple-500'
                                            }`}
                                    >
                                        {item.completed && <Check className="w-4 h-4 text-white" />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium mb-2 transition-colors ${item.completed
                                            ? darkMode ? 'line-through text-gray-500' : 'line-through text-gray-400'
                                            : darkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {item.title}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-3 py-1 rounded-full font-medium bg-gradient-to-r ${category?.gradient} text-white`}>
                                                {item.category}
                                            </span>
                                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className={`flex-shrink-0 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${darkMode
                                            ? 'hover:bg-red-500/20 text-red-400'
                                            : 'hover:bg-red-50 text-red-500'
                                            }`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}

                    {filteredItems.length === 0 && items.length > 0 && (
                        <div className={`text-center py-20 rounded-2xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/50'
                            }`}>
                            <div className={`text-6xl mb-4 ${darkMode ? 'opacity-30' : 'opacity-20'}`}>
                                <Filter className="w-16 h-16 mx-auto" />
                            </div>
                            <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                No {filterCategory} goals
                            </p>
                            <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                                Try selecting a different category
                            </p>
                        </div>
                    )}

                    {items.length === 0 && (
                        <div className={`text-center py-20 rounded-2xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/50'
                            }`}>
                            <div className={`text-6xl mb-4 ${darkMode ? 'opacity-30' : 'opacity-20'}`}>
                                <Target className="w-16 h-16 mx-auto" />
                            </div>
                            <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                No goals yet
                            </p>
                            <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                                Click "Add New Goal" to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard