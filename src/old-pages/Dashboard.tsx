import { useState, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
    Plus, Trash2, Check, Target, TrendingUp,
    Moon, Sun, Filter, CheckCircle2, Circle, X
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

type DashboardProps = {
    dark: boolean
    setDark: Dispatch<SetStateAction<boolean>>
}

function Dashboard({ dark, setDark }: DashboardProps) {
    const [items, setItems] = useState<BucketItem[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : []
    })

    const [newItemTitle, setNewItemTitle] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('Travel')
    const [filterCategory, setFilterCategory] = useState('All')
    const [showAddForm, setShowAddForm] = useState(false)
    const darkMode = dark

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }, [items])

    const addItem = () => {
        if (newItemTitle.trim() === '') return

        const newItem: BucketItem = {
            id: Date.now(),
            title: newItemTitle,
            completed: false,
            category: selectedCategory,
            createdAt: new Date().toISOString()
        }

        setItems([newItem, ...items])
        setNewItemTitle('')
        setShowAddForm(false)
    }

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

                    <button
                        onClick={() => setDark(!dark)}
                        className="p-3 rounded-xl bg-white text-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 dark:bg-slate-800 dark:text-yellow-400 dark:hover:bg-slate-700"
                    >
                        {dark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
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

                {/* Add Goal Section */}
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full mb-8 group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-[2px] transition-all hover:shadow-2xl hover:shadow-purple-500/50"
                    >
                        <div className="relative rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 transition-all">
                            <div className="flex items-center justify-center gap-2 text-white font-semibold">
                                <Plus className="w-5 h-5" />
                                <span>Add New Goal</span>
                            </div>
                        </div>
                    </button>
                ) : (
                    <div className={`rounded-2xl p-6 mb-8 animate-slideDown ${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/80 backdrop-blur-xl border border-gray-200'
                        }`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Create New Goal
                            </h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Category
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.name}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`p-4 rounded-xl transition-all ${selectedCategory === cat.name
                                            ? `bg-gradient-to-br ${cat.gradient} text-white shadow-lg scale-105`
                                            : darkMode
                                                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <div className="text-sm font-medium">{cat.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addItem()}
                                placeholder="Enter your goal..."
                                className={`flex-1 px-4 py-3 rounded-xl transition-all focus:ring-2 focus:ring-purple-500 ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    } border-2 focus:outline-none`}
                                autoFocus
                            />
                            <button
                                onClick={addItem}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Add
                            </button>
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