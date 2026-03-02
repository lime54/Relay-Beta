'use client'

import { useRef, useState, useOptimistic, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, ShieldCheck, MapPin, Camera, Palette, Trash2, Loader2 } from "lucide-react"
import { updateProfileImage, updateProfileTheme, removeProfileImage } from "./actions"
import { toast } from "sonner"
import { Select } from "@/components/ui/select"
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

interface AthleteProfile {
    school?: string
    sport?: string
    avatar_url?: string
    cover_url?: string
    theme_gradient?: string
    verification_status?: boolean
}

interface Profile {
    name?: string
    avatar_url?: string
    cover_url?: string
    theme_gradient?: string
    athlete_profiles?: AthleteProfile
}

interface ProfileHeaderProps {
    profile: Profile | null
    isOwnProfile: boolean
}

const THEME_OPTIONS = [
    { name: "Update Theme...", value: "" },
    { name: "Default (Blue)", value: "from-blue-100 to-cyan-100" },
    { name: "Sunset (Pink)", value: "from-orange-100 to-rose-100" },
    { name: "Forest (Green)", value: "from-emerald-100 to-teal-100" },
    { name: "Twilight (Purple)", value: "from-indigo-100 to-purple-100" },
    { name: "Midnight (Dark)", value: "from-slate-800 to-slate-900 text-white" },
]

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Optimistic States
    const [optimisticTheme, setOptimisticTheme] = useOptimistic(
        profile?.athlete_profiles?.theme_gradient || 'from-blue-100 to-cyan-100',
        (_, newTheme: string) => newTheme
    )

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

    const handleThemeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const gradient = e.target.value
        if (!gradient) return

        startTransition(async () => {
            setOptimisticTheme(gradient)
            try {
                const result = await updateProfileTheme(gradient)
                if (result.error) {
                    toast.error(`Error: ${result.error}`)
                } else {
                    toast.success("Theme updated!")
                }
            } catch (err) {
                toast.error("An unexpected error occurred")
                console.error(err)
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
        <Card className="rounded-2xl overflow-hidden border-none shadow-sm bg-white dark:bg-card">
            {/* Banner Image */}
            <motion.div
                initial={false}
                animate={{
                    backgroundImage: optimisticCover ? `url(${optimisticCover})` : 'none'
                }}
                className={`h-40 md:h-52 bg-gradient-to-r ${optimisticTheme} relative transition-all duration-500`}
                style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                {isOwnProfile && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        <div className="relative">
                            <Select
                                className={cn(
                                    "h-9 w-36 bg-white/50 backdrop-blur-sm border-none text-xs font-bold transition-all",
                                    isPending && cropType === null && "opacity-50 grayscale cursor-not-allowed"
                                )}
                                onChange={handleThemeChange}
                                value=""
                                disabled={isPending}
                            >
                                {THEME_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                                ))}
                            </Select>
                            {isPending && cropType === null && (
                                <div className="absolute inset-y-0 right-2 flex items-center">
                                    <Loader2 className="h-3 w-3 animate-spin text-foreground/50" />
                                </div>
                            )}
                        </div>

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
                                loading={isUploading === 'cover'}
                                disabled={!!isUploading}
                            >
                                <Camera className="h-4 w-4 mr-2" />
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
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-3xl font-bold text-foreground">
                            {profile?.name}
                        </h1>
                        {profile?.athlete_profiles?.verification_status && (
                            <ShieldCheck className="h-6 w-6 text-blue-500" />
                        )}
                    </div>

                    <p className="text-lg font-medium text-foreground/80">
                        {profile?.athlete_profiles?.sport ? `${profile.athlete_profiles.sport} Student-Athlete` : 'Student-Athlete'} at {profile?.athlete_profiles?.school || 'University'}
                    </p>

                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Los Angeles, CA
                        </span>
                        <span>•</span>
                        <span className="font-medium text-primary">500+ Connections</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6 pt-2">
                        {!isOwnProfile && (
                            <Button
                                className="rounded-full px-8 shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                Send Personal Request
                            </Button>
                        )}
                        <Button variant="outline" className="rounded-full px-6 transition-all hover:bg-muted">
                            View Resume
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full transition-transform hover:rotate-90">
                            <div className="sr-only">More options</div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                        </Button>
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

            <ImageCropper
                image={imageToCrop}
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                onCropComplete={handleCropSave}
                aspect={cropType === 'avatar' ? 1 : 16 / 9}
                title={cropType === 'avatar' ? "Crop Profile Photo" : "Crop Banner Image"}
            />
        </Card>
    )
}
