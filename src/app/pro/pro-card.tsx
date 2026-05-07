"use client"

import { useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { RELAY_PRO_PRICING } from "@/lib/pricing"
import { ProUpgradeCTA } from "./pro-upgrade-cta"

export function ProCard() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
    const monthly = RELAY_PRO_PRICING.monthly
    const yearly = RELAY_PRO_PRICING.yearly

    const price = billingCycle === "yearly" ? `$${yearly.equivalentMonthly}` : monthly.label
    const period = "month"
    const isYearly = billingCycle === "yearly"

    return (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 flex flex-col relative shadow-xl shadow-slate-900/20 ring-1 ring-white/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col flex-1">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Relay Pro
                            <Sparkles className="h-5 w-5 text-yellow-400" />
                        </h2>
                        <p className="text-sm text-white/70 mt-1">For athletes who are serious about their next chapter.</p>
                    </div>
                </div>

                {/* Billing toggle */}
                <div className="flex items-center gap-2 mb-6 bg-white/10 rounded-full p-1 self-start">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            !isYearly ? "bg-white text-slate-900 shadow-sm" : "text-white/70 hover:text-white"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            isYearly ? "bg-white text-slate-900 shadow-sm" : "text-white/70 hover:text-white"
                        }`}
                    >
                        Yearly
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-yellow-400/20 text-yellow-600 px-1.5 py-0.5 rounded-full">
                            Save {yearly.savingsPct}%
                        </span>
                    </button>
                </div>

                <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">{price}</span>
                        <span className="text-sm text-white/60">/ {period}</span>
                    </div>
                </div>
                <p className="text-xs text-white/60 mb-6">
                    {isYearly
                        ? `${yearly.label} billed annually`
                        : `or ${yearly.label}/year ($${yearly.equivalentMonthly}/mo) — save ${yearly.savingsPct}%`
                    }
                </p>

                <ul className="space-y-3 text-sm mb-8 flex-1">
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Unlimited outbound requests</li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Priority placement in network search</li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Advanced verification badge</li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Profile analytics + view tracking</li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Google Calendar integration</li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Priority email support</li>
                </ul>

                <ProUpgradeCTA plan={billingCycle} />
                <p className="text-[11px] text-white/50 text-center mt-3">
                    Cancel anytime. No long-term commitment.
                </p>
            </div>
        </div>
    )
}
