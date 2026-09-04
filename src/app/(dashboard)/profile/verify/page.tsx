import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { VerifyPanel } from "./verify-panel"

export const dynamic = 'force-dynamic'

export default async function VerifyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('school, sport, verification_status')
        .eq('user_id', user.id)
        .maybeSingle()

    return (
        <div className="container mx-auto p-4 max-w-xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-secondary" />
                        Get verified
                    </CardTitle>
                    <CardDescription>
                        Verified athletes build trust and get better responses. This takes a few seconds.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {profile?.verification_status ? (
                        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/40 dark:bg-green-900/20">
                            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-900 dark:text-green-200">You&apos;re already verified</p>
                                <p className="text-sm text-green-800/90 dark:text-green-300/90 mt-0.5">Your profile shows the verified badge.</p>
                            </div>
                        </div>
                    ) : (
                        <VerifyPanel school={profile?.school} sport={profile?.sport} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
