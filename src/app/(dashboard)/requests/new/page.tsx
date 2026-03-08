import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { RequestForm } from "./request-form"

export default function NewRequestPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">New Request</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Send a request to any athlete in the network. You can also browse the{" "}
                        <a href="/network" className="text-secondary hover:underline font-medium">Network</a>{" "}
                        to find and connect with specific people.
                    </p>
                </CardHeader>
                <CardContent>
                    <RequestForm />
                </CardContent>
            </Card>
        </div>
    )
}
