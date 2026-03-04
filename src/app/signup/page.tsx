import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import Link from 'next/link'
import SignupForm from './signup-form'

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const params = await searchParams

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Join the Team</CardTitle>
                    <CardDescription>
                        Create your Relay account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {params.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                            {params.error}
                        </div>
                    )}
                    <SignupForm />
                </CardContent>
                <CardFooter className="justify-center flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-secondary hover:underline font-medium">Sign In</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
