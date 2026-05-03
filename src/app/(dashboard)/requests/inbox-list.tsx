"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Inbox } from "lucide-react"
import { AthleteConnectionCard } from "./athlete-connection-card"
import { respondToRequest } from "./actions"

type AnyRequest = {
    id: string
    request_type: string
    context: string
    time_commitment: string
    created_at: string
    users?: any
}

interface InboxListProps {
    initialRequests: AnyRequest[]
    currentUserProfile?: any
    showHeader: boolean
    showEmptyState: boolean
}

export function InboxList({ initialRequests, currentUserProfile, showHeader, showEmptyState }: InboxListProps) {
    const router = useRouter()
    const [requests, setRequests] = useState<AnyRequest[]>(initialRequests)
    const [, startTransition] = useTransition()

    const removeFromList = (id: string) => {
        setRequests((prev) => prev.filter((r) => r.id !== id))
    }

    const handleAction = async (id: string, action: "accept" | "decline") => {
        const previous = requests
        removeFromList(id)
        const verb = action === "accept" ? "Accepted" : "Passed"
        toast.success(verb)

        const result = await respondToRequest(id, action)
        if ("error" in result && result.error) {
            // Roll back on failure.
            setRequests(previous)
            toast.error("Couldn't update request — please try again.")
            return
        }
        // Refresh server data so derived counts (sent/received) stay in sync.
        startTransition(() => router.refresh())
    }

    if (requests.length === 0) {
        if (!showEmptyState) return null
        return (
            <Card className="bg-slate-50 border-none shadow-none">
                <CardContent className="py-16 text-center flex flex-col items-center">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-slate-100">
                        📬
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No incoming requests</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-1">
                        When someone sends you a connection request, it will appear here.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            {showHeader && (
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Inbox className="h-3.5 w-3.5" />
                    Incoming Requests ({requests.length})
                </h2>
            )}
            {requests.map((request) => (
                <AthleteConnectionCard
                    key={request.id}
                    request={request}
                    currentUserProfile={currentUserProfile}
                    onAccept={() => handleAction(request.id, "accept")}
                    onPass={() => handleAction(request.id, "decline")}
                />
            ))}
        </>
    )
}
