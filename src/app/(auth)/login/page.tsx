import Link from 'next/link'
import LoginForm from './login-form'
import { LoginShell } from './login-shell'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
    const params = await searchParams

    return (
        <LoginShell>
            {/* Form card */}
            <div className="w-full max-w-md mx-auto space-y-8">
                {/* Mobile logo — visible only on small screens */}
                <div className="flex items-center justify-center gap-3 lg:hidden">
                    <img src="/relay-logo.png" alt="Relay" className="h-9 w-auto" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded-md self-end mb-0.5">beta</span>
                </div>

                <div className="space-y-2 text-center lg:text-left">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-muted-foreground">
                        Sign in to continue to Relay
                    </p>
                </div>

                {params.error && (
                    <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm rounded-xl">
                        {params.error}
                    </div>
                )}
                {params.message && (
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm rounded-xl">
                        {params.message}
                    </div>
                )}

                <LoginForm />

                <p className="text-sm text-center text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-secondary hover:underline font-semibold">
                        Join the Team
                    </Link>
                </p>
            </div>
        </LoginShell>
    )
}
