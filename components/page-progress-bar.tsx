'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export function PageProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)

    useEffect(() => {
        setIsNavigating(true)
        const timer = setTimeout(() => setIsNavigating(false), 500)
        return () => clearTimeout(timer)
    }, [pathname, searchParams])

    return (
        <AnimatePresence>
            {isNavigating && (
                <motion.div
                    initial={{ width: '0%', opacity: 1 }}
                    animate={{ width: '100%', opacity: [1, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{
                        width: { duration: 0.5, ease: "easeOut" },
                        opacity: { duration: 0.3, delay: 0.4 }
                    }}
                    className="fixed top-0 left-0 h-1 bg-secondary z-[9999] shadow-[0_0_10px_rgba(var(--secondary),0.5)]"
                />
            )}
        </AnimatePresence>
    )
}
