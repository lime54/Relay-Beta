'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"

interface ProfileSidebarProps {
    userId: string
    userName?: string
}

export function ProfileSidebar({ userId, userName }: ProfileSidebarProps) {
    const [copied, setCopied] = useState(false)

    // Build the profile URL
    const profilePath = `/profile/${userId}`
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const fullProfileUrl = `${siteUrl}${profilePath}`

    // Generate a display-friendly slug from the name
    const displaySlug = userName
        ? userName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : userId.substring(0, 8)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullProfileUrl)
            setCopied(true)
            toast.success('Profile link copied!')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Failed to copy link')
        }
    }

    return (
        <div className="space-y-6">
            {/* Profile Link Card */}
            <Card className="bg-white dark:bg-card border-none shadow-sm rounded-xl">
                <CardContent className="p-5">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">Public Profile</h3>
                        <Link href={profilePath}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/50 rounded-full">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Share your verified athlete profile with recruiters.</p>
                    <div className="bg-muted/30 p-2.5 rounded-lg text-sm font-mono truncate flex justify-between items-center gap-2">
                        <Link 
                            href={profilePath} 
                            className="text-secondary hover:underline truncate"
                        >
                            relay/{displaySlug}
                        </Link>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2.5 text-xs shrink-0"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <><Check className="h-3 w-3 mr-1 text-green-500" /> Copied</>
                            ) : (
                                <><Copy className="h-3 w-3 mr-1" /> Copy</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Relay Pro Promo */}
            <Card className="bg-gradient-to-br from-[#1a1f2c] to-[#2d3748] text-white border-none shadow-lg rounded-xl sticky top-24 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <CardContent className="p-6 relative z-10">
                    <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                        <span className="text-xl">🚀</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Relay Pro</h3>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                        Unlock advanced analytics, unlimited requests, and priority support.
                    </p>
                    <Link href="/pro">
                        <Button className="w-full bg-white text-black hover:bg-gray-100 font-semibold rounded-lg shadow-sm">
                            Upgrade Now
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
