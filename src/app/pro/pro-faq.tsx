"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQS: { q: string; a: string }[] = [
    {
        q: "Can I cancel anytime?",
        a: "Yes. You can cancel your Relay Pro subscription at any time from your account settings — your Pro features stay active until the end of the billing period, with no extra charges.",
    },
    {
        q: "Is there a student discount?",
        a: "Relay is built for student-athletes, so the standard price already reflects that. We offer a separate annual plan that works out to roughly $6.58 / month — a ~27% discount over monthly billing.",
    },
    {
        q: "What happens to my data if I downgrade?",
        a: "Nothing is deleted. Your profile, connections, and message history stay intact. You'll just lose access to Pro-only features (analytics, unlimited requests, priority placement) until you upgrade again.",
    },
    {
        q: "Do alumni and current athletes pay the same price?",
        a: "Yes. Pro pricing is the same for current student-athletes and alumni. Verification tier is based on your athletic background, not your subscription level.",
    },
    {
        q: "Will my requests count reset when I upgrade mid-month?",
        a: "Pro removes the monthly outbound request limit entirely the moment you upgrade — there's nothing to reset. If you downgrade later, the Free tier limit applies starting the next billing cycle.",
    },
    {
        q: "How does the verification badge work?",
        a: "Pro members get an enhanced verification badge after a manual review of proof documents (roster screenshot, team photo, or commitment letter) plus a peer vouch from a verified teammate. Free members keep their automated .edu / roster verification.",
    },
]

export function ProFAQ() {
    const [open, setOpen] = useState<number | null>(0)

    return (
        <div className="space-y-3">
            {FAQS.map((item, i) => {
                const isOpen = open === i
                return (
                    <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : i)}
                            className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-muted/30 transition-colors"
                            aria-expanded={isOpen}
                        >
                            <span className="font-semibold text-slate-900 text-sm">{item.q}</span>
                            <ChevronDown
                                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                        {isOpen && (
                            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                                {item.a}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
