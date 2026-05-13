'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Briefcase, Calendar, Pencil } from "lucide-react"
import { addExperience, updateExperience, deleteExperience } from './actions'
import { toast } from 'sonner'

type Experience = {
    id: string
    company: string
    role: string
    start_date: string
    end_date?: string
    is_current: boolean
    description?: string
}

function ExperienceForm({
    experience,
    onSubmit,
    isSaving,
    onCancel,
}: {
    experience?: Experience
    onSubmit: (fd: FormData) => void
    isSaving: boolean
    onCancel?: () => void
}) {
    const [isCurrent, setIsCurrent] = useState(experience?.is_current ?? false)

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        onSubmit(new FormData(e.currentTarget))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {experience && <input type="hidden" name="id" value={experience.id} readOnly />}
            <div className="space-y-2">
                <label className="text-sm font-medium">Company / Organization</label>
                <Input name="company" required placeholder="e.g. Google, Goldman Sachs" defaultValue={experience?.company} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Role / Title</label>
                <Input name="role" required placeholder="e.g. Software Engineer, Analyst" defaultValue={experience?.role} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input name="start_date" type="date" required defaultValue={experience?.start_date} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input name="end_date" type="date" defaultValue={experience?.end_date} disabled={isCurrent} />
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="checkbox"
                            name="is_current"
                            id="is_current_exp"
                            className="rounded border-gray-300"
                            checked={isCurrent}
                            onChange={e => setIsCurrent(e.target.checked)}
                        />
                        <label htmlFor="is_current_exp" className="text-xs text-muted-foreground">I currently work here</label>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea name="description" placeholder="Briefly describe your responsibilities..." defaultValue={experience?.description} />
            </div>
            <div className={onCancel ? "flex gap-3" : ""}>
                {onCancel && (
                    <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" className={onCancel ? "flex-1" : "w-full"} disabled={isSaving}>
                    {isSaving ? 'Saving...' : experience ? 'Save Changes' : 'Save Experience'}
                </Button>
            </div>
        </form>
    )
}

export function ExperienceList({ initialExperiences, isOwnProfile = true }: { initialExperiences: Experience[], isOwnProfile?: boolean }) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [editingExp, setEditingExp] = useState<Experience | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const router = useRouter()

    async function handleAdd(formData: FormData) {
        setIsAdding(true)
        try {
            const result = await addExperience(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                setIsAddOpen(false)
                router.refresh()
            }
        } finally {
            setIsAdding(false)
        }
    }

    async function handleEdit(formData: FormData) {
        setIsEditing(true)
        try {
            const result = await updateExperience(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Experience updated.')
                setEditingExp(null)
                router.refresh()
            }
        } finally {
            setIsEditing(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this experience?')) return
        const result = await deleteExperience(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            router.refresh()
        }
    }

    return (
        <div id="experience-section" className="space-y-6 scroll-mt-24">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Work Experience
                </h2>
                {isOwnProfile && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 rounded-full border-dashed">
                                <Plus className="h-4 w-4" />
                                Add Role
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Experience</DialogTitle>
                                <DialogDescription>Add your professional experience manually.</DialogDescription>
                            </DialogHeader>
                            <ExperienceForm onSubmit={handleAdd} isSaving={isAdding} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Edit dialog — controlled outside of the card list */}
            <Dialog open={editingExp !== null} onOpenChange={open => { if (!open) setEditingExp(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Experience</DialogTitle>
                        <DialogDescription>Update your experience details.</DialogDescription>
                    </DialogHeader>
                    {editingExp && (
                        <ExperienceForm
                            key={editingExp.id}
                            experience={editingExp}
                            onSubmit={handleEdit}
                            isSaving={isEditing}
                            onCancel={() => setEditingExp(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {initialExperiences.length === 0 ? (
                <Card className="border-dashed shadow-none bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">No experience added</h3>
                        <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                            {isOwnProfile ? 'Your profile is looking a bit empty. Add your internships or jobs to stand out to recruiters.' : 'This user has not added any experience yet.'}
                        </p>
                        {isOwnProfile && (
                            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
                                Add your first role
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {initialExperiences.map((exp) => (
                        <Card key={exp.id} className="border-l-4 border-l-primary/20 hover:border-l-primary transition-all hover:shadow-md">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-lg text-foreground">{exp.role}</h4>
                                        <p className="text-primary font-medium">{exp.company}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 bg-muted/30 inline-flex px-2 py-1 rounded-md">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {new Date(exp.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                {' - '}
                                                {exp.is_current ? 'Present' : new Date(exp.end_date! + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    {isOwnProfile && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => setEditingExp(exp)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(exp.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {exp.description && (
                                    <div className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4 border-l-2 bg-muted/10 p-3 rounded-r-md">
                                        {exp.description}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
