"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Linkedin, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { updateLinkedInUrl } from "@/app/(dashboard)/profile/actions"

interface EditLinkedInDialogProps {
    currentUrl: string | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9_-]+\/?$/

export function EditLinkedInDialog({ currentUrl, isOpen, onOpenChange }: EditLinkedInDialogProps) {
    const router = useRouter()
    const [url, setUrl] = useState<string>(currentUrl || "")
    const [isUpdating, setIsUpdating] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [error, setError] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setUrl(currentUrl || "")
            setError("")
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen, currentUrl])

    const handleSubmit = async () => {
        setIsUpdating(true)
        setError("")

        const trimmed = url.trim()
        if (trimmed && !LINKEDIN_URL_REGEX.test(trimmed)) {
            setError("That doesn't look like a LinkedIn profile URL. Example: https://www.linkedin.com/in/yourname")
            setIsUpdating(false)
            return
        }

        try {
            const result = await updateLinkedInUrl(trimmed)
            if (result?.error) {
                setError(result.error)
            } else {
                router.refresh()
                onOpenChange(false)
            }
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleRemove = async () => {
        setIsRemoving(true)
        setError("")
        try {
            const result = await updateLinkedInUrl("")
            if (result?.error) {
                setError(result.error)
            } else {
                router.refresh()
                onOpenChange(false)
            }
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setIsRemoving(false)
        }
    }

    const isBusy = isUpdating || isRemoving

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px] rounded-[2rem] border-border/40 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Linkedin className="h-5 w-5 text-secondary" />
                        LinkedIn URL
                    </DialogTitle>
                    <DialogDescription>
                        Add a link to your LinkedIn profile so connections can quickly find you.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary" htmlFor="linkedin-url">Profile URL</label>
                        <Input
                            id="linkedin-url"
                            ref={inputRef}
                            type="url"
                            inputMode="url"
                            placeholder="https://www.linkedin.com/in/your-handle"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isBusy}
                            className="h-12 rounded-xl"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Accepted formats: linkedin.com/in/&hellip;, /pub/&hellip;, or /company/&hellip;
                        </p>
                    </div>

                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                    {currentUrl && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleRemove}
                            disabled={isBusy}
                            className="w-full justify-center gap-2 rounded-xl h-11 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Remove LinkedIn link
                        </Button>
                    )}
                </div>

                <DialogFooter className="sm:justify-between flex-row gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isBusy}
                        className="flex-1 rounded-xl h-12"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isBusy}
                        className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold"
                    >
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
