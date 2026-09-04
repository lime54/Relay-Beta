import { FloatingPathsBackground } from '@/components/ui/floating-paths'

/**
 * Centered glassmorphic card floating over the animated FloatingPaths
 * background. Shared by the signup and login pages.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
            <FloatingPathsBackground />
            <div className="relative z-10 w-full max-w-md">
                <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8 sm:p-9 text-white">
                    {children}
                </div>
            </div>
        </div>
    )
}
