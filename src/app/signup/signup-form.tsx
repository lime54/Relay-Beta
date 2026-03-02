'use client'

import { signup } from '@/app/auth/actions'
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
                    Creating Account...
                </>
            ) : (
                "Create Account"
            )}
        </Button>
    )
}

export default function SignupForm() {
    const [captchaToken, setCaptchaToken] = useState<string>('')

    return (
        <form action={signup} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input id="name" name="name" type="text" required placeholder="Your full name" />
            </div>
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" name="email" type="email" required placeholder="you@university.edu" />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input id="password" name="password" type="password" required placeholder="Create a password" />
            </div>
            <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">I am a...</label>
                <select
                    id="role"
                    name="role"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                    defaultValue=""
                >
                    <option value="" disabled>Select your role</option>
                    <option value="student">Current Student-Athlete</option>
                    <option value="alum">Former Student-Athlete (Alumni)</option>
                </select>
            </div>
            <div className="space-y-2">
                <label htmlFor="sport" className="text-sm font-medium">Sport</label>
                <select
                    id="sport"
                    name="sport"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                    defaultValue=""
                >
                    <option value="" disabled>Select your sport</option>
                    <option value="Squash">Squash</option>
                    <option value="Tennis">Tennis</option>
                    <option value="Golf">Golf</option>
                </select>
            </div>
            <div className="space-y-2">
                <label htmlFor="school" className="text-sm font-medium">School / University</label>
                <Input id="school" name="school" type="text" required placeholder="e.g. Yale University" />
            </div>

            <Captcha onVerify={setCaptchaToken} />
            <input type="hidden" name="captchaToken" value={captchaToken} />

            <SubmitButton disabled={!captchaToken} />
        </form>
    )
}
