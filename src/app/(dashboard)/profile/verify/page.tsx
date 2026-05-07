import { submitVerification } from './actions'
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SubmitButton } from "@/components/submit-button"

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const params = await searchParams

    return (
        <div className="container mx-auto p-4 max-w-xl">
            <Card>
                <CardHeader>
                    <CardTitle>Get Verified</CardTitle>
                    <p className="text-sm text-muted-foreground">Verification builds trust. Please provide details about your athletic career.</p>
                </CardHeader>
                <CardContent>
                    {params.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                            {params.error}
                        </div>
                    )}
                    {params.message && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
                            {params.message}
                        </div>
                    )}
                    <form action={submitVerification} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-medium">School</label>
                            <Input name="school" required placeholder="University of..." />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Sport</label>
                            <Input name="sport" required placeholder="Swimming, Football, etc." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">NCAA Level</label>
                                <select name="ncaa_level" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="D1">Division 1</option>
                                    <option value="D2">Division 2</option>
                                    <option value="D3">Division 3</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Years Active</label>
                                <Input name="years_active" placeholder="2020-2024" />
                            </div>
                        </div>

                        <input type="hidden" name="verification_type" value="roster_url" />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Link to Online Roster</label>
                            <Input name="proof_url" required placeholder="https://gostanford.com/sports/..." />
                            <p className="text-xs text-muted-foreground">Paste the link to your team's official roster page where your name appears.</p>
                        </div>

                        <SubmitButton className="w-full" loadingText="Submitting...">Submit for Review</SubmitButton>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
