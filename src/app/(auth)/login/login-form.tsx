'use client'

import { login } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from 'react'
import Captcha from '@/components/captcha'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            className="w-full"
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
        <form action={login} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" name="email" type="email" required placeholder="you@university.edu" />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input id="password" name="password" type="password" required />
            </div>

            <Captcha onVerify={setCaptchaToken} />
            <input type="hidden" name="captchaToken" value={captchaToken} />

            <SubmitButton disabled={!captchaToken} />
        </form>
    )
}
