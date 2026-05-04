'use client'

import { useRef, useState, useOptimistic, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, ShieldCheck, MapPin, Camera, Trash2, Loader2 } from "lucide-react"
import { updateProfileImage, removeProfileImage } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ImageCropper } from "./image-cropper"
import { motion, AnimatePresence } from "framer-motion"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { RequestForm } from "@/app/(dashboard)/requests/new/request-form"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { cn } from "@/lib/utils"
import { SimilarityScore } from "@/components/profile/similarity-score"
import { ResumeDialog } from "@/components/profile/resume-dialog"
import { Linkedin, FileText, Lock, Upload, Calendar, Share2, Link as LinkIcon, ExternalLink, MoreHorizontal, MessageCircle } from "lucide-react"
import { checkConnection } from "./actions"
import { useEffect } from "react"
import { EditIndustryDialog } from "@/components/profile/edit-industry-dialog"
import { EditLinkedInDialog } from "@/components/profile/edit-linkedin-dialog"
import { PROFILE_EDIT_PARAM, type ProfileEditTarget } from "@/lib/profile-edit-targets"
import { AvailabilityPicker } from "@/components/scheduling/availability-picker"

interface AthleteProfile {
    school?: string
    sport?: string
    avatar_url?: string
    cover_url?: string
    theme_gradient?: string
    verification_status?: boolean
    resume_url?: string
    linkedin_url?: string
    locations?: string
    career_sectors?: string[]
    scheduling_url?: string
}

interface Profile {
    id: string
    name?: string
    avatar_url?: string
    cover_url?: string
    theme_gradient?: string
    athlete_profiles?: AthleteProfile
}

interface ProfileHeaderProps {
    profile: Profile | null
    isOwnProfile: boolean
    currentExperience?: { company: string, role: string }
}

