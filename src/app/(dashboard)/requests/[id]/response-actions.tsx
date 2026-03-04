'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { respondToRequest } from '../actions'
import { Check, X, Share2 } from 'lucide-react'

interface ResponseActionsProps {
    requestId: string
}

export function ResponseActions({ requestId }: ResponseActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [showMessageInput, setShowMessageInput] = useState(false)
    const [selectedAction, setSelectedAction] = useState<'accept' | 'decline' | 'refer' | null>(null)

    const handleResponse = async (responseType: 'accept' | 'decline' | 'refer') => {
        if (!showMessageInput || selectedAction !== responseType) {
            setSelectedAction(responseType)
            setShowMessageInput(true)
            return
        }

        setIsLoading(responseType)
        try {
            const result = await respondToRequest(requestId, responseType, message)
            if (result.success) {
                router.refresh()
            }
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <Button
                    onClick={() => handleResponse('accept')}
                    variant={selectedAction === 'accept' ? 'secondary' : 'outline'}
                    className="flex-col h-auto py-4 gap-2"
                    disabled={isLoading !== null}
                    loading={isLoading === 'accept'}
                >
                    <Check className="h-5 w-5" />
                    <span>Accept</span>
                </Button>
                <Button
                    onClick={() => handleResponse('decline')}
                    variant={selectedAction === 'decline' ? 'secondary' : 'outline'}
                    className="flex-col h-auto py-4 gap-2"
                    disabled={isLoading !== null}
                    loading={isLoading === 'decline'}
                >
                    <X className="h-5 w-5" />
                    <span>Decline</span>
                </Button>
                <Button
                    onClick={() => handleResponse('refer')}
                    variant={selectedAction === 'refer' ? 'secondary' : 'outline'}
                    className="flex-col h-auto py-4 gap-2"
                    disabled={isLoading !== null}
                    loading={isLoading === 'refer'}
                >
                    <Share2 className="h-5 w-5" />
                    <span>Refer</span>
                </Button>
            </div>

            {showMessageInput && selectedAction && (
                <div className="space-y-3 pt-3 border-t animate-fade-in">
                    <label className="text-sm font-medium">
                        {selectedAction === 'accept' && 'Add a message (optional)'}
                        {selectedAction === 'decline' && 'Reason for declining (optional)'}
                        {selectedAction === 'refer' && 'Who are you referring them to?'}
                    </label>
                    <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                            selectedAction === 'accept'
                                ? "Great to connect! Let's schedule a time..."
                                : selectedAction === 'decline'
                                    ? "Unfortunately, I'm not able to help with this..."
                                    : "I think you should reach out to..."
                        }
                        className="min-h-[80px]"
                    />
                    <Button
                        onClick={() => handleResponse(selectedAction)}
                        className="w-full"
                        loading={isLoading === selectedAction}
                        disabled={isLoading !== null}
                    >
                        {selectedAction === 'accept' && 'Confirm & Accept'}
                        {selectedAction === 'decline' && 'Confirm & Decline'}
                        {selectedAction === 'refer' && 'Confirm & Refer'}
                    </Button>
                </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
                {selectedAction === 'accept' && 'You\'ll be connected to continue the conversation'}
                {selectedAction === 'decline' && 'The requester will be notified respectfully'}
                {selectedAction === 'refer' && 'The request will be forwarded with your context'}
                {!selectedAction && 'Select an action to respond to this request'}
            </p>
        </div>
    )
}
