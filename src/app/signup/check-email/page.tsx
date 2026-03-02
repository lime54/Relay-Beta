import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function CheckEmailPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                        <Mail className="h-6 w-6 text-secondary" />
                    </div>
                    <CardTitle className="text-2xl">Check Your Email</CardTitle>
                    <CardDescription>
                        We&apos;ve sent you a confirmation link
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                        Please check your email inbox and click the verification link to activate your account.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        If you don&apos;t see the email, check your spam folder.
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button asChild variant="outline">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
