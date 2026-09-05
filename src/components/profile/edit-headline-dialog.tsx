"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, Type } from "lucide-react"

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
import { updateHeadline } from "@/app/(dashboard)/profile/actions"

interface EditHeadlineDialogProps {
    currentHeadline: string | null
    fallback?: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const MAX_LEN = 120

export function EditHeadlineDialog({ currentHeadline, fallback, isOpen, onOpenChange }: EditHeadlineDialogProps) {
    const router = useRouter()
    const [value, setValue] = useState<string>(currentHeadline || "")
    const [isUpdating, setIsUpdating] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [error, setError] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            setValue(currentHeadline || "")
            setError("")
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen, currentHeadline])

    const save = async (text: string, setBusy: (b: boolean) => void) => {
        setBusy(true)
        setError("")
        try {
            const result = await updateHeadline(text)
            if (result?.error) setError(result.error)
            else { router.refresh(); onOpenChange(false) }
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5 text-secondary" />
                        Edit your title
                    </DialogTitle>
                    <DialogDescription>
                        This is the headline under your name. Leave it blank to use your current role automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                    <Input
                        ref={inputRef}
                        value={value}
                        maxLength={MAX_LEN}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") save(value, setIsUpdating) }}
                        placeholder={fallback || "e.g. Investment Analyst Intern at Nava Ventures"}
                        className="h-11 rounded-xl"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{error ? <span className="text-red-600">{error}</span> : "Shown on your profile and cards."}</span>
                        <span>{value.length}/{MAX_LEN}</span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    {currentHeadline && (
                        <Button variant="outline" onClick={() => save("", setIsRemoving)} disabled={isRemoving || isUpdating} className="text-red-500 hover:text-red-600 mr-auto">
                            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            <span className="ml-1.5">Reset</span>
                        </Button>
                    )}
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUpdating || isRemoving}>Cancel</Button>
                    <Button onClick={() => save(value, setIsUpdating)} disabled={isUpdating || isRemoving}>
                        {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
