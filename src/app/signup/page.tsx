import Link from 'next/link'
import SignupForm from './signup-form'
import { AuthShell } from '@/components/auth-shell'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const params = await searchParams

    return (
        <AuthShell>
            <div className="flex items-center justify-center mb-5">
                <img src="/relay-logo.png" alt="Relay" className="h-8 w-auto brightness-0 invert" />
            </div>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Join the Team</h1>
                <p className="text-sm text-white/70 mt-1">Create your Relay account to get started</p>
            </div>

            {params.error && (
                <div className="mb-4 p-3 bg-red-500/15 border border-red-400/30 text-red-100 text-sm rounded-xl">
                    {params.error}
                </div>
            )}

            <SignupForm />

            <p className="text-sm text-white/70 text-center mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-white font-semibold hover:underline">Sign In</Link>
            </p>
        </AuthShell>
    )
}
