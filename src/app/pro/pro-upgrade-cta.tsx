"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"

interface ProUpgradeCTAProps {
    variant?: "dark" | "light"
    plan?: "monthly" | "yearly"
}

export function ProUpgradeCTA({ variant = "dark", plan = "monthly" }: ProUpgradeCTAProps) {
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || "Something went wrong")
                return
            }

            // Redirect to Stripe Checkout
            window.location.href = data.url
        } catch {
            toast.error("Failed to start checkout. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const base = "h-12 px-6 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-colors w-full"
    const styles = variant === "light"
        ? "bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/10"
        : "bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-black/10"

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`${base} ${styles} ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="h-4 w-4 text-yellow-500" />
            )}
            {loading ? "Redirecting..." : "Start Pro trial"}
        </button>
    )
}
