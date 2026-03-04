import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import Link from 'next/link'

export default function SignupConfirmedPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
                    <CardDescription>
                        Your email has been successfully verified.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                        Your account is now active. You can proceed to login and access your dashboard.
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button asChild className="w-full">
                        <Link href="/login">Continue to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
