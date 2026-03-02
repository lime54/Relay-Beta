import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Check, X, ShieldCheck, Trophy, GraduationCap } from "lucide-react"
import Link from "next/link"

type AthleteProfile = {
    school: string
    sport: string
    graduation_year?: string
    level?: string // e.g. D1, D3
}

type User = {
    name: string
    athlete_profiles?: AthleteProfile
}

type Request = {
    id: string
    request_type: string
    context: string
    time_commitment: string
    created_at: string
    users?: User
}

type Overlap = {
    type: 'school' | 'sport' | 'location'
    label: string
    icon: React.ReactNode
}

interface AthleteConnectionCardProps {
    request: Request
    currentUserProfile?: AthleteProfile // To calculate overlap
}

export function AthleteConnectionCard({ request, currentUserProfile }: AthleteConnectionCardProps) {
    const requester = request.users
    const profile = requester?.athlete_profiles
    const isVerified = true // Assuming all users in this view are verified for now

    // Calculate Overlaps (Mock logic for now, utilizing props if available)
    const overlaps: Overlap[] = []

    // 1. School Overlap
    if (currentUserProfile?.school && profile?.school && currentUserProfile.school === profile.school) {
        overlaps.push({
            type: 'school',
            label: 'Fellow Alumni',
            icon: <GraduationCap className="h-3 w-3" />
        })
    }

    // 2. Sport Overlap
    if (currentUserProfile?.sport && profile?.sport && currentUserProfile.sport === profile.sport) {
        overlaps.push({
            type: 'sport',
            label: 'Same Sport',
            icon: <Trophy className="h-3 w-3" />
        })
    }

    // Default overlap for demo if none matches (to show UI)
    if (overlaps.length === 0 && profile?.sport) {
        overlaps.push({
            type: 'sport',
            label: `${profile.sport} Athlete`,
            icon: <Trophy className="h-3 w-3" />
        })
    }

    return (
        <Card className="group overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-all bg-white mb-4">
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                    {/* A. The "Jersey" (Identity) */}
                    <div className="w-full sm:w-[180px] bg-slate-50 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0">
                        <div className="relative mb-3">
                            <div className="h-16 w-16 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xl font-bold text-slate-400 shadow-sm">
                                {requester?.name?.charAt(0) || '?'}
                            </div>
                            {/* School Logo Indicator (Mock) */}
                            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-900 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                                {profile?.school?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-center gap-1">
                                {requester?.name}
                                {isVerified && <ShieldCheck className="h-3 w-3 text-blue-500" />}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {profile?.school || 'Unknown School'}
                            </p>
                        </div>
                    </div>

                    {/* B. The "Stats" & "Ask" */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                            {/* Header & Overlap */}
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                <div className="flex flex-wrap gap-2">
                                    {overlaps.map((overlap, i) => (
                                        <Badge key={i} variant="warning" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 flex items-center gap-1.5 px-2.5 py-0.5">
                                            {overlap.icon}
                                            {overlap.label}
                                        </Badge>
                                    ))}
                                    {profile?.graduation_year && (
                                        <Badge variant="outline" className="text-slate-500 border-slate-200 font-normal">
                                            Class of {profile.graduation_year}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-xs font-medium text-slate-400 flex items-center gap-1 uppercase tracking-wide">
                                    {request.request_type.replace('_', ' ')}
                                </div>
                            </div>

                            {/* The Ask Context */}
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    &quot;{request.context}&quot;
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                                    <Clock className="h-3 w-3" />
                                    <span>Requesting: {request.time_commitment || '15 mins'}</span>
                                </div>
                            </div>
                        </div>

                        {/* D. Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 border-t border-slate-50 sm:border-t-0 sm:pt-0">
                            <Link href={`/requests/${request.id}`} className="w-full sm:w-auto">
                                <Button variant="ghost" size="sm" className="w-full sm:w-auto text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                                    <X className="h-4 w-4 mr-1.5" />
                                    Pass
                                </Button>
                            </Link>
                            <Link href={`/requests/${request.id}`} className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-sm ring-1 ring-slate-900/10">
                                    <Check className="h-4 w-4 mr-1.5" />
                                    Accept Request
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
