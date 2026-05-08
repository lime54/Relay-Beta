'use client'

import { WaveBackground } from "@/components/wave-background"

export function LoginShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding + waves (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden flex-col justify-between p-12">
                <WaveBackground className="absolute inset-0 text-primary-foreground pointer-events-none" />

                {/* Top: logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <img src="/relay-logo.png" alt="Relay" className="h-10 w-auto brightness-0 invert" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/50 bg-white/10 px-1.5 py-0.5 rounded-md">
                        beta
                    </span>
                </div>

                {/* Centre: tagline */}
                <div className="relative z-10 space-y-4 max-w-md">
                    <h2 className="text-4xl font-bold tracking-tight text-primary-foreground leading-tight">
                        Your network is your&nbsp;net&nbsp;worth.
                    </h2>
                    <p className="text-primary-foreground/60 text-lg leading-relaxed">
                        Connect with fellow student-athletes, build professional relationships, and unlock career opportunities.
                    </p>
                </div>

                {/* Bottom: subtle footer */}
                <p className="relative z-10 text-primary-foreground/30 text-xs">
                    &copy; {new Date().getFullYear()} Relay. Built for athletes, by athletes.
                </p>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
                {children}
            </div>
        </div>
    )
}