export function ProfileHeader({ profile, isOwnProfile, currentExperience }: ProfileHeaderProps) {
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Optimistic States
    const themeGradient = profile?.athlete_profiles?.theme_gradient || 'from-blue-100 to-cyan-100'

    const [optimisticAvatar, setOptimisticAvatar] = useOptimistic<string | null | undefined, string | null>(
        profile?.athlete_profiles?.avatar_url || profile?.avatar_url,
        (_, newUrl) => newUrl
    )

    const [optimisticCover, setOptimisticCover] = useOptimistic<string | null | undefined, string | null>(
        profile?.athlete_profiles?.cover_url,
        (_, newUrl) => newUrl
    )

    // Cropper State
    const [cropperOpen, setCropperOpen] = useState(false)
    const [imageToCrop, setImageToCrop] = useState<string | null>(null)
    const [cropType, setCropType] = useState<'avatar' | 'cover' | null>(null)
    // Request Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isResumeUploadOpen, setIsResumeUploadOpen] = useState(false)
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
    const moreMenuRef = useRef<HTMLDivElement>(null)
    const [isEditIndustryOpen, setIsEditIndustryOpen] = useState(false)
    const [isEditLinkedInOpen, setIsEditLinkedInOpen] = useState(false)
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [isConnected, setIsConnected] = useState<boolean | null>(null)
    const [connectionCount, setConnectionCount] = useState<number>(0)
    
    const primaryIndustry = profile?.athlete_profiles?.career_sectors?.[0] || null

    useEffect(() => {
        if (!isOwnProfile && profile?.id) {
            checkConnection(profile.id).then(res => setIsConnected(res.connected))
        } else if (isOwnProfile) {
            setIsConnected(true)
        }

        // Fetch actual connection count
        async function fetchConnectionCount() {
            const targetId = profile?.id
            if (!targetId) return
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { count } = await supabase
                .from('requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'accepted')
                .or(`requester_id.eq.${targetId},recipient_id.eq.${targetId}`)
            setConnectionCount(count || 0)
        }
        fetchConnectionCount()
    }, [isOwnProfile, profile?.id])

    // Deep-link handling: when ?edit=<target> is present, open the matching editor.
    // When ?book=1 is present and we're on someone else's profile, open the
    // booking dialog (used by the Network "Schedule Call" button).
    // Runs once on mount when the param exists, then strips it from the URL so refreshes don't re-trigger.
    const searchParams = useSearchParams()
    useEffect(() => {
        // Booking deep-link works on anyone's profile (not just our own).
        if (!isOwnProfile && searchParams?.get('book')) {
            setIsBookingOpen(true)
            const params = new URLSearchParams(searchParams.toString())
            params.delete('book')
            const qs = params.toString()
            router.replace(qs ? `/profile/${profile?.id}?${qs}` : `/profile/${profile?.id}`)
            return
        }
        if (!isOwnProfile) return
        const target = searchParams?.get(PROFILE_EDIT_PARAM) as ProfileEditTarget | null
        if (!target) return

        switch (target) {
            case 'industry_sector':
                setIsEditIndustryOpen(true)
                break
            case 'avatar':
                avatarInputRef.current?.click()
                break
            case 'resume':
                setIsResumeUploadOpen(true)
                break
            case 'linkedin':
                setIsEditLinkedInOpen(true)
                break
            case 'experience': {
                const el = document.getElementById('experience-section')
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                break
            }
            case 'education': {
                const el = document.getElementById('education-section')
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                break
            }
        }

        router.replace('/profile')
    // We deliberately only react to the first searchParams snapshot — once the
    // editor is open we strip the param via router.replace and don't re-open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Close the kebab menu on outside click. We use a document listener instead of
    // a fixed-inset backdrop so the page beneath the menu remains scrollable.
    useEffect(() => {
        if (!isMoreMenuOpen) return
        const handler = (e: MouseEvent) => {
            if (!moreMenuRef.current?.contains(e.target as Node)) {
                setIsMoreMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isMoreMenuOpen])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImageToCrop(reader.result as string)
            setCropType(type)
            setCropperOpen(true)
        })
        reader.readAsDataURL(file)

        // Reset input value so same file can be selected again
        e.target.value = ''
    }

    const handleCropSave = async (croppedFile: File) => {
        if (!cropType) return

        setIsUploading(cropType)

        // Show local preview immediately
        const localPreview = URL.createObjectURL(croppedFile)

        startTransition(async () => {
            if (cropType === 'avatar') setOptimisticAvatar(localPreview)
            else setOptimisticCover(localPreview)

            const formData = new FormData()
            formData.append('file', croppedFile)
            formData.append('type', cropType)

            try {
                const result = await updateProfileImage(formData)
                if (result.error) {
                    toast.error(`Failed to upload ${cropType}: ${result.error}`)
                } else {
                    toast.success(`${cropType.charAt(0).toUpperCase() + cropType.slice(1)} updated!`)
                }
            } catch (err) {
                toast.error("An unexpected error occurred during upload.")
            } finally {
                setIsUploading(null)
                setCropperOpen(false)
                setImageToCrop(null)
                setCropType(null)
                URL.revokeObjectURL(localPreview)
            }
        })
    }

    const handleRemoveImage = async (type: 'avatar' | 'cover') => {
        startTransition(async () => {
            if (type === 'avatar') setOptimisticAvatar(null)
            else setOptimisticCover(null)

            try {
                const result = await removeProfileImage(type)
                if (result.error) {
                    toast.error(`Failed to remove ${type}: ${result.error}`)
                } else {
                    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} removed!`)
                }
            } catch (err) {
                toast.error("An unexpected error occurred")
            }
        })
    }

    return (
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-card">
            {/* Banner Image */}
            <motion.div
                initial={false}
                animate={{
                    backgroundImage: optimisticCover ? `url(${optimisticCover})` : 'none'
                }}
                className={`h-40 md:h-52 bg-gradient-to-r ${themeGradient} relative transition-all duration-500 rounded-t-2xl overflow-hidden`}
                style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                {isOwnProfile && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        {optimisticCover && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="bg-red-500/80 backdrop-blur-sm hover:bg-red-600 shadow-md"
                                    onClick={() => handleRemoveImage('cover')}
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-white/50 backdrop-blur-sm hover:bg-white/80 shadow-md"
                                onClick={() => coverInputRef.current?.click()}
                                disabled={!!isUploading}
                            >
                                {isUploading === 'cover' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                                {isUploading === 'cover' ? "Uploading..." : "Edit Cover"}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </motion.div>

            <CardContent className="px-6 pb-8 relative -mt-16 flex flex-col items-center text-center">
                {/* Profile Picture */}
                <div className="relative group">
                    <Avatar className="h-32 w-32 border-[6px] border-white shadow-md transition-transform group-hover:scale-95 duration-300">
                        <AvatarImage src={optimisticAvatar || undefined} />
                        <AvatarFallback className="text-4xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                            {profile?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>

                    <AnimatePresence>
                        {isUploading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-[2px]"
                            >
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isOwnProfile && (
                        <div className="absolute inset-0 m-auto flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full h-12 w-12 shadow-xl bg-black/40 text-white hover:bg-black/60"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={!!isUploading}
                            >
                                <Camera className="h-6 w-6" />
                            </Button>
                            {(profile?.athlete_profiles?.avatar_url || profile?.avatar_url) && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="rounded-full h-12 w-12 shadow-xl bg-red-500/80 text-white hover:bg-red-600"
                                    onClick={() => handleRemoveImage('avatar')}
                                    disabled={!!isUploading}
                                >
                                    <Trash2 className="h-6 w-6" />
                                </Button>
                            )}
                        </div>
                    )}

                    {isUploading === 'avatar' && (
                        <div className="absolute inset-x-0 -bottom-4 z-20">
                            <div className="bg-secondary text-white text-[10px] font-bold py-1 px-3 rounded-full shadow-lg inline-block animate-pulse">
                                UPDATING...
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden Inputs */}
                <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                />
                <input
                    type="file"
                    ref={coverInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'cover')}
                />

                {/* Profile Info */}
                <div className="mt-4 space-y-2 max-w-2xl">
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-3xl font-bold text-foreground">
                            {profile?.name}
                        </h1>
                        {profile?.athlete_profiles?.verification_status && (
                            <ShieldCheck className="h-6 w-6 text-blue-500" />
                        )}
                        {!isOwnProfile && profile?.id && (
                            <SimilarityScore targetUserId={profile.id} />
                        )}
                    </div>

                    <p className="text-lg font-medium text-foreground/80 flex items-center justify-center gap-2">
                        {currentExperience ? (
                             <span className="font-bold text-primary">{currentExperience.role} at {currentExperience.company}</span>
                        ) : (
                             <span>{profile?.athlete_profiles?.sport ? `${profile.athlete_profiles.sport} Student-Athlete` : 'Student-Athlete'} at {profile?.athlete_profiles?.school || 'University'}</span>
                        )}
                        {primaryIndustry && (
                            <span className="text-xs bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full ring-1 ring-secondary/20 uppercase tracking-tight font-bold">
                                {primaryIndustry}
                            </span>
                        )}
                        {isOwnProfile && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-secondary rounded-full" onClick={() => setIsEditIndustryOpen(true)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </p>

                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        {profile?.athlete_profiles?.locations && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {profile.athlete_profiles.locations}
                            </span>
                        )}
                        {connectionCount > 0 && (
                            <>
                                {profile?.athlete_profiles?.locations && <span>•</span>}
                                <span className="font-medium text-primary">{connectionCount} Connection{connectionCount !== 1 ? 's' : ''}</span>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6 pt-2">
                        {!isOwnProfile && isConnected === false && (
                            <Button
                                className="rounded-full px-8 shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                Send Personal Request
                            </Button>
                        )}
                        {!isOwnProfile && isConnected === true && (
                            <Button
                                className="rounded-full px-8 shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                                onClick={() => router.push(`/messages?user=${profile?.id}`)}
                            >
                                <MessageCircle className="h-4 w-4" />
                                Message
                            </Button>
                        )}
                        
                        {(!isOwnProfile || profile?.athlete_profiles?.scheduling_url) && (
                             <Button
                                variant={isOwnProfile ? "ghost" : "default"}
                                className={cn(
                                    "rounded-full px-6 transition-all gap-2",
                                    !isOwnProfile && "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                                )}
                                onClick={() => {
                                    if (isOwnProfile) {
                                        const url = profile?.athlete_profiles?.scheduling_url;
                                        if (url) {
                                            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                                            window.open(fullUrl, '_blank');
                                        }
                                    } else {
                                        setIsBookingOpen(true);
                                    }
                                }}
                             >
                                <Calendar className="h-4 w-4" />
                                {isOwnProfile ? "Preview Booking Link" : "Book a Meeting"}
                             </Button>
                        )}

                        {isOwnProfile ? (
                            <Button
                                variant="outline"
                                className="rounded-full px-6 transition-all hover:bg-muted gap-2"
                                onClick={() => setIsResumeUploadOpen(true)}
                            >
                                <Upload className="h-4 w-4" />
                                {profile?.athlete_profiles?.resume_url ? "Update Resume" : "Upload Resume"}
                            </Button>
                        ) : (
                            <Button 
                                variant="outline" 
                                className={cn(
                                    "rounded-full px-6 transition-all gap-2",
                                    isConnected ? "hover:bg-muted" : "opacity-60 cursor-not-allowed group"
                                )}
                                onClick={() => {
                                    if (isConnected && profile?.athlete_profiles?.resume_url) {
                                        window.open(profile.athlete_profiles.resume_url, '_blank')
                                    } else if (!isConnected) {
                                        toast.info("Connect with this user to view their resume", {
                                            icon: <Lock className="h-4 w-4" />
                                        })
                                    }
                                }}
                            >
                                {isConnected ? (
                                    <FileText className="h-4 w-4" />
                                ) : (
                                    <Lock className="h-4 w-4" />
                                )}
                                View Resume
                            </Button>
                        )}

                        {profile?.athlete_profiles?.resume_url && isOwnProfile && (
                            <Button
                                variant="ghost"
                                className="rounded-full px-4 text-secondary hover:text-secondary/80 flex items-center gap-1.5"
                                onClick={() => window.open(profile.athlete_profiles?.resume_url, '_blank')}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs font-bold">Preview</span>
                            </Button>
                        )}

                        {profile?.athlete_profiles?.linkedin_url && (
                            <Button
                                asChild
                                variant="outline"
                                size="icon"
                                className="rounded-full transition-all hover:bg-muted"
                                aria-label="View LinkedIn profile"
                                title="View LinkedIn profile"
                            >
                                <a
                                    href={profile.athlete_profiles.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Linkedin className="h-4 w-4" />
                                </a>
                            </Button>
                        )}

                        {isOwnProfile && !profile?.athlete_profiles?.linkedin_url && (
                            <Button
                                variant="outline"
                                className="rounded-full px-6 transition-all hover:bg-muted gap-2"
                                onClick={() => setIsEditLinkedInOpen(true)}
                            >
                                <Linkedin className="h-4 w-4" />
                                Add LinkedIn
                            </Button>
                        )}

                        {isOwnProfile && profile?.athlete_profiles?.linkedin_url && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-muted-foreground hover:text-secondary"
                                aria-label="Edit LinkedIn link"
                                title="Edit LinkedIn link"
                                onClick={() => setIsEditLinkedInOpen(true)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        )}

                        <div className="relative z-50" ref={moreMenuRef}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full transition-transform hover:rotate-90"
                                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                            >
                                <div className="sr-only">More options</div>
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>

                            {isMoreMenuOpen && (
                                <>
                                    {/* Menu — click-outside is handled via document listener so the
                                        page underneath remains scrollable while the menu is open. */}
                                    <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-border bg-white dark:bg-card shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                toast.success('Profile link copied!');
                                                setIsMoreMenuOpen(false);
                                            }}
                                        >
                                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                            Copy Profile Link
                                        </button>
                                        <button
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({ title: `${profile?.name} — Relay`, url: window.location.href });
                                                } else {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    toast.success('Link copied!');
                                                }
                                                setIsMoreMenuOpen(false);
                                            }}
                                        >
                                            <Share2 className="h-4 w-4 text-muted-foreground" />
                                            Share Profile
                                        </button>
                                        {isOwnProfile && (
                                            <>
                                                <div className="my-1 h-px bg-border/40" />
                                                <button
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                                                    onClick={() => {
                                                        setIsEditIndustryOpen(true);
                                                        setIsMoreMenuOpen(false);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                    Edit Industry
                                                </button>
                                                <a
                                                    href="/profile/verify"
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                                                    onClick={() => setIsMoreMenuOpen(false)}
                                                >
                                                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                                    Verification Status
                                                </a>
                                                {profile?.athlete_profiles?.scheduling_url && (
                                                    <button
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                                                        onClick={() => {
                                                            const url = profile.athlete_profiles?.scheduling_url;
                                                            if (url) window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
                                                            setIsMoreMenuOpen(false);
                                                        }}
                                                    >
                                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                        View Booking Page
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Connection Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none !rounded-[2.5rem]">
                    <div className="bg-background border border-border shadow-2xl rounded-[2.5rem] relative overflow-y-auto max-h-[90vh]">
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-secondary/10 to-transparent -z-10" />

                        <div className="p-8 md:p-10">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-bold tracking-tight mb-2">Start a Connection</DialogTitle>
                                <DialogDescription className="text-base text-muted-foreground mb-8">
                                    Direct your request to {profile?.name}. Professional, concise requests lead to 80% higher response rates.
                                </DialogDescription>
                            </DialogHeader>
                            {profile && (
                                <RequestForm
                                    recipient={{
                                        id: (profile as any).id || '',
                                        name: profile.name || '',
                                        sport: (profile.athlete_profiles?.sport || 'Squash') as any,
                                        school: profile.athlete_profiles?.school || '',
                                        role: profile.athlete_profiles?.sport ? 'Student-Athlete' : 'Alumni',
                                        imageUrl: profile.athlete_profiles?.avatar_url || profile.avatar_url
                                    }}
                                    onSuccess={() => setIsDialogOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Resume Upload + Auto-Import Dialog */}
            <ResumeDialog
                open={isResumeUploadOpen}
                onOpenChange={setIsResumeUploadOpen}
                currentResumeUrl={profile?.athlete_profiles?.resume_url}
            />

            {/* Booking Dialog */}
            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-transparent">
                    {profile && (
                        <AvailabilityPicker recipientId={profile.id} recipientName={profile.name || "User"} />
                    )}
                </DialogContent>
            </Dialog>

            <ImageCropper
                image={imageToCrop}
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                onCropComplete={handleCropSave}
                aspect={cropType === 'avatar' ? 1 : 16 / 9}
                title={cropType === 'avatar' ? "Crop Profile Photo" : "Crop Banner Image"}
            />
            
            <EditIndustryDialog
                isOpen={isEditIndustryOpen}
                onOpenChange={setIsEditIndustryOpen}
                currentIndustry={primaryIndustry}
            />

            <EditLinkedInDialog
                isOpen={isEditLinkedInOpen}
                onOpenChange={setIsEditLinkedInOpen}
                currentUrl={profile?.athlete_profiles?.linkedin_url || null}
            />
        </Card>
    )
}
