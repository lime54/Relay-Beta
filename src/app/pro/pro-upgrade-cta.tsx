"use client"

import { toast } from "sonner"
import { Sparkles } from "lucide-react"

export function ProUpgradeCTA({ variant = "dark" }: { variant?: "dark" | "light" }) {
    const handleClick = () => {
        // TODO: Stripe integration — wire to checkout session creation.
        console.log("TODO: Stripe integration")
        toast("Pro is coming soon", {
            description: "We'll email you the moment trials open up.",
        })
    }

    const base = "h-12 px-6 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-colors w-full"
    const styles = variant === "light"
        ? "bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10"
        : "bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-black/10"

    return (
        <button onClick={handleClick} className={`${base} ${styles}`}>
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Start Pro trial
        </button>
    )
}
