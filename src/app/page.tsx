"use client"

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useTheme } from './theme-provider'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Target, Check, MapPin, DollarSign, Calendar,
    TrendingUp, Users, Globe, Sparkles, Play,
    Mountain, Palette, Plane, ChevronRight, Lock,
    Moon, Sun, ChevronDown, User, Settings, LogOut, MessageSquare, Star, ArrowRight, Info
} from 'lucide-react'

// --- Custom Animated Counter ---
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [hasFired, setHasFired] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasFired) {
                setHasFired(true);
                let start = 0;
                const end = value;
                if (start === end) return;
                const duration = 1800; // milliseconds
                const incrementTime = Math.abs(Math.floor(duration / end));
                const timer = setInterval(() => {
                    start += Math.ceil(end / 100);
                    if (start >= end) {
                        start = end;
                        clearInterval(timer);
                    }
                    setCount(start);
                }, Math.max(incrementTime, 20));
            }
        }, { threshold: 0.1 });

        if (ref.current) {
            observer.observe(ref.current);
        }
        return () => observer.disconnect();
    }, [value, hasFired]);

    return <span ref={ref} className="font-bold tracking-tight">{count.toLocaleString()}{suffix}</span>;
}

// --- Custom Accordion FAQ Item ---
function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-200/50 dark:border-slate-800/60 py-4 transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-2 font-bold text-lg text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
            >
                <span>{question}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-2 pb-2 leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function LandingPage() {
    const { theme, setTheme } = useTheme()
    const isDark = theme === 'dark'
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement | null>(null)

    // Interactive Hero Mockup Tab State
    const [heroTab, setHeroTab] = useState<'explore' | 'budget' | 'timeline'>('explore')

    // Testimonial State
    const [testimonialIndex, setTestimonialIndex] = useState(0)

    const TESTIMONIALS = [
        {
            quote: "MYBUKO completely changed how I look at travel. I went from having a messy text file to skydiving in Dubai in under 3 months!",
            author: "Aravind Sharma",
            role: "Adventure Enthusiast",
            avatar: "A"
        },
        {
            quote: "The personalized suggestions helped me find a budget pottery workshop 10 minutes away that I had no idea existed. Best weekend ever.",
            author: "Priya Patel",
            role: "Creative Director",
            avatar: "P"
        },
        {
            quote: "Planning our group trek to tea gardens in Darjeeling was a breeze. The checklist timeline and cost estimations are absolute lifesavers.",
            author: "Rohan Das",
            role: "Software Engineer",
            avatar: "R"
        }
    ]

    useEffect(() => {
        if (typeof window === 'undefined') return
        const token = window.localStorage.getItem('token')
        const userData = window.localStorage.getItem('user')
        setIsLoggedIn(Boolean(token && userData))
        if (userData) {
            try {
                setUser(JSON.parse(userData))
            } catch { }
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        document.cookie = 'token=; path=/; max-age=0'
        setIsLoggedIn(false)
        setUser(null)
        setIsMenuOpen(false)
    }

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 font-sans">
            
            {/* Ambient Background Texture */}
            <div className="noise-overlay" />
            <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />

            {/* Glowing Aurora Orbs */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-10 w-[600px] h-[600px] rounded-full bg-violet-600/10 dark:bg-violet-600/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-[120px] pointer-events-none" />

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-900/60 backdrop-blur-xl transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2.5"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-white bg-clip-text text-transparent">MYBUKO</span>
                        </motion.div>

                        {/* Unified Right Actions */}
                        <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            {/* Dark Mode Icon Only Toggle */}
                            <button
                                type="button"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                aria-label="Toggle Dark Mode"
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200/50 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:scale-[1.03] transition-all hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
                            </button>

                            {/* Dropdown Menu */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/50 bg-white/80 dark:border-slate-800/60 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium text-sm cursor-pointer shadow-sm"
                                >
                                    {isLoggedIn && user ? (
                                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                                            <span className="text-white font-bold text-xs">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'J'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="px-1 text-slate-700 dark:text-slate-200">Menu</span>
                                    )}
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-250 ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2.5 w-56 rounded-2xl shadow-2xl py-2 border bg-white border-slate-200/60 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 z-50 overflow-hidden"
                                        >
                                            {isLoggedIn && user && (
                                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                                    <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                                                </div>
                                            )}

                                            <div className="py-1">
                                                <a
                                                    href="#how-it-works"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    How it Works
                                                </a>
                                                <a
                                                    href="#inspiration"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="block px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    Inspiration
                                                </a>
                                                <Link
                                                    href={isLoggedIn ? "/dashboard?tab=community" : "/explore"}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                                                >
                                                    Community
                                                </Link>
                                            </div>

                                            <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                                            {isLoggedIn && user ? (
                                                <div className="py-1">
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="block px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50/50 dark:text-indigo-400 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        Dashboard
                                                    </Link>
                                                    <Link
                                                        href="/dashboard/profile"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        Profile
                                                    </Link>
                                                    <Link
                                                        href="/dashboard/settings"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        Settings
                                                    </Link>
                                                    <Link
                                                        href="/dashboard/chats"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        Messages
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-t border-slate-100 dark:border-slate-800 mt-1.5 transition-colors cursor-pointer"
                                                    >
                                                        Logout
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="py-1 px-2 space-y-1">
                                                    <Link
                                                        href="/auth/login"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="block px-3 py-2 text-sm text-center font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                    >
                                                        Login
                                                    </Link>
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="block px-3 py-2 text-sm text-center font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                                                    >
                                                        Start Planning
                                                    </Link>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-12 pb-24 md:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

                        {/* Left Side - Text */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="lg:col-span-6 space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                Turn dreams into experiences
                            </div>

                            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] font-display">
                                Stop collecting wishes.<br />
                                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                                    Start creating memories.
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-sans max-w-xl">
                                Discover destinations, analyze price ranges, and map your plans step-by-step. MYBUKO transforms lists into real, lived-out experiences.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/dashboard"
                                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-indigo-500/10 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 active:scale-95 shadow-md"
                                >
                                    Start Your Bucket List
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link
                                    href={isLoggedIn ? "/dashboard?tab=community" : "/explore"}
                                    className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl font-semibold hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Play className="w-4 h-4 fill-current text-indigo-500" />
                                    Explore Community
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center gap-5 pt-4">
                                <div className="flex -space-x-2.5">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 border-2 border-slate-50 dark:border-slate-950 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                                            {i === 4 ? "+5k" : ""}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">5,000+</span> bucket lists completed worldwide.
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Side - Interactive Glassmorphism Dashboard Mockup */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                            className="lg:col-span-6 relative"
                        >
                            {/* Glowing Backlight Orbs */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl opacity-10 dark:opacity-20 blur-3xl pointer-events-none" />

                            <div className="relative z-10 bg-white/85 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl shadow-2xl p-6 md:p-8 backdrop-blur-xl">
                                
                                {/* Mock Header controls */}
                                <div className="flex justify-between items-center pb-5 border-b border-slate-100 dark:border-slate-800/60 mb-6">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                    </div>
                                    <div className="flex gap-2 bg-slate-100/80 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        {(['explore', 'budget', 'timeline'] as const).map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setHeroTab(tab)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all focus:outline-none ${
                                                    heroTab === tab 
                                                        ? (theme === 'dark' ? 'bg-slate-800 text-indigo-300 shadow-sm' : 'bg-white text-indigo-600 shadow-sm') 
                                                        : (theme === 'dark' ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
                                                }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dynamic Tab Content */}
                                <div className="min-h-[220px]">
                                    <AnimatePresence mode="wait">
                                        {heroTab === 'explore' && (
                                            <motion.div
                                                key="explore"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50/50 via-purple-50/20 to-cyan-50/10 rounded-2xl border border-indigo-200/40 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent dark:border-indigo-900/30">
                                                    <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">Skydiving in Mysore</span>
                                                    <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-1 rounded-md font-bold">Planned</span>
                                                </div>

                                                <div className="space-y-2.5">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Smart Alternatives</p>
                                                    {[
                                                        { name: 'Mysore Skydiving', price: '₹25,000', dist: '450 km' },
                                                        { name: 'Aamby Valley Jump', price: '₹28,000', dist: '850 km' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition">
                                                            <div className="flex items-center gap-3">
                                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                                <div>
                                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm">{item.name}</p>
                                                                    <p className="text-[10px] text-slate-400">{item.dist}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.price}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {heroTab === 'budget' && (
                                            <motion.div
                                                key="budget"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-5"
                                            >
                                                <div className="p-4 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl">
                                                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                        <span>Savings Goal Progress</span>
                                                        <span className="text-indigo-600 dark:text-indigo-400">71%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                                        <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full" style={{ width: '71%' }} />
                                                    </div>
                                                    <div className="flex justify-between items-baseline mt-3">
                                                        <span className="text-xl font-extrabold text-slate-900 dark:text-white">₹25,000</span>
                                                        <span className="text-xs text-slate-400">target: ₹35,000</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center gap-4">
                                                    <div className="flex-1 p-3 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-200/20 rounded-xl text-center">
                                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Weekly Habit</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">+₹1,200</p>
                                                    </div>
                                                    <div className="flex-1 p-3 bg-cyan-50/30 dark:bg-cyan-950/15 border border-cyan-200/20 rounded-xl text-center">
                                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Days to Target</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">24 days</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {heroTab === 'timeline' && (
                                            <motion.div
                                                key="timeline"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-4"
                                            >
                                                <div className="relative border-l border-indigo-150 dark:border-indigo-900/60 ml-3.5 pl-6 space-y-4">
                                                    {[
                                                        { title: 'Research & check safety ratings', date: 'Oct 2026', done: true },
                                                        { title: 'Fund target reached & deposit paid', date: 'Nov 2026', done: true },
                                                        { title: 'Execute Skydive Event', date: 'Dec 15, 2026', done: false },
                                                    ].map((step, idx) => (
                                                        <div key={idx} className="relative">
                                                            <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${step.done ? 'border-indigo-500 bg-indigo-500 dark:bg-slate-900' : 'border-slate-300 dark:border-slate-700'}`}>
                                                                {step.done && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </div>
                                                            <div>
                                                                <p className={`text-xs md:text-sm font-bold ${step.done ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{step.title}</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">{step.date}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* TRUSTED BY & LIVE FEED SECTION */}
            <section className="py-12 bg-white/40 dark:bg-slate-950/20 border-y border-slate-200/50 dark:border-slate-900/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h3 className="text-xs uppercase tracking-[0.3em] font-extrabold text-indigo-600 dark:text-indigo-400">Live Community Board</h3>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">Trusted by thousands of dreamers.</p>
                        </div>
                        {/* Live feed ticks */}
                        <div className="flex flex-wrap gap-3 items-center justify-center">
                            {[
                                { user: "Kabir", action: "planned Skydiving", time: "2m ago" },
                                { user: "Doe", action: "completed 'Learn Pottery'", time: "5m ago" },
                                { user: "Rishi", action: "created 'Darjeeling Tour'", time: "10m ago" },
                            ].map((act, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 shadow-sm text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-bold text-slate-800 dark:text-white">{act.user}</span>
                                    <span className="text-slate-400">{act.action}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{act.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-display">How MYBUKO Works</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">Three simple steps to transform your goals from conceptual wishes to completed achievements.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '1',
                                icon: Target,
                                title: 'Capture Your Dream',
                                desc: 'Add anything you\'ve always desired to experience. Categorize and prioritize it easily.',
                                color: 'from-violet-500 to-indigo-600',
                                shadow: 'shadow-violet-500/10'
                            },
                            {
                                step: '2',
                                icon: Sparkles,
                                title: 'Get Suggestions',
                                desc: 'We scan local, domestic, and international options, giving you smart estimates.',
                                color: 'from-cyan-500 to-indigo-500',
                                shadow: 'shadow-cyan-500/10'
                            },
                            {
                                step: '3',
                                icon: Calendar,
                                title: 'Build Timeline & Execute',
                                desc: 'Organize milestones, set target savings rates, and cross them off one by one.',
                                color: 'from-emerald-500 to-teal-600',
                                shadow: 'shadow-emerald-500/10'
                            }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                className="group relative h-full rounded-[28px] border border-slate-200/50 dark:border-slate-800 p-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl hover:-translate-y-2 hover:shadow-2xl hover:border-transparent transition-all duration-300"
                            >
                                {/* Hover background mesh borders */}
                                <div className="absolute -inset-[1px] rounded-[28px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg ${item.shadow} group-hover:scale-105 transition-transform`}>
                                    <item.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className={`text-6xl font-bold bg-gradient-to-br ${item.color} bg-clip-text text-transparent opacity-[0.08] absolute top-4 right-4`}>
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{item.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed flex-grow">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRODUCT FEATURE SHOWCASE */}
            <section className="py-20 md:py-28 bg-white dark:bg-slate-900/40 border-y border-slate-200/40 dark:border-slate-900/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
                    
                    {/* Header */}
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-display">Complete Planning Workflow</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">Everything you need to stop dreaming and start doing, built into a beautiful, streamlined interface.</p>
                    </div>

                    {/* Zig Zag Showcase 1 */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                <Globe className="w-3.5 h-3.5" />
                                Smart Discovery
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Find experiences tailored to your interests</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg">
                                Discover destinations, workshops, activities, and courses based on your preferences. Our local and global discovery algorithms supply real-world routes and safety options near you.
                            </p>
                            <div className="flex gap-6 pt-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Location intelligence</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Custom tags matching</span>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55 }}
                            className="relative bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-8 border border-slate-200/30 dark:border-slate-800/80 aspect-video flex items-center justify-center shadow-inner overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
                            <div className="relative w-44 h-44 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-[36px] flex items-center justify-center shadow-2xl shadow-indigo-500/20 transform hover:rotate-6 transition-transform">
                                <Globe className="w-20 h-20 text-white" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Zig Zag Showcase 2 */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55 }}
                            className="relative bg-gradient-to-br from-cyan-50/80 to-indigo-50/40 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-8 border border-slate-200/30 dark:border-slate-800/80 aspect-video flex items-center justify-center shadow-inner overflow-hidden order-2 lg:order-1"
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
                            <div className="relative w-44 h-44 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-[36px] flex items-center justify-center shadow-2xl shadow-cyan-500/20 transform hover:-rotate-6 transition-transform">
                                <DollarSign className="w-20 h-20 text-white" />
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55 }}
                            className="space-y-6 order-1 lg:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                <DollarSign className="w-3.5 h-3.5" />
                                Cost & Estimations
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Achieve goals without financial stress</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg">
                                Gain complete transparency over cost options, travel ticket quotes, and equipment rentals. Plan your weekly or monthly savings progress and get alerts as you get closer.
                            </p>
                            <div className="flex gap-6 pt-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Alternative cost filters</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Auto-calculated targets</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Zig Zag Showcase 3 */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5" />
                                Timeline Milestones
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-display">Divide milestones, track your schedule</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base md:text-lg">
                                Setup chronological steps for any bucket-list item. Keep travel arrangements, notes, contacts, and photos organized inside a clean, high-fidelity timeline structure.
                            </p>
                            <div className="flex gap-6 pt-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Milestones checklist</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Integrated calendar dates</span>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55 }}
                            className="relative bg-gradient-to-br from-purple-50/80 to-pink-50/50 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-8 border border-slate-200/30 dark:border-slate-800/80 aspect-video flex items-center justify-center shadow-inner overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-grid-pattern opacity-40" />
                            <div className="relative w-44 h-44 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[36px] flex items-center justify-center shadow-2xl shadow-purple-500/20 transform hover:rotate-6 transition-transform">
                                <TrendingUp className="w-20 h-20 text-white" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ACHIEVEMENT JOURNEY TIMELINE */}
            <section className="py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-display">The Dream-to-Experience Journey</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">How MYBUKO supports you through every phase of making a dream a reality.</p>
                    </div>

                    <div className="relative max-w-3xl mx-auto">
                        {/* Vertical Path Line */}
                        <div className="absolute left-[23px] md:left-1/2 top-4 bottom-4 w-[2px] bg-indigo-300 dark:bg-indigo-900/60" />

                        <div className="space-y-12">
                            {[
                                {
                                    title: "1. The Spark",
                                    desc: "You record a goal—whether it is trekking Darjeeling Tea Gardens or learning pottery. It exists safely in your account.",
                                    side: "left"
                                },
                                {
                                    title: "2. The Suggestion",
                                    desc: "MYBUKO scans and proposes local alternative spots, estimated equipment costs, and lists best times of year to visit.",
                                    side: "right"
                                },
                                {
                                    title: "3. The Blueprint",
                                    desc: "You set milestones, save weekly budgets, and organize logistics (flights, bookings) inside your timeline workspace.",
                                    side: "left"
                                },
                                {
                                    title: "4. The Achievement",
                                    desc: "You execute the goal, check it off, and upload a story to inspire the community to complete theirs next.",
                                    side: "right"
                                }
                            ].map((item, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 25 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className={`relative flex flex-col md:flex-row items-start ${item.side === 'right' ? 'md:flex-row-reverse' : ''}`}
                                >
                                    {/* Timeline Node Icon */}
                                    <div className="absolute left-1.5 md:left-1/2 md:-ml-[22px] w-11 h-11 bg-white dark:bg-slate-900 border-4 border-indigo-500 rounded-full flex items-center justify-center z-10 shadow-md">
                                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                                    </div>

                                    {/* Content Card */}
                                    <div className="w-full md:w-[45%] pl-12 md:pl-0">
                                        <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl shadow-sm hover:shadow-md transition">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{item.title}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-2 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* INSPIRATION / POPULAR CARDS */}
            <section id="inspiration" className="py-20 md:py-28 bg-white dark:bg-slate-900/40 border-y border-slate-200/40 dark:border-slate-900/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white font-display">Need ideas? Start here</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">Trending activities dreamers are adding this week.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: Mountain, title: 'Visit Tea Gardens', location: 'Assam / Darjeeling', color: 'from-green-500 to-emerald-500', tag: 'Nature' },
                            { icon: Palette, title: 'Learn Pottery', location: 'Local workshops', color: 'from-orange-500 to-red-500', tag: 'Art' },
                            { icon: Plane, title: 'Skydiving', location: 'Mysore / Dubai', color: 'from-blue-500 to-cyan-500', tag: 'Adventure' },
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.12 }}
                                className="group cursor-pointer rounded-3xl border border-slate-200/50 dark:border-slate-800/80 p-8 bg-white dark:bg-slate-950/60 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                                        <item.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full">{item.tag}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1 dark:text-white">{item.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">{item.location}</p>
                                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:gap-2 text-sm transition-all">
                                    See Alternatives <ChevronRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link
                            href={isLoggedIn ? "/dashboard?tab=community" : "/explore"}
                            className="inline-flex px-8 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 rounded-xl font-bold hover:border-slate-300 dark:hover:border-slate-600 transition shadow-sm hover:shadow-md"
                        >
                            Explore More Ideas
                        </Link>
                    </div>
                </div>
            </section>

            {/* STATISTICS SECTION WITH ANIMATED COUNTERS */}
            <section className="py-20 md:py-28 bg-gradient-to-b from-transparent to-indigo-50/20 dark:to-slate-950/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                        
                        <div className="text-center space-y-2">
                            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-display">
                                <Counter value={5420} suffix="+" />
                            </p>
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Dreams Realized</p>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-display">
                                <Counter value={120} suffix="+" />
                            </p>
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Countries Visited</p>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-display">
                                <Counter value={98} suffix="%" />
                            </p>
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Satisfaction Rate</p>
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-display">
                                <Counter value={2500} suffix="+" />
                            </p>
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">Active Dreamers</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* SOCIAL PROOF / TESTIMONIALS CAROUSEL */}
            <section className="py-20 md:py-28 border-t border-slate-200/40 dark:border-slate-900/60">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                    
                    <div className="space-y-3">
                        <h3 className="text-xs uppercase tracking-[0.25em] font-extrabold text-indigo-600 dark:text-indigo-400">Testimonials</h3>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display">What other dreamers say</h2>
                    </div>

                    {/* Testimonials Card */}
                    <div className="relative overflow-hidden py-12 px-6 sm:px-12 rounded-[32px] bg-white dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl">
                        
                        {/* Star Rating */}
                        <div className="flex justify-center gap-1 mb-6">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className="w-5 h-5 text-yellow-400 fill-current" />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.p
                                key={testimonialIndex}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25 }}
                                className="text-lg sm:text-xl font-medium text-slate-700 dark:text-slate-200 italic leading-relaxed max-w-2xl mx-auto"
                            >
                                "{TESTIMONIALS[testimonialIndex].quote}"
                            </motion.p>
                        </AnimatePresence>

                        <div className="mt-8 flex flex-col items-center">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md mb-2">
                                {TESTIMONIALS[testimonialIndex].avatar}
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-base">{TESTIMONIALS[testimonialIndex].author}</h4>
                            <p className="text-slate-400 text-xs">{TESTIMONIALS[testimonialIndex].role}</p>
                        </div>

                        {/* Pagination Toggles */}
                        <div className="flex justify-center gap-2 mt-8">
                            {TESTIMONIALS.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setTestimonialIndex(idx)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none ${testimonialIndex === idx ? 'bg-indigo-500 w-6' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-20 md:py-28 border-t border-slate-200/40 dark:border-slate-900/60 bg-white dark:bg-slate-950">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">Frequently Asked Questions</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm md:text-base">Got questions about planning your bucket list? We have answers.</p>
                    </div>

                    <div className="space-y-1">
                        <FAQItem 
                            question="Is MYBUKO completely free to use?" 
                            answer="Yes! Setting up your account, adding bucket list dreams, and receiving standard local price alternatives is free. We want to enable everyone to capture and execute their goals." 
                        />
                        <FAQItem 
                            question="How do the budget suggestions work?" 
                            answer="We query active listings, local training classes, and flight APIs based on the location details of your dream, then recommend budget-friendly slots and alternative spots that align with your targets." 
                        />
                        <FAQItem 
                            question="Can I share my bucket list with friends?" 
                            answer="Absolutely! You can choose to set individual items to Public or Private. Public goals show up in the Community tab where friends can follow, comment, and plan together." 
                        />
                        <FAQItem 
                            question="What happens when I check off a dream?" 
                            answer="Checking off a dream updates your profile achievements, counts towards your Stats score, and allows you to optionally post a Story with an image to inspire other goal-builders." 
                        />
                    </div>
                </div>
            </section>

            {/* FINAL PREMIUM GRADIENT CTA */}
            <section className="py-20 md:py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-[36px] overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 p-12 text-center border border-indigo-900/30 dark:border-slate-800 shadow-2xl"
                    >
                        {/* Radial Spotlight Overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_60%)] pointer-events-none" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight font-display">
                                Your bucket list isn't meant to stay a list.
                            </h2>
                            <p className="text-lg text-indigo-200 leading-relaxed font-light">
                                Take control of your time. Start organizing your milestones and creating memorable experiences today—completely free.
                            </p>
                            <div className="pt-4">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-[1.04] active:scale-[0.98]"
                                >
                                    Get Started for Free
                                    <ChevronRight className="w-5 h-5 text-indigo-600" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-16 border-t border-slate-800/60 dark:border-slate-900/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
                        <div className="col-span-2 md:col-span-1 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold text-white tracking-tight">MYBUKO</span>
                            </div>
                            <p className="text-xs text-slate-500">Transform your bucket list from a simple wish list into real-world experiences.</p>
                        </div>

                        <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Product</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                                <li><a href="#inspiration" className="hover:text-white transition-colors">Inspiration</a></li>
                                <li><Link href={isLoggedIn ? "/dashboard?tab=community" : "/explore"} className="hover:text-white transition-colors">Community Feed</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Company</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Legal</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800/80 mt-12 pt-8 text-center text-xs text-slate-500">
                        <p>© 2026 MYBUKO. All rights reserved. Made for goal-builders.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}