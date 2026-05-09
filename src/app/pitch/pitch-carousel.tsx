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
    // 1 — The Problem (hook slide)
    {
        id: "problem",
        bg: "bg-[#0a0a0a]",
        content: (
            <SlideWrapper>
                {/* Subtle dark gradient texture */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-10">
                    {/* Big stat hook */}
                    <div className="space-y-4">
                        <span className="text-6xl sm:text-8xl font-black text-white leading-none">98%</span>
                        <p className="text-xl sm:text-2xl text-white/50 font-medium max-w-sm leading-snug">
                            of student-athletes will <span className="text-red-400 font-bold">never go pro.</span>
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-16 h-px bg-white/20" />

                    {/* Pain points */}
                    <div className="space-y-4 w-full max-w-sm">
                        <p className="text-lg text-white/80 font-semibold">
                            So where do they go next?
                        </p>
                        {[
                            "No alumni network built around their sport",
                            "LinkedIn ignores the athlete experience",
                            "Career resources are generic, not built for athletes",
                        ].map((text, i) => (
                            <div key={i} className="flex items-start gap-3 text-left">
                                <div className="h-6 w-6 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                    <Target className="h-3 w-3 text-red-400" />
                                </div>
                                <p className="text-white/50 text-base font-medium leading-snug">{text}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-2xl sm:text-3xl font-black text-white pt-4">
                        They deserve a better network.
                    </p>
                </div>
            </SlideWrapper>
        ),
    },

    // 2 — Introducing Relay
    {
        id: "solution",
        bg: "bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500",
        content: (
            <SlideWrapper>
                {/* Decorative orbs */}
                <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                    {/* Logo */}
                    <div className="relative">
                        <div className="absolute -inset-6 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                        <img
                            src="/relay-logo.png"
                            alt="Relay"
                            className="relative h-14 w-auto brightness-0 invert drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            style={{ imageRendering: "auto" }}
                        />
                    </div>
                    <div className="space-y-3">
                        <p className="text-sm font-bold uppercase tracking-widest text-white/50">Introducing</p>
                        <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight drop-shadow-lg">
                            Relay
                        </h2>
                    </div>
                    <p className="text-xl text-white/80 max-w-sm leading-relaxed font-medium">
                        The professional networking platform built exclusively for student-athletes and alumni.
                    </p>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-4">
                        {[
                            { num: "100%", label: "Verified Athletes", emoji: "✓" },
                            { num: ".edu", label: "Email Required", emoji: "🎓" },
                            { num: "24+", label: "Sports Supported", emoji: "⚡" },
                            { num: "Free", label: "During Beta", emoji: "🚀" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors shadow-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{stat.emoji}</span>
                                    <p className="text-2xl font-black text-white">{stat.num}</p>
                                </div>
                                <p className="text-xs text-white/60 font-semibold text-left">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 4 — Verified Community + demo (matches actual signup form)
    {
        id: "verified",
        bg: "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900",
        content: (
            <SlideWrapper>
                {/* Background accents */}
                <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-20 left-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    {/* Header area */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 backdrop-blur-sm">
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Verified Community</span>
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight">
                            Only real<br />student-athletes.
                        </h2>
                        <p className="text-sm text-blue-200/60 max-w-xs leading-relaxed font-medium mx-auto">
                            Every member is verified with a <strong className="text-blue-300">.edu email</strong> and linked to their team roster.
                        </p>
                    </div>

                    {/* Phone mockup with glow effect */}
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/20 to-cyan-500/10 rounded-[32px] blur-xl pointer-events-none" />
                        <PhoneMock>
                            <div className="p-4 space-y-2.5">
                                <div className="text-center mb-1">
                                    <p className="text-[12px] font-bold text-gray-900">Join the Team</p>
                                    <p className="text-[8px] text-gray-400">Create your Relay account to get started</p>
                                </div>
                                {/* Full Name */}
                                <div>
                                    <p className="text-[8px] font-medium text-gray-500 mb-0.5">Full Name</p>
                                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
                                        <span className="text-[9px] text-gray-800">Marcus Johnson</span>
                                    </div>
                                </div>
                                {/* Role select */}
                                <div>
                                    <p className="text-[8px] font-medium text-gray-500 mb-0.5">I am a...</p>
                                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200 flex justify-between items-center">
                                        <span className="text-[9px] text-gray-800">Current Student-Athlete</span>
                                        <ChevronRight className="h-2.5 w-2.5 text-gray-400 rotate-90" />
                                    </div>
                                </div>
                                {/* University Email — highlighted as the key verification step */}
                                <div>
                                    <p className="text-[8px] font-medium text-gray-500 mb-0.5">University Email</p>
                                    <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 border border-blue-200 ring-2 ring-blue-100">
                                        <span className="text-[9px] text-gray-800">mjohnson@duke.edu</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Shield className="h-2 w-2 text-blue-500" />
                                        <p className="text-[7px] text-blue-500 font-medium">A valid .edu email is required for verification</p>
                                    </div>
                                </div>
                                {/* Sport */}
                                <div>
                                    <p className="text-[8px] font-medium text-gray-500 mb-0.5">Sport</p>
                                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200 flex justify-between items-center">
                                        <span className="text-[9px] text-gray-800">Tennis</span>
                                        <ChevronRight className="h-2.5 w-2.5 text-gray-400 rotate-90" />
                                    </div>
                                </div>
                                {/* School */}
                                <div>
                                    <p className="text-[8px] font-medium text-gray-500 mb-0.5">School / University</p>
                                    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-200">
                                        <span className="text-[9px] text-gray-800">Duke University</span>
                                    </div>
                                </div>
                                {/* CTA */}
                                <div className="bg-gray-900 text-white text-[10px] font-bold text-center py-2.5 rounded-lg mt-1">
                                    Create Account
                                </div>
                            </div>
                        </PhoneMock>
                    </div>
                </div>
            </SlideWrapper>
        ),
    },

    // 5 — Discover & Connect + demo (matches actual /network page)
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

                    {/* Mini mockup: network discover page (matches /network) */}
                    <PhoneMock>
                        <div className="p-3 space-y-2.5">
                            {/* Search bar */}
                            <div className="flex items-center bg-gray-100/50 rounded-xl px-3 py-2 gap-2">
                                <Search className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] text-gray-400">Search by name, school, sport...</span>
                            </div>
                            {/* Filter dropdowns */}
                            <div className="flex gap-1.5">
                                <div className="flex-1 text-[8px] bg-gray-100/50 text-gray-600 px-2 py-1.5 rounded-lg font-medium text-center border border-gray-200/50">All Sports</div>
                                <div className="flex-1 text-[8px] bg-gray-100/50 text-gray-600 px-2 py-1.5 rounded-lg font-medium text-center border border-gray-200/50">All Industries</div>
                            </div>
                            {/* Athlete cards (matches actual Card styling: rounded-2rem, border, badges) */}
                            {[
                                { name: "Sarah Chen", school: "Stanford", sport: "Tennis", match: 92, initials: "SC", role: "Analyst @ McKinsey" },
                                { name: "Marcus Johnson", school: "Duke", sport: "Tennis", match: 87, initials: "MJ", role: "SWE Intern @ Google" },
                                { name: "Emily Rodriguez", school: "UCLA", sport: "Tennis", match: 74, initials: "ER", role: "Student-Athlete" },
                            ].map((person, i) => (
                                <div key={i} className="relative rounded-2xl border border-gray-200/40 bg-white/80 p-3 space-y-2">
                                    {/* Top badges */}
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-[7px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold border border-blue-100">Verified</span>
                                        <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold border ${person.match >= 80 ? "bg-green-50 text-green-600 border-green-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>{person.match}% Match</span>
                                    </div>
                                    {/* Avatar + info */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                                            <span className="text-[9px] font-bold text-purple-600">{person.initials}</span>
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-[10px] font-bold text-gray-900 truncate">{person.name}</p>
                                            <p className="text-[8px] text-gray-500">{person.role}</p>
                                        </div>
                                    </div>
                                    {/* Sport + school badges */}
                                    <div className="flex gap-1">
                                        <span className="text-[7px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                            <Trophy className="h-2 w-2" />{person.sport}
                                        </span>
                                        <span className="text-[7px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                            <School className="h-2 w-2" />{person.school}
                                        </span>
                                    </div>
                                    {/* CTA button */}
                                    <button className="w-full bg-gray-900 text-white text-[8px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm">
                                        <Send className="h-2.5 w-2.5" />
                                        Send Personal Request
                                    </button>
                                </div>
                            ))}
                        </div>
                    </PhoneMock>
                </div>
            </SlideWrapper>
        ),
    },

    // 6 — Structured Requests + demo (matches actual request form)
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

                    {/* Mini mockup: request form (matches /requests/new) */}
                    <PhoneMock>
                        <div className="p-4 space-y-2.5">
                            {/* Recipient card */}
                            <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
                                    <span className="text-[8px] font-bold text-purple-600">SC</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-gray-900">Sarah Chen</p>
                                    <p className="text-[8px] text-gray-400">Analyst @ McKinsey &middot; Stanford</p>
                                </div>
                            </div>

                            {/* Dropdowns row */}
                            <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                    <p className="text-[8px] font-medium text-gray-500 mb-0.5">Request Type</p>
                                    <div className="bg-gray-50/50 rounded-xl px-2 py-1.5 border border-gray-200/50 flex justify-between items-center">
                                        <span className="text-[8px] text-gray-800">Career Advice</span>
                                        <ChevronRight className="h-2 w-2 text-gray-400 rotate-90" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-medium text-gray-500 mb-0.5">Time Commitment</p>
                                    <div className="bg-gray-50/50 rounded-xl px-2 py-1.5 border border-gray-200/50 flex justify-between items-center">
                                        <span className="text-[8px] text-gray-800">15 min Coffee Chat</span>
                                        <ChevronRight className="h-2 w-2 text-gray-400 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Message textarea */}
                            <div>
                                <p className="text-[8px] font-medium text-gray-500 mb-0.5">Tell Sarah why you&rsquo;re reaching out</p>
                                <div className="bg-gray-50/20 rounded-2xl p-2.5 border border-gray-200/50 text-left min-h-[60px]">
                                    <p className="text-[8px] text-gray-700 leading-relaxed">Hi Sarah! I&rsquo;m a junior tennis player at Duke interested in transitioning into consulting. Would love to hear about your experience at McKinsey and any advice for breaking in...</p>
                                </div>
                            </div>

                            {/* Offer in return */}
                            <div>
                                <p className="text-[8px] font-medium text-gray-500 mb-0.5">What You Offer in Return</p>
                                <div className="bg-gray-50/20 rounded-xl px-2.5 py-1.5 border border-gray-200/50 text-left">
                                    <p className="text-[8px] text-gray-700">I can share my experience with the recruiting process at Duke</p>
                                </div>
                                <p className="text-[6px] text-gray-400 uppercase tracking-wider mt-0.5">Reciprocity builds long-term mentorship</p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1.5 pt-1">
                                <button className="flex-1 border border-gray-200 text-gray-600 text-[8px] font-bold py-2 rounded-xl flex items-center justify-center gap-1">
                                    <Zap className="h-2.5 w-2.5" />
                                    AI Refine Draft
                                </button>
                                <button className="flex-1 bg-gray-900 text-white text-[8px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-lg">
                                    <Send className="h-2.5 w-2.5" />
                                    Send Personal Request
                                </button>
                            </div>
                        </div>
                    </PhoneMock>
                </div>
            </SlideWrapper>
        ),
    },

    // 7 — Messaging + demo (matches actual /messages chat UI)
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

                    {/* Mini mockup: chat screen (matches /messages) */}
                    <PhoneMock>
                        <div className="flex flex-col h-[360px]">
                            {/* Chat header */}
                            <div className="px-3 py-2.5 border-b border-gray-200/50 flex items-center gap-2.5 bg-white">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-purple-600">SC</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-900">Sarah Chen</p>
                                    <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Career Advice</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-3 space-y-2.5 bg-white overflow-hidden">
                                {/* Received — bg-muted, rounded-tl-none, border */}
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none px-3 py-2 max-w-[78%] border border-gray-200/40">
                                        <p className="text-[10px] text-left leading-relaxed">Hey Marcus! Thanks for reaching out. I&rsquo;d love to chat about consulting!</p>
                                        <p className="text-[7px] text-gray-400 mt-1 text-right">2:30 PM</p>
                                    </div>
                                </div>
                                {/* Sent — bg-secondary (dark), rounded-tr-none, white text */}
                                <div className="flex justify-end">
                                    <div className="bg-gray-900 rounded-2xl rounded-tr-none px-3 py-2 max-w-[78%]">
                                        <p className="text-[10px] text-white text-left leading-relaxed">That would be amazing! Are you free this week for a quick call?</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <p className="text-[7px] text-white/50">2:32 PM</p>
                                            <CheckCheck className="h-2.5 w-2.5 text-blue-400" />
                                        </div>
                                    </div>
                                </div>
                                {/* Received */}
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-none px-3 py-2 max-w-[78%] border border-gray-200/40">
                                        <p className="text-[10px] text-left leading-relaxed">Absolutely! Here&rsquo;s my calendar link:</p>
                                        <p className="text-[10px] text-blue-500 text-left underline">calendly.com/sarachen</p>
                                        <p className="text-[7px] text-gray-400 mt-1 text-right">2:33 PM</p>
                                    </div>
                                </div>
                                {/* Typing indicator — matches muted bg, rounded-2xl */}
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-2xl px-3 py-2.5 border border-gray-200/40">
                                        <div className="flex gap-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Input bar — matches actual: paperclip, rounded-xl input, secondary send button */}
                            <div className="px-3 py-2 border-t border-gray-200/50 bg-white flex items-center gap-2">
                                <div className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-gray-100">
                                    <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                                </div>
                                <div className="flex-1 bg-gray-100 rounded-xl px-3 py-2">
                                    <span className="text-[9px] text-gray-400">Type your message...</span>
                                </div>
                                <div className="h-8 w-8 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                                    <Send className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        </div>
                    </PhoneMock>
                </div>
            </SlideWrapper>
        ),
    },

    // 8 — Profile + demo (matches actual /profile page)
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

                    {/* Mini mockup: profile page (matches /profile — bg-[#f4f2ee], white card, rounded-2xl) */}
                    <PhoneMock>
                        <div className="bg-[#f4f2ee] min-h-[360px]">
                            {/* White profile card */}
                            <div className="bg-white rounded-b-2xl overflow-hidden">
                                {/* Cover — gradient banner like actual profile */}
                                <div className="h-20 bg-gradient-to-r from-blue-100 to-cyan-100 relative">
                                    {/* Avatar — matches: border-6, shadow-md, -mt offset */}
                                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                                        <div className="h-14 w-14 rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center shadow-md">
                                            <span className="text-sm font-black text-indigo-600">MJ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 px-4 pb-4 text-center space-y-1.5">
                                    {/* Name + verified badge */}
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-[13px] font-bold text-gray-900">Marcus Johnson</p>
                                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                                    </div>
                                    {/* Headline — matches: role @ company or sport @ school */}
                                    <p className="text-[9px] text-gray-500 font-medium">
                                        Tennis Student-Athlete @ Duke University
                                    </p>
                                    {/* Industry badge — matches: secondary/10 bg, uppercase, tracking-tight */}
                                    <span className="inline-block text-[7px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                        Consulting
                                    </span>
                                    {/* Location + connections — matches actual layout */}
                                    <div className="flex items-center justify-center gap-1.5 text-[8px] text-gray-400">
                                        <MapPin className="h-2.5 w-2.5" />
                                        <span>Durham, NC</span>
                                        <span>&middot;</span>
                                        <span className="font-semibold text-gray-700">12 Connections</span>
                                    </div>

                                    {/* Action buttons — matches: rounded-full, primary CTA, secondary booking */}
                                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                                        <button className="bg-gray-900 text-white text-[8px] font-bold px-4 py-2 rounded-full flex items-center gap-1 shadow-md">
                                            <MessageCircle className="h-2.5 w-2.5" />
                                            Message
                                        </button>
                                        <button className="bg-gray-100 text-gray-700 text-[8px] font-bold px-4 py-2 rounded-full flex items-center gap-1 border border-gray-200">
                                            <Calendar className="h-2.5 w-2.5" />
                                            Book a Meeting
                                        </button>
                                    </div>
                                    {/* Resume + LinkedIn row — matches actual outline buttons */}
                                    <div className="flex justify-center gap-1.5 pt-1">
                                        <button className="text-[7px] text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full flex items-center gap-0.5 font-medium">
                                            <FileText className="h-2 w-2" />
                                            Resume
                                        </button>
                                        <button className="h-5 w-5 rounded-full border border-gray-200 flex items-center justify-center">
                                            <Linkedin className="h-2.5 w-2.5 text-blue-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Experience card — matches: white bg, rounded-2xl on beige bg */}
                            <div className="mx-3 mt-3 bg-white rounded-xl p-3">
                                <p className="text-[9px] font-bold text-gray-900 mb-2">Experience</p>
                                <div className="flex items-start gap-2">
                                    <div className="h-6 w-6 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <Star className="h-3 w-3 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-800">Summer Analyst</p>
                                        <p className="text-[7px] text-gray-400">Deloitte &middot; Summer 2025</p>
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
