import Link from "next/link"
import Navbar from "@/components/navbar"
import { ProUpgradeCTA } from "./pro-upgrade-cta"
import { ProCard } from "./pro-card"
import { ProFAQ } from "./pro-faq"
import { Check, X, Sparkles, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

type FeatureRow = {
    name: string
    description?: string
    free: boolean | string
    pro: boolean | string
}

const FEATURES: { section: string; rows: FeatureRow[] }[] = [
    {
        section: "Networking",
        rows: [
            { name: "Verified athlete profile", free: true, pro: true },
            { name: "Browse the athlete network", free: true, pro: true },
            { name: "Outbound connection requests", free: "5 / month", pro: "Unlimited" },
            { name: "Priority placement in network search", free: false, pro: true },
            { name: "See who viewed your profile", free: false, pro: true },
        ],
    },
    {
        section: "Trust & verification",
        rows: [
            { name: ".edu / roster verification", free: true, pro: true },
            { name: "Advanced verification badge", description: "Manually reviewed proof + peer vouch", free: false, pro: true },
            { name: "Peer vouches displayed on profile", free: "Up to 1", pro: "Unlimited" },
        ],
    },
    {
        section: "Tools for growth",
        rows: [
            { name: "AI request drafting", free: "Basic", pro: "Advanced + tone presets" },
            { name: "Profile analytics", description: "Views, request acceptance rate, response time", free: false, pro: true },
            { name: "Calendar integration (Google Calendar)", free: false, pro: true },
            { name: "Outcome tracking dashboard", free: "Basic", pro: "Detailed" },
        ],
    },
    {
        section: "Support",
        rows: [
            { name: "Help center & community", free: true, pro: true },
            { name: "Priority email support", free: false, pro: true },
        ],
    },
]

function FeatureCell({ value }: { value: boolean | string }) {
    if (value === true) {
        return (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3.5 w-3.5" />
            </span>
        )
    }
    if (value === false) {
        return (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-400">
                <X className="h-3.5 w-3.5" />
            </span>
        )
    }
    return <span className="text-sm text-slate-700 font-medium">{value}</span>
}

export default function ProPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navbar />

            <main className="flex-grow">
                {/* Hero */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold uppercase tracking-wider mb-6">
                                <Sparkles className="h-3.5 w-3.5" />
                                Relay Pro
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight mb-6 text-slate-900">
                                Upgrade to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Relay Pro</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                                Get unlimited outreach, priority placement, and the tools serious student-athletes use to land interviews, internships, and offers — faster.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Plan cards */}
                <section className="container mx-auto px-4 pb-12">
                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Free */}
                        <div className="rounded-3xl border border-border bg-card p-8 flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Free</h2>
                                <p className="text-sm text-muted-foreground mt-1">Build your verified profile and start connecting.</p>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-slate-900">$0</span>
                                    <span className="text-sm text-muted-foreground">/ forever</span>
                                </div>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-700 mb-8 flex-1">
                                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> Verified athlete profile</li>
                                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> 5 outbound requests / month</li>
                                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> Browse the athlete network</li>
                                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> Basic AI request drafting</li>
                            </ul>
                            <Link href="/dashboard">
                                <button className="w-full h-12 rounded-xl border border-border bg-background text-foreground font-semibold hover:bg-muted transition-colors">
                                    Continue with Free
                                </button>
                            </Link>
                        </div>

                        {/* Pro */}
                        <ProCard />
                    </div>
                </section>

                {/* Comparison table */}
                <section className="container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">Compare plans</h2>
                        <p className="text-center text-muted-foreground mb-10">Everything you get with Free vs. Relay Pro.</p>

                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <div className="grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_160px_160px] bg-muted/40 px-6 py-4 border-b border-border text-xs font-bold uppercase tracking-wider text-slate-500">
                                <div>Feature</div>
                                <div className="text-center">Free</div>
                                <div className="text-center">Pro</div>
                            </div>
                            {FEATURES.map((section) => (
                                <div key={section.section}>
                                    <div className="px-6 py-3 bg-slate-50/50 border-b border-border">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{section.section}</h3>
                                    </div>
                                    {section.rows.map((row, i) => (
                                        <div
                                            key={row.name}
                                            className={`grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_160px_160px] px-6 py-4 items-center ${i !== section.rows.length - 1 ? "border-b border-border/50" : "border-b border-border"}`}
                                        >
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">{row.name}</div>
                                                {row.description && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">{row.description}</div>
                                                )}
                                            </div>
                                            <div className="flex justify-center"><FeatureCell value={row.free} /></div>
                                            <div className="flex justify-center"><FeatureCell value={row.pro} /></div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="container mx-auto px-4 py-16 border-t border-border">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold text-center text-slate-900 mb-3">Frequently asked questions</h2>
                        <p className="text-center text-muted-foreground mb-10">Still curious? We&apos;ve got answers.</p>
                        <ProFAQ />
                    </div>
                </section>

                {/* Final CTA */}
                <section className="bg-slate-900 text-white">
                    <div className="container mx-auto px-4 py-20 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to play at the next level?</h2>
                        <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
                            Join the athletes already using Relay Pro to land interviews, internships, and offers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <ProUpgradeCTA variant="light" />
                            <Link href="/dashboard">
                                <button className="h-12 px-6 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold inline-flex items-center gap-2 transition-colors">
                                    Back to dashboard
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
