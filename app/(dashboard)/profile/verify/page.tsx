import { submitVerification } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function VerifyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="container mx-auto p-4 max-w-xl">
            <Card>
                <CardHeader>
                    <CardTitle>Get Verified</CardTitle>
                    <p className="text-sm text-muted-foreground">Verification builds trust. Please provide details about your athletic career.</p>
                </CardHeader>
                <CardContent>
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Verification Method</label>
                            <select name="verification_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="roster_url">Link to Roster (Preferred)</option>
                                <option value="upload">Upload Proof (Photo/ID)</option>
                                <option value="email">.edu Email Confirmation</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Proof URL</label>
                            <Input name="proof_url" placeholder="https://gostanford.com/sports/..." />
                            <p className="text-xs text-muted-foreground">If uploading, please upload to a host and paste link here (Demo).</p>
                        </div>

                        <Button type="submit" className="w-full">Submit for Review</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
