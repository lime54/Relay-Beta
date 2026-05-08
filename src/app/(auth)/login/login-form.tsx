'use client'

import { login } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from 'react'
import Captcha from '@/components/captcha'
import { useFormStatus } from 'react-dom'
import { Loader2, Mail, Lock } from 'lucide-react'

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            className="w-full h-12 rounded-xl font-bold text-sm"
            disabled={disabled || pending}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                </>
            ) : (
                "Sign In"
            )}
        </Button>
    )
}

export default function LoginForm() {
    const [captchaToken, setCaptchaToken] = useState<string>('')

    return (
        <form action={login} className="space-y-5">
            <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@university.edu"
                        className="h-12 pl-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="h-12 pl-10 rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors"
                    />
                </div>
            </div>

            <Captcha onVerify={setCaptchaToken} />
            <input type="hidden" name="captchaToken" value={captchaToken} />

            <SubmitButton disabled={!captchaToken} />
        </form>
    )
}
