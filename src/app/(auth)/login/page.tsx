import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import Link from 'next/link'
import LoginForm from './login-form'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
    const params = await searchParams

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to continue to Relay
                    </CardDescription>
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
                    <LoginForm />
                </CardContent>
                <CardFooter className="justify-center flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account? <Link href="/signup" className="text-secondary hover:underline font-medium">Join the Team</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

