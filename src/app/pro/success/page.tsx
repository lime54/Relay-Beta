"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProSuccessPage() {
    const router = useRouter()

    useEffect(() => {
        // Auto-redirect to dashboard after 5 seconds
        const timer = setTimeout(() => router.push("/dashboard"), 5000)
        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-background">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="text-center py-20 px-6 space-y-6 max-w-lg"
            >
                <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-400/30"
                >
                    <Sparkles className="h-10 w-10 text-white" />
                </motion.div>

                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome to Relay Pro!
                </h1>

                <p className="text-muted-foreground max-w-md mx-auto">
                    You now have unlimited requests, priority placement, profile analytics, and everything else Pro has to offer. Time to make your next move.
                </p>

                <Button
                    onClick={() => router.push("/dashboard")}
                    className="rounded-full px-8 h-12 text-base font-semibold gap-2"
                >
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground">
                    You&apos;ll be redirected automatically in a few seconds.
                </p>
            </motion.div>
        </div>
    )
}
