"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Shield, Users, Send, MessageCircle, UserCircle, Calendar, ArrowRight, Zap, Target, Handshake, Star } from "lucide-react"
import { WaveBackground } from "@/components/wave-background"

// ---------------------------------------------------------------------------
// Slide data
// ---------------------------------------------------------------------------

interface Slide {
    id: string
    bg: string
    content: React.ReactNode
}

function SlideWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative w-full h-full flex flex-col items-center justify-center px-10 py-16 overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

function FeatureIcon({ icon: Icon, color }: { icon: typeof Shield; color: string }) {
    return (
        <div className={`h-20 w-20 rounded-3xl flex items-center justify-center mb-8 ${color}`}>
            <Icon className="h-10 w-10" />
        </div>
    )
}

const slides: Slide[] = [
    // 1 — Title
    {
        id: "title",
        bg: "bg-primary",
        content: (
            <SlideWrapper>
                <WaveBackground className="absolute inset-0 text-primary-foreground pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                    <img src="/relay-logo.png" alt="Relay" className="h-16 w-auto brightness-0 invert" />
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black tracking-tight text-white leading-[1.1]">
                            Your Network<br />is Your<br />Net Worth.
                        </h1>
                        <p className="text-xl text-white/60 max-w-xs mx-auto leading-relaxed font-medium">
                            The professional networking platform built exclusively for student-athletes.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white/80 text-sm font-semibold">Now in Beta</span>
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 2 — The Problem
    {
        id: "problem",
        bg: "bg-[#0a0a0a]",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-10">
                    <span className="text-sm font-bold uppercase tracking-widest text-red-400">The Problem</span>
                    <h2 className="text-4xl font-black text-white leading-tight">
                        Student-athletes are<br />
                        <span className="text-red-400">underconnected</span><br />
                        professionally.
                    </h2>
                    <div className="space-y-5 w-full max-w-sm">
                        {[
                            "No easy way to find alumni in your sport",
                            "LinkedIn doesn't understand athlete networks",
                            "Career resources aren't tailored to athletes",
                        ].map((text, i) => (
                            <div key={i} className="flex items-start gap-4 text-left">
                                <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Target className="h-4 w-4 text-red-400" />
                                </div>
                                <p className="text-white/70 text-lg font-medium leading-snug">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 3 — Solution intro
    {
        id: "solution",
        bg: "bg-primary",
        content: (
            <SlideWrapper>
                <WaveBackground className="absolute inset-0 text-primary-foreground pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                    <div className="h-20 w-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                        <Handshake className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-black text-white leading-tight">
                        Meet Relay.
                    </h2>
                    <p className="text-xl text-white/60 max-w-xs leading-relaxed font-medium">
                        A verified, athlete-only platform that makes professional networking effortless.
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-xs pt-4">
                        {[
                            { num: "100%", label: "Verified Athletes" },
                            { num: ".edu", label: "Email Required" },
                            { num: "24", label: "Sports Supported" },
                            { num: "Free", label: "During Beta" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                                <p className="text-2xl font-black text-white">{stat.num}</p>
                                <p className="text-xs text-white/50 font-semibold mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 4 — Verified Community
    {
        id: "verified",
        bg: "bg-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-8">
                    <FeatureIcon icon={Shield} color="bg-blue-100 text-blue-600" />
                    <span className="text-sm font-bold uppercase tracking-widest text-blue-500">Verified Community</span>
                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                        Only real<br />student-athletes.
                    </h2>
                    <p className="text-lg text-gray-500 max-w-xs leading-relaxed font-medium">
                        Every member is verified with a <strong className="text-gray-700">.edu email</strong> and linked to their team roster. No fakes, no spam.
                    </p>
                    <div className="w-full max-w-xs space-y-3 pt-2">
                        {[
                            { icon: "1", text: "Sign up with .edu email" },
                            { icon: "2", text: "Link your team roster" },
                            { icon: "3", text: "Get your verified badge" },
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-4 bg-blue-50 rounded-2xl p-4">
                                <div className="h-10 w-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                                    {step.icon}
                                </div>
                                <p className="text-sm font-semibold text-gray-700 text-left">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 5 — Discover & Connect
    {
        id: "network",
        bg: "bg-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-8">
                    <FeatureIcon icon={Users} color="bg-purple-100 text-purple-600" />
                    <span className="text-sm font-bold uppercase tracking-widest text-purple-500">Smart Networking</span>
                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                        Find athletes<br />who get it.
                    </h2>
                    <p className="text-lg text-gray-500 max-w-xs leading-relaxed font-medium">
                        Filter by <strong className="text-gray-700">sport, school, and industry</strong>. Our similarity algorithm surfaces the most relevant connections first.
                    </p>
                    <div className="w-full max-w-xs space-y-3 pt-2">
                        {[
                            { icon: Zap, text: "Smart similarity matching", color: "bg-yellow-50 text-yellow-600" },
                            { icon: Target, text: "Filter by sport & industry", color: "bg-green-50 text-green-600" },
                            { icon: Star, text: "See mutual connections", color: "bg-orange-50 text-orange-600" },
                        ].map((item, i) => {
                            const Icon = item.icon
                            return (
                                <div key={i} className="flex items-center gap-4 bg-purple-50 rounded-2xl p-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 text-left">{item.text}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 6 — Structured Requests
    {
        id: "requests",
        bg: "bg-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-8">
                    <FeatureIcon icon={Send} color="bg-green-100 text-green-600" />
                    <span className="text-sm font-bold uppercase tracking-widest text-green-500">Structured Requests</span>
                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                        Not just<br />&ldquo;let&rsquo;s connect.&rdquo;
                    </h2>
                    <p className="text-lg text-gray-500 max-w-xs leading-relaxed font-medium">
                        Send purposeful requests for <strong className="text-gray-700">career advice, mentorship, referrals</strong>, or internship inquiries.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2.5 pt-2 max-w-xs">
                        {[
                            { label: "Career Advice", color: "bg-blue-100 text-blue-700 border-blue-200" },
                            { label: "Mentorship", color: "bg-purple-100 text-purple-700 border-purple-200" },
                            { label: "Job Referral", color: "bg-green-100 text-green-700 border-green-200" },
                            { label: "Internship", color: "bg-amber-100 text-amber-700 border-amber-200" },
                        ].map((tag, i) => (
                            <span key={i} className={`px-4 py-2 rounded-full text-sm font-bold border ${tag.color}`}>
                                {tag.label}
                            </span>
                        ))}
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 7 — Messaging
    {
        id: "messaging",
        bg: "bg-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-8">
                    <FeatureIcon icon={MessageCircle} color="bg-sky-100 text-sky-600" />
                    <span className="text-sm font-bold uppercase tracking-widest text-sky-500">Real-time Chat</span>
                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                        Chat like<br />it&rsquo;s 2025.
                    </h2>
                    <p className="text-lg text-gray-500 max-w-xs leading-relaxed font-medium">
                        Real-time messaging with <strong className="text-gray-700">read receipts, file attachments, typing indicators</strong>, and clickable links.
                    </p>
                    {/* Mock chat bubbles */}
                    <div className="w-full max-w-xs space-y-3 pt-2">
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                                <p className="text-sm text-gray-800 text-left">Hey! I saw you played tennis at Stanford. I&rsquo;d love career advice!</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="bg-blue-500 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                                <p className="text-sm text-white text-left">Of course! Happy to help a fellow athlete. Let&rsquo;s set up a call.</p>
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 8 — Profile & Scheduling
    {
        id: "profile",
        bg: "bg-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-8">
                    <FeatureIcon icon={UserCircle} color="bg-indigo-100 text-indigo-600" />
                    <span className="text-sm font-bold uppercase tracking-widest text-indigo-500">Your Profile</span>
                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                        Stand out.<br />Get found.
                    </h2>
                    <p className="text-lg text-gray-500 max-w-xs leading-relaxed font-medium">
                        Upload your <strong className="text-gray-700">resume, link LinkedIn</strong>, showcase your sport, and let others book time with you.
                    </p>
                    <div className="w-full max-w-xs space-y-3 pt-2">
                        {[
                            { icon: UserCircle, text: "Drag & drop profile photo", color: "text-indigo-500" },
                            { icon: Calendar, text: "Built-in meeting scheduler", color: "text-indigo-500" },
                            { icon: Send, text: "Auto-parse resume to profile", color: "text-indigo-500" },
                        ].map((item, i) => {
                            const Icon = item.icon
                            return (
                                <div key={i} className="flex items-center gap-4 bg-indigo-50 rounded-2xl p-4">
                                    <Icon className={`h-6 w-6 shrink-0 ${item.color}`} />
                                    <p className="text-sm font-semibold text-gray-700 text-left">{item.text}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 9 — CTA
    {
        id: "cta",
        bg: "bg-primary",
        content: (
            <SlideWrapper>
                <WaveBackground className="absolute inset-0 text-primary-foreground pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-10">
                    <img src="/relay-logo.png" alt="Relay" className="h-14 w-auto brightness-0 invert" />
                    <h2 className="text-4xl font-black text-white leading-tight">
                        Ready to build<br />your legacy?
                    </h2>
                    <p className="text-xl text-white/60 max-w-xs leading-relaxed font-medium">
                        Join the beta. It&rsquo;s free, it&rsquo;s verified, and it&rsquo;s built for athletes like you.
                    </p>
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <a
                            href="/signup"
                            className="inline-flex items-center gap-2 bg-white text-primary font-black text-lg px-10 py-4 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        >
                            Join the Team
                            <ArrowRight className="h-5 w-5" />
                        </a>
                        <span className="text-white/40 text-sm font-medium">No credit card required</span>
                    </div>
                </div>
            </SlideWrapper>
        ),
    },
]

// ---------------------------------------------------------------------------
// Carousel component
// ---------------------------------------------------------------------------

export function PitchCarousel() {
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(0)

    const go = useCallback((dir: number) => {
        setDirection(dir)
        setCurrent((prev) => {
            const next = prev + dir
            if (next < 0) return slides.length - 1
            if (next >= slides.length) return 0
            return next
        })
    }, [])

    // Keyboard nav
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1) }
            if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [go])

    const slide = slides[current]

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
    }

    return (
        <div className="fixed inset-0 bg-black">
            {/* Slide area — full screen */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={slide.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`absolute inset-0 ${slide.bg}`}
                >
                    {slide.content}
                </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            <button
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <button
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >
                <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-8 inset-x-0 z-30 flex items-center justify-center gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            i === current ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                        }`}
                    />
                        ))}
                    </div>
        </div>
    )
}
