"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, ChevronRight, Shield, Users, Send, MessageCircle,
    UserCircle, Calendar, ArrowRight, Zap, Target, Handshake, Star,
    Check, CheckCheck, Clock, Search, Paperclip, ShieldCheck, Linkedin,
    FileText, MapPin, Trophy, School
} from "lucide-react"
import { WaveBackground } from "@/components/wave-background"

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface Slide {
    id: string
    bg: string
    content: React.ReactNode
}

function SlideWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative w-full h-full flex flex-col items-center justify-center px-8 py-12 overflow-hidden ${className}`}>
            {children}
        </div>
    )
}

/** Phone-shaped frame that wraps a mini UI mockup */
function PhoneMock({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full max-w-[280px] mx-auto">
            <div className="rounded-[24px] border-[3px] border-gray-800 bg-white overflow-hidden shadow-2xl">
                {/* Status bar */}
                <div className="bg-gray-50 px-4 py-1.5 flex items-center justify-between border-b border-gray-100">
                    <span className="text-[8px] font-semibold text-gray-500">9:41</span>
                    <div className="w-16 h-4 bg-gray-900 rounded-full" />
                    <div className="flex gap-1">
                        <div className="w-3 h-1.5 bg-gray-400 rounded-sm" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    </div>
                </div>
                <div className="max-h-[360px] overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Slides
// ---------------------------------------------------------------------------

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

    // 4 — Verified Community + demo
    {
        id: "verified",
        bg: "bg-gradient-to-b from-blue-50 to-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Verified Community</span>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        Only real<br />student-athletes.
                    </h2>
                    <p className="text-sm text-gray-500 max-w-xs leading-relaxed font-medium">
                        Every member is verified with a <strong className="text-gray-700">.edu email</strong> and linked to their team roster.
                    </p>

                    {/* Mini mockup: verification flow */}
                    <PhoneMock>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold text-gray-900">Verification</span>
                            </div>
                            {/* Step 1 — done */}
                            <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3 border border-green-100">
                                <div className="h-7 w-7 rounded-lg bg-green-500 text-white flex items-center justify-center shrink-0">
                                    <Check className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-gray-800">.edu Email Verified</p>
                                    <p className="text-[9px] text-gray-400">max@stanford.edu</p>
                                </div>
                            </div>
                            {/* Step 2 — done */}
                            <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3 border border-green-100">
                                <div className="h-7 w-7 rounded-lg bg-green-500 text-white flex items-center justify-center shrink-0">
                                    <Check className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-gray-800">Roster Link Submitted</p>
                                    <p className="text-[9px] text-gray-400">gostanford.com/roster/tennis</p>
                                </div>
                            </div>
                            {/* Step 3 — result */}
                            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
                                <div className="h-7 w-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-blue-700">Verified Athlete</p>
                                    <p className="text-[9px] text-blue-400">Badge active on profile</p>
                                </div>
                            </div>
                        </div>
                    </PhoneMock>
                </div>
            </SlideWrapper>
        ),
    },

    // 5 — Discover & Connect + demo
    {
        id: "network",
        bg: "bg-gradient-to-b from-purple-50 to-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-500">Smart Networking</span>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        Find athletes<br />who get it.
                    </h2>

                    {/* Mini mockup: network discover page */}
                    <PhoneMock>
                        <div className="p-3 space-y-2.5">
                            {/* Search bar */}
                            <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 gap-2">
                                <Search className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] text-gray-400">Search athletes...</span>
                            </div>
                            {/* Filters */}
                            <div className="flex gap-1.5">
                                <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Tennis</span>
                                <span className="text-[8px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">All Industries</span>
                            </div>
                            {/* Athlete cards */}
                            {[
                                { name: "Sarah Chen", school: "Stanford", sport: "Tennis", match: "92%", initials: "SC" },
                                { name: "Marcus Johnson", school: "Duke", sport: "Tennis", match: "87%", initials: "MJ" },
                                { name: "Emily Rodriguez", school: "UCLA", sport: "Tennis", match: "81%", initials: "ER" },
                            ].map((person, i) => (
                                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] font-bold text-purple-600">{person.initials}</span>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center gap-1">
                                            <p className="text-[10px] font-bold text-gray-900 truncate">{person.name}</p>
                                            <ShieldCheck className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                                        </div>
                                        <p className="text-[8px] text-gray-400">{person.sport} &middot; {person.school}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[9px] font-black text-purple-600">{person.match}</span>
                                        <p className="text-[7px] text-gray-400">match</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </PhoneMock>
                </div>
            </SlideWrapper>
        ),
    },

    // 6 — Structured Requests + demo
    {
        id: "requests",
        bg: "bg-gradient-to-b from-green-50 to-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-green-500">Structured Requests</span>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        Not just<br />&ldquo;let&rsquo;s connect.&rdquo;
                    </h2>

                    {/* Mini mockup: request form */}
                    <PhoneMock>
                        <div className="p-4 space-y-3">
                            <p className="text-[11px] font-bold text-gray-900">New Request to Sarah Chen</p>

                            {/* Type selector */}
                            <div>
                                <p className="text-[9px] font-semibold text-gray-500 mb-1.5">Request Type</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { label: "Career Advice", active: true },
                                        { label: "Mentorship", active: false },
                                        { label: "Job Referral", active: false },
                                        { label: "Internship", active: false },
                                    ].map((t, i) => (
                                        <div key={i} className={`text-[8px] font-bold px-2 py-2 rounded-lg text-center border ${t.active ? "bg-green-500 text-white border-green-500" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                                            {t.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Context */}
                            <div>
                                <p className="text-[9px] font-semibold text-gray-500 mb-1">Your Message</p>
                                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-left">
                                    <p className="text-[9px] text-gray-700 leading-relaxed">Hi Sarah! I&rsquo;m a junior tennis player at Duke interested in transitioning into consulting. Would love to hear about your experience at McKinsey...</p>
                                </div>
                            </div>

                            {/* Send button */}
                            <div className="bg-green-500 text-white text-[10px] font-bold text-center py-2.5 rounded-xl flex items-center justify-center gap-1">
                                <Send className="h-3 w-3" />
                                Send Request
                            </div>
                        </div>
                    </PhoneMock>
                </div>
            </SlideWrapper>
        ),
    },

    // 7 — Messaging + demo
    {
        id: "messaging",
        bg: "bg-gradient-to-b from-sky-50 to-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-sky-500">Real-time Chat</span>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        Chat like<br />it&rsquo;s 2025.
                    </h2>

                    {/* Mini mockup: chat screen */}
                    <PhoneMock>
                        <div className="flex flex-col h-[360px]">
                            {/* Chat header */}
                            <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2.5 bg-white">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-purple-600">SC</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-900">Sarah Chen</p>
                                    <p className="text-[8px] text-green-500 font-medium">Online</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-3 space-y-2.5 bg-gray-50/50 overflow-hidden">
                                {/* Received */}
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 max-w-[78%] shadow-sm border border-gray-100">
                                        <p className="text-[10px] text-gray-800 text-left leading-relaxed">Hey Marcus! Thanks for reaching out. I&rsquo;d love to chat about consulting!</p>
                                        <p className="text-[7px] text-gray-400 mt-1 text-right">2:30 PM</p>
                                    </div>
                                </div>
                                {/* Sent */}
                                <div className="flex justify-end">
                                    <div className="bg-blue-500 rounded-2xl rounded-br-md px-3 py-2 max-w-[78%] shadow-sm">
                                        <p className="text-[10px] text-white text-left leading-relaxed">That would be amazing! Are you free this week for a quick call?</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <p className="text-[7px] text-blue-200">2:32 PM</p>
                                            <CheckCheck className="h-2.5 w-2.5 text-blue-200" />
                                        </div>
                                    </div>
                                </div>
                                {/* Received */}
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2 max-w-[78%] shadow-sm border border-gray-100">
                                        <p className="text-[10px] text-gray-800 text-left leading-relaxed">Absolutely! Here&rsquo;s my calendar link:</p>
                                        <p className="text-[10px] text-blue-500 text-left underline">calendly.com/sarachen</p>
                                        <p className="text-[7px] text-gray-400 mt-1 text-right">2:33 PM</p>
                                    </div>
                                </div>
                                {/* Typing indicator */}
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-bl-md px-3 py-2.5 shadow-sm border border-gray-100">
                                        <div className="flex gap-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Input bar */}
                            <div className="px-3 py-2 border-t border-gray-100 bg-white flex items-center gap-2">
                                <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                                <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5">
                                    <span className="text-[9px] text-gray-400">Type a message...</span>
                                </div>
                                <Send className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                        </div>
                    </PhoneMock>
                </div>
            </SlideWrapper>
        ),
    },

    // 8 — Profile + demo
    {
        id: "profile",
        bg: "bg-gradient-to-b from-indigo-50 to-white",
        content: (
            <SlideWrapper>
                <div className="flex flex-col items-center text-center space-y-5">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Your Profile</span>
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">
                        Stand out.<br />Get found.
                    </h2>

                    {/* Mini mockup: profile page */}
                    <PhoneMock>
                        <div>
                            {/* Cover */}
                            <div className="h-20 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                                    <div className="h-12 w-12 rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center shadow-md">
                                        <span className="text-sm font-black text-indigo-600">M</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-7 px-4 pb-3 text-center space-y-1.5">
                                <div className="flex items-center justify-center gap-1">
                                    <p className="text-[12px] font-black text-gray-900">Marcus Johnson</p>
                                    <ShieldCheck className="h-3 w-3 text-blue-500" />
                                </div>
                                <p className="text-[9px] text-gray-500 font-medium flex items-center justify-center gap-1">
                                    <Trophy className="h-2.5 w-2.5" />
                                    Tennis &middot; Duke University
                                </p>
                                <p className="text-[9px] text-indigo-600 font-bold">
                                    Interested in Consulting
                                </p>
                                <div className="flex items-center justify-center gap-1 text-[8px] text-gray-400">
                                    <MapPin className="h-2 w-2" />
                                    Durham, NC &middot; <span className="font-semibold text-indigo-500">12 Connections</span>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-1.5 pt-2">
                                    <div className="flex-1 bg-blue-500 text-white text-[8px] font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1">
                                        <MessageCircle className="h-2.5 w-2.5" />
                                        Message
                                    </div>
                                    <div className="flex-1 bg-indigo-500 text-white text-[8px] font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1">
                                        <Calendar className="h-2.5 w-2.5" />
                                        Book Meeting
                                    </div>
                                </div>

                                {/* Quick info */}
                                <div className="grid grid-cols-3 gap-1.5 pt-2">
                                    <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                                        <FileText className="h-3 w-3 text-gray-400 mx-auto" />
                                        <p className="text-[7px] text-gray-500 mt-0.5">Resume</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                                        <Linkedin className="h-3 w-3 text-blue-600 mx-auto" />
                                        <p className="text-[7px] text-gray-500 mt-0.5">LinkedIn</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                                        <Calendar className="h-3 w-3 text-indigo-500 mx-auto" />
                                        <p className="text-[7px] text-gray-500 mt-0.5">Schedule</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PhoneMock>
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
