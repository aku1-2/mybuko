import type { Dispatch, SetStateAction } from 'react'
import Link from 'next/link'
import {
    Target, Check, MapPin, DollarSign, Calendar,
    TrendingUp, Users, Globe, Sparkles, Play,
    Mountain, Palette, Plane, ChevronRight,
    Moon, Sun
} from 'lucide-react'

type LandingPageProps = {
    dark: boolean
    setDark: Dispatch<SetStateAction<boolean>>
}

export default function LandingPage({ dark, setDark }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-white text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-colors duration-300 dark:bg-slate-950/80 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">MYBUKO</span>
                        </div>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center gap-4">
                            <a href="#explore" className="text-gray-600 hover:text-gray-900 transition-colors dark:text-slate-300 dark:hover:text-white">
                                Explore
                            </a>
                            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors dark:text-slate-300 dark:hover:text-white">
                                How it Works
                            </a>
                            <a href="#inspiration" className="text-gray-600 hover:text-gray-900 transition-colors dark:text-slate-300 dark:hover:text-white">
                                Inspiration
                            </a>
                            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors dark:text-slate-300 dark:hover:text-white">
                                Login
                            </Link>
                            <button
                                type="button"
                                onClick={() => setDark(!dark)}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                {dark ? 'Light Mode' : 'Dark Mode'}
                            </button>
                            <Link
                                href="/dashboard"
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
                            >
                                Start Planning
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button className="md:hidden p-2 text-gray-900 dark:text-white">
                            <div className="w-6 h-0.5 bg-current mb-1"></div>
                            <div className="w-6 h-0.5 bg-current mb-1"></div>
                            <div className="w-6 h-0.5 bg-current"></div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20 md:py-32 transition-colors duration-300 dark:from-slate-900 dark:via-slate-950 dark:to-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">

                        {/* Left Side - Text */}
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium dark:bg-slate-800 dark:text-blue-200">
                                <Sparkles className="w-4 h-4" />
                                Turn dreams into plans
                            </div>

                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight dark:text-white">
                                Turn your bucket list into{' '}
                                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                                    real plans
                                </span>
                            </h1>

                            <p className="text-xl text-gray-600 leading-relaxed dark:text-slate-300">
                                Discover places, find budget-friendly options, and plan every experience step-by-step—based on what you want to do.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/dashboard"
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    Start Your Bucket List
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                                <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-semibold hover:border-gray-300 transition-all flex items-center justify-center gap-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500">
                                    <Play className="w-5 h-5" />
                                    See How It Works
                                </button>
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex items-center gap-6 pt-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 border-2 border-white"></div>
                                    ))}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-slate-300">
                                    <span className="font-bold text-gray-900 dark:text-white">2,500+</span> dreamers already planning
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Mock UI */}
                        <div className="relative">
                            <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 space-y-4 transition-colors duration-300 dark:bg-slate-900 dark:border dark:border-slate-700">
                                {/* Added Item */}
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border-2 border-blue-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
                                    <Check className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-gray-900 dark:text-white">Skydiving</span>
                                    <span className="ml-auto text-sm text-blue-600 dark:text-blue-200">Added</span>
                                </div>

                                {/* Suggestions */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Smart Suggestions</p>
                                    {[
                                        { name: 'Skydive Dubai', price: '₹35,000', distance: '2,800 km' },
                                        { name: 'Mysore Skydiving', price: '₹25,000', distance: '450 km' },
                                        { name: 'Aamby Valley', price: '₹28,000', distance: '850 km' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">{item.distance}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-blue-600">{item.price}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Plan Created */}
                                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 dark:bg-green-900/30 dark:border-green-700">
                                    <Calendar className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-200">Plan Created!</p>
                                        <p className="text-sm text-green-700 dark:text-green-200">Ready for December 2026</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-teal-400 rounded-full opacity-20 blur-2xl"></div>
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-teal-400 to-blue-400 rounded-full opacity-20 blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4 dark:text-white">How It Works</h2>
                        <p className="text-xl text-gray-600 dark:text-slate-300">Three simple steps to start living your dreams</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '1',
                                icon: Target,
                                title: 'Add Your Dream',
                                desc: 'Write anything you\'ve always wanted to do.',
                                color: 'from-blue-500 to-blue-600'
                            },
                            {
                                step: '2',
                                icon: Sparkles,
                                title: 'Get Smart Suggestions',
                                desc: 'We find places, experiences, and budget options near you.',
                                color: 'from-teal-500 to-teal-600'
                            },
                            {
                                step: '3',
                                icon: Calendar,
                                title: 'Plan & Do It',
                                desc: 'Create a plan, set dates, and track progress.',
                                color: 'from-green-500 to-green-600'
                            }
                        ].map((item, i) => (
                            <div key={i} className="relative group h-full">
                                {/* Glow backdrop */}
                                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-emerald-500 via-yellow-500 to-pink-500 opacity-0 group-hover:opacity-75 dark:group-hover:opacity-100 transition-all duration-500 blur-xl group-hover:blur-2xl animate-gradient-xy" />
                                
                                {/* Border glow wrapper */}
                                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-emerald-500 via-yellow-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy" />
                                
                                {/* Inner card content */}
                                <div className="relative h-full flex flex-col bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 group-hover:border-transparent transition-all duration-300 dark:from-slate-900 dark:to-slate-950 dark:border-slate-700/50 dark:bg-slate-900">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <div className={`text-6xl font-bold bg-gradient-to-br ${item.color} bg-clip-text text-transparent opacity-10 absolute top-4 right-4`}>
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 dark:text-white">{item.title}</h3>
                                    <p className="text-gray-600 dark:text-slate-300 flex-grow">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES - ZIG ZAG */}
            <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

                    {/* Feature 1 - Smart Discovery */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium dark:bg-slate-800 dark:text-blue-200">
                                <MapPin className="w-4 h-4" />
                                Smart Discovery
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Find experiences tailored to you
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed dark:text-slate-300">
                                Discover places and experiences based on your bucket list—whether it's near you or anywhere in the world. Our smart algorithm finds the perfect match.
                            </p>
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Location-based</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Personalized</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl p-8 h-80 flex items-center justify-center dark:from-slate-800 dark:to-slate-900">
                            <Globe className="w-32 h-32 text-blue-600 opacity-50" />
                        </div>
                    </div>

                    {/* Feature 2 - Budget Planning */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl p-8 h-80 flex items-center justify-center order-2 md:order-1 dark:from-slate-800 dark:to-slate-900">
                            <DollarSign className="w-32 h-32 text-green-600 opacity-50" />
                        </div>
                        <div className="space-y-6 order-1 md:order-2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium dark:bg-slate-800 dark:text-green-200">
                                <DollarSign className="w-4 h-4" />
                                Budget-Friendly
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Achieve goals without breaking the bank
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed dark:text-slate-300">
                                Get affordable alternatives and budget filters to make your dreams achievable. Compare prices and find the best deals.
                            </p>
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Price comparison</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Budget filters</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3 - Built-in Planner */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium dark:bg-slate-800 dark:text-purple-200">
                                <Calendar className="w-4 h-4" />
                                Built-in Planner
                            </div>
                            <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
                                Turn ideas into action
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed dark:text-slate-300">
                                Create step-by-step plans with timelines. Set dates, add notes, and track your progress as you check off each dream.
                            </p>
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Timeline view</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span>Progress tracking</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 h-80 flex items-center justify-center dark:from-slate-800 dark:to-slate-900">
                            <TrendingUp className="w-32 h-32 text-purple-600 opacity-50" />
                        </div>
                    </div>
                </div>
            </section>

            {/* INSPIRATION */}
            <section id="inspiration" className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4 dark:text-white">Need ideas? Start here</h2>
                        <p className="text-xl text-gray-600 dark:text-slate-300">Popular bucket list experiences</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: Mountain, title: 'Visit Tea Gardens', location: 'Darjeeling, Assam', color: 'from-green-500 to-emerald-500' },
                            { icon: Palette, title: 'Learn Pottery', location: 'Workshops near you', color: 'from-orange-500 to-red-500' },
                            { icon: Plane, title: 'Skydiving', location: 'Budget options available', color: 'from-blue-500 to-cyan-500' },
                        ].map((item, i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-8 hover:shadow-xl transition-all dark:from-slate-900 dark:to-slate-950 dark:bg-slate-900">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-white">{item.title}</h3>
                                    <p className="text-gray-600 mb-4 dark:text-slate-300">{item.location}</p>
                                    <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                                        Explore <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <button className="px-8 py-3 border-2 border-gray-200 text-gray-900 rounded-xl font-semibold hover:border-gray-300 hover:shadow-lg transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600">
                            Explore More Ideas
                        </button>
                    </div>
                </div>
            </section>

            {/* COMMUNITY/SOCIAL */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4 dark:text-white">See what others are doing</h2>
                        <p className="text-xl text-gray-600 dark:text-slate-300">Join thousands of dreamers worldwide</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-lg dark:bg-slate-900 dark:border dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-6 h-6 text-blue-600" />
                                <h3 className="font-bold text-gray-900 dark:text-white">Trending This Week</h3>
                            </div>
                            <ul className="space-y-3">
                                {['Scuba Diving', 'Northern Lights', 'Hot Air Balloon'].map((item, i) => (
                                    <li key={i} className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                                        <span>{item}</span>
                                        <span className="text-sm text-blue-600 font-medium">+{120 - i * 20}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg dark:bg-slate-900 dark:border dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                                <h3 className="font-bold text-gray-900 dark:text-white">Most Planned</h3>
                            </div>
                            <ul className="space-y-3">
                                {['Learn Guitar', 'Marathon Running', 'Photography Course'].map((item, i) => (
                                    <li key={i} className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                                        <span>{item}</span>
                                        <span className="text-sm text-green-600 font-medium">{850 - i * 100} plans</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg dark:bg-slate-900 dark:border dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-4">
                                <DollarSign className="w-6 h-6 text-orange-600" />
                                <h3 className="font-bold text-gray-900 dark:text-white">Budget-Friendly</h3>
                            </div>
                            <ul className="space-y-3">
                                {['Local Hiking Trails', 'Cooking Classes', 'City Tours'].map((item, i) => (
                                    <li key={i} className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                                        <span>{item}</span>
                                        <span className="text-sm text-orange-600 font-medium">₹{500 + i * 200}+</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-20 bg-gradient-to-br from-blue-600 to-teal-600">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Your bucket list isn't meant to stay a list
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Start planning your first experience today—for free
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        Get Started for Free
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">MYBUKO</span>
                            </div>
                            <p className="text-sm">Turn your dreams into plans.</p>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Inspiration</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm dark:border-slate-700">
                        <p className="dark:text-slate-400">© 2026 MYBUKO. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}