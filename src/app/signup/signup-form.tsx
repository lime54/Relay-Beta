'use client'

import { signup } from '@/app/auth/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from 'react'
import Captcha from '@/components/captcha'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

const fieldClass =
    "bg-white/10 border-white/20 text-white placeholder:text-white/45 focus-visible:ring-white/40 rounded-xl h-11"

const selectClass =
    "flex h-11 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white ring-offset-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 cursor-pointer appearance-none"

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            className="w-full h-12 rounded-xl font-bold bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/30"
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
    const [role, setRole] = useState<string>('')
    const isAlum = role === 'alum'

    return (
        <form action={signup} className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-white/90">Full Name</label>
                <Input id="name" name="name" type="text" required placeholder="Your full name" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="role" className="text-sm font-medium text-white/90">I am a...</label>
                <select
                    id="role"
                    name="role"
                    required
                    className={selectClass}
                    value={role}
                    onChange={e => setRole(e.target.value)}
                >
                    <option value="" disabled className="text-black">Select your role</option>
                    <option value="student" className="text-black">Current Student-Athlete</option>
                    <option value="alum" className="text-black">Former Student-Athlete (Alumni)</option>
                </select>
            </div>
            <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-white/90">{isAlum ? 'Email' : 'University Email'}</label>
                <Input id="email" name="email" type="email" required placeholder={isAlum ? 'you@email.com' : 'you@university.edu'} className={fieldClass} />
                <p className="text-[11px] text-white/60">
                    {isAlum
                        ? 'You can use any email address. Alumni are verified separately.'
                        : <>A valid <strong className="text-white/80">.edu</strong> email is required to join Relay. This is how we verify your school affiliation.</>}
                </p>
            </div>
            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-white/90">Password</label>
                <Input id="password" name="password" type="password" required placeholder="Create a password" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="sport" className="text-sm font-medium text-white/90">Sport</label>
                <select
                    id="sport"
                    name="sport"
                    required
                    className={selectClass}
                    defaultValue=""
                >
                    <option value="" disabled className="text-black">Select your sport</option>
                    <option value="Baseball" className="text-black">Baseball</option>
                    <option value="Basketball" className="text-black">Basketball</option>
                    <option value="Cross Country" className="text-black">Cross Country</option>
                    <option value="Fencing" className="text-black">Fencing</option>
                    <option value="Field Hockey" className="text-black">Field Hockey</option>
                    <option value="Football" className="text-black">Football</option>
                    <option value="Golf" className="text-black">Golf</option>
                    <option value="Gymnastics" className="text-black">Gymnastics</option>
                    <option value="Ice Hockey" className="text-black">Ice Hockey</option>
                    <option value="Lacrosse" className="text-black">Lacrosse</option>
                    <option value="Rowing" className="text-black">Rowing</option>
                    <option value="Rugby" className="text-black">Rugby</option>
                    <option value="Sailing" className="text-black">Sailing</option>
                    <option value="Skiing" className="text-black">Skiing</option>
                    <option value="Soccer" className="text-black">Soccer</option>
                    <option value="Softball" className="text-black">Softball</option>
                    <option value="Squash" className="text-black">Squash</option>
                    <option value="Swimming & Diving" className="text-black">Swimming &amp; Diving</option>
                    <option value="Tennis" className="text-black">Tennis</option>
                    <option value="Track & Field" className="text-black">Track &amp; Field</option>
                    <option value="Volleyball" className="text-black">Volleyball</option>
                    <option value="Water Polo" className="text-black">Water Polo</option>
                    <option value="Wrestling" className="text-black">Wrestling</option>
                    <option value="Other" className="text-black">Other</option>
                </select>
            </div>
            <div className="space-y-1.5">
                <label htmlFor="school" className="text-sm font-medium text-white/90">School / University</label>
                <Input id="school" name="school" type="text" required placeholder="e.g. Yale University" className={fieldClass} />
            </div>

            <Captcha onVerify={setCaptchaToken} />
            <input type="hidden" name="captchaToken" value={captchaToken} />

            <SubmitButton disabled={!captchaToken} />
        </form>
    )
}
