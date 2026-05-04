"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { ArrowRight, Clock, MessageCircle, MoreHorizontal, Archive, Trash2, ArchiveRestore } from "lucide-react"
import { archiveSentRequest, deleteSentRequest, unarchiveSentRequest } from "./actions"

export interface SentRequest {
    id: string
    request_type?: string
    context?: string
    status: string
    created_at: string
    archived_at?: string | null
    recipient?: {
        id?: string
        name?: string
        athlete_profiles?: {
            school?: string
            sport?: string
        } | null
    } | null
}

interface SentRequestsListProps {
    initialRequests: SentRequest[]
    archived: boolean
}

export function SentRequestsList({ initialRequests, archived }: SentRequestsListProps) {
    const router = useRouter()
    const [requests, setRequests] = useState<SentRequest[]>(initialRequests)
    const [, startTransition] = useTransition()
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    // Keep local state in sync when server data refreshes (e.g. after navigation
    // between Active/Archived sub-tabs).
    useEffect(() => {
        setRequests(initialRequests)
    }, [initialRequests])

    const handleArchive = async (id: string) => {
        const previous = requests
        setRequests(prev => prev.filter(r => r.id !== id))
        toast.success("Request archived")

        const result = await archiveSentRequest(id)
        if ("error" in result && result.error) {
            setRequests(previous)
            toast.error(`Couldn't archive — ${result.error}`)
            return
        }
        startTransition(() => router.refresh())
    }

    const handleUnarchive = async (id: string) => {
        const previous = requests
        setRequests(prev => prev.filter(r => r.id !== id))
        toast.success("Request restored")

        const result = await unarchiveSentRequest(id)
        if ("error" in result && result.error) {
            setRequests(previous)
            toast.error(`Couldn't restore — ${result.error}`)
            return
        }
        startTransition(() => router.refresh())
    }

    const handleDelete = async (id: string) => {
        setConfirmDeleteId(null)
        const previous = requests
        setRequests(prev => prev.filter(r => r.id !== id))
        toast.success("Request deleted")

        const result = await deleteSentRequest(id)
        if ("error" in result && result.error) {
            setRequests(previous)
            toast.error(`Couldn't delete — ${result.error}`)
            return
        }
        startTransition(() => router.refresh())
    }

    if (requests.length === 0) {
        return null
    }

    return (
        <>
            <div className="space-y-3">
                {requests.map(req => {
                    const recipient = req.recipient
                    const recipientName = recipient?.name || 'Someone'
                    const recipientSchool = recipient?.athlete_profiles?.school
                    const recipientSport = recipient?.athlete_profiles?.sport
                    const recipientId = recipient?.id

                    return (
                        <Card key={req.id} className="hover:shadow-md transition-all overflow-hidden border-border/60">
                            <CardContent className="p-0">
                                <div className="flex items-stretch">
                                    {/* Status Bar */}
                                    <div className={`w-1.5 shrink-0 ${
                                        req.status === 'accepted' ? 'bg-green-500' :
                                        req.status === 'declined' ? 'bg-red-400' :
                                        'bg-amber-400'
                                    }`} />

                                    <div className="flex-1 p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                                                    {recipientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{recipientName}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {[recipientSport, recipientSchool].filter(Boolean).join(' • ') || 'Athlete'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                                                    req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                                <KebabMenu
                                                    archived={archived}
                                                    onArchive={() => handleArchive(req.id)}
                                                    onUnarchive={() => handleUnarchive(req.id)}
                                                    onDelete={() => setConfirmDeleteId(req.id)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {req.request_type?.split('_').join(' ')}
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                                            {req.context}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                                            {req.status === 'accepted' && recipientId ? (
                                                <Link href={`/messages?user=${recipientId}`}>
                                                    <Button size="sm" className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white rounded-full gap-1.5">
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                        Message
                                                    </Button>
                                                </Link>
                                            ) : req.status === 'pending' ? (
                                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Waiting for response...
                                                </span>
                                            ) : null}
                                            <Link href={`/requests/${req.id}`} className="ml-auto">
                                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-500 hover:text-slate-900 gap-1">
                                                    Details
                                                    <ArrowRight className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this request?</DialogTitle>
                        <DialogDescription>
                            This permanently removes the request and any messages tied to it. This can&apos;t be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                        >
                            Delete request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

interface KebabMenuProps {
    archived: boolean
    onArchive: () => void
    onUnarchive: () => void
    onDelete: () => void
}

// Lightweight non-modal menu (consistent with the profile-header dropdown
// fix — uses a document-level click-outside listener instead of a fixed
// inset-0 backdrop, so the page underneath stays scrollable while open).
function KebabMenu({ archived, onArchive, onUnarchive, onDelete }: KebabMenuProps) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                aria-label="Sent request actions"
                onClick={() => setOpen(o => !o)}
            >
                <MoreHorizontal className="h-4 w-4" />
            </Button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-xl border border-border bg-white dark:bg-card shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    {archived ? (
                        <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                            onClick={() => { onUnarchive(); setOpen(false) }}
                        >
                            <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
                            Restore
                        </button>
                    ) : (
                        <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                            onClick={() => { onArchive(); setOpen(false) }}
                        >
                            <Archive className="h-4 w-4 text-muted-foreground" />
                            Archive
                        </button>
                    )}
                    <button
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 transition-colors"
                        onClick={() => { onDelete(); setOpen(false) }}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}
