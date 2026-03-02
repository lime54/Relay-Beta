'use client'

import { login } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from 'react'
import Captcha from '@/components/captcha'

export default function LoginForm() {
    const [captchaToken, setCaptchaToken] = useState<string>('')

    return (
        <form className="space-y-4">
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

            <Button formAction={login} className="w-full" disabled={!captchaToken}>Sign In</Button>
        </form>
    )
}
