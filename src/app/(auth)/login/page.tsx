import Link from 'next/link'
import LoginForm from './login-form'
import { AuthShell } from '@/components/auth-shell'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
    const params = await searchParams

    return (
        <AuthShell>
            <div className="flex items-center justify-center gap-2.5 mb-5">
                <img src="/relay-logo.png" alt="Relay" className="h-8 w-auto brightness-0 invert" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 bg-white/10 px-1.5 py-0.5 rounded-md self-end mb-1">beta</span>
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-sm text-white/70 mt-1">Sign in to continue to Relay</p>
            </div>

            {params.error && (
                <div className="mb-4 p-3 bg-red-500/15 border border-red-400/30 text-red-100 text-sm rounded-xl">
                    {params.error}
                </div>
            )}
            {params.message && (
                <div className="mb-4 p-3 bg-green-500/15 border border-green-400/30 text-green-100 text-sm rounded-xl">
                    {params.message}
                </div>
            )}

            <LoginForm />

            <p className="text-sm text-white/70 text-center mt-6">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-white font-semibold hover:underline">Join the Team</Link>
            </p>
        </AuthShell>
    )
}
