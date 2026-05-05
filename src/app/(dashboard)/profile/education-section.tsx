'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, GraduationCap, Calendar, Pencil } from "lucide-react"
import { addEducation, updateEducation, deleteEducation } from './actions'
import { toast } from 'sonner'

type Education = {
    id: string
    school: string
    degree: string
    start_date: string
    end_date?: string
    is_current: boolean
    description?: string
}

function EducationForm({
    education,
    onSubmit,
    isSaving,
    onCancel,
}: {
    education?: Education
    onSubmit: (fd: FormData) => void
    isSaving: boolean
    onCancel?: () => void
}) {
    const [isCurrent, setIsCurrent] = useState(education?.is_current ?? false)

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        onSubmit(new FormData(e.currentTarget))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {education && <input type="hidden" name="id" value={education.id} readOnly />}
            <div className="space-y-2">
                <label className="text-sm font-medium">School / University</label>
                <Input name="school" required placeholder="e.g. Stanford University" defaultValue={education?.school} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Degree / Field of Study</label>
                <Input name="degree" required placeholder="e.g. BS Computer Science" defaultValue={education?.degree} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input name="start_date" type="date" required defaultValue={education?.start_date} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input name="end_date" type="date" defaultValue={education?.end_date} disabled={isCurrent} />
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="checkbox"
                            name="is_current"
                            id="is_current_edu"
                            className="rounded border-gray-300"
                            checked={isCurrent}
                            onChange={e => setIsCurrent(e.target.checked)}
                        />
                        <label htmlFor="is_current_edu" className="text-xs text-muted-foreground">I currently study here</label>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Activities & Societies</label>
                <Textarea name="description" placeholder="e.g. Varsity Squash, Newspaper Editor..." defaultValue={education?.description} />
            </div>
            <div className={onCancel ? "flex gap-3" : ""}>
                {onCancel && (
                    <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" className={onCancel ? "flex-1" : "w-full"} disabled={isSaving}>
                    {isSaving ? 'Saving...' : education ? 'Save Changes' : 'Save Education'}
                </Button>
            </div>
        </form>
    )
}

export function EducationSection({ initialEducations }: { initialEducations: Education[] }) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [editingEdu, setEditingEdu] = useState<Education | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const router = useRouter()

    async function handleAdd(formData: FormData) {
        setIsAdding(true)
        try {
            const result = await addEducation(formData)
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
            const result = await updateEducation(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Education updated.')
                setEditingEdu(null)
                router.refresh()
            }
        } finally {
            setIsEditing(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this education?')) return
        const result = await deleteEducation(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            router.refresh()
        }
    }

    return (
        <div id="education-section" className="space-y-6 scroll-mt-24">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Education
                </h2>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 rounded-full border-dashed">
                            <Plus className="h-4 w-4" />
                            Add Education
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Education</DialogTitle>
                            <DialogDescription>Add your schools and degrees.</DialogDescription>
                        </DialogHeader>
                        <EducationForm onSubmit={handleAdd} isSaving={isAdding} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit dialog — controlled outside of the card list */}
            <Dialog open={editingEdu !== null} onOpenChange={open => { if (!open) setEditingEdu(null) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Education</DialogTitle>
                        <DialogDescription>Update your education details.</DialogDescription>
                    </DialogHeader>
                    {editingEdu && (
                        <EducationForm
                            key={editingEdu.id}
                            education={editingEdu}
                            onSubmit={handleEdit}
                            isSaving={isEditing}
                            onCancel={() => setEditingEdu(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {initialEducations.length === 0 ? (
                <Card className="border-dashed shadow-none bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground max-w-sm mb-4 text-sm">
                            Add your education history.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
                            Add School
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {initialEducations.map((edu) => (
                        <Card key={edu.id} className="border-l-4 border-l-blue-400 hover:shadow-md transition-all">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex gap-4 flex-1 min-w-0">
                                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                                            {edu.school.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-lg text-foreground">{edu.school}</h4>
                                            <p className="text-foreground/80">{edu.degree}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {new Date(edu.start_date + 'T12:00:00').getFullYear()}
                                                    {' - '}
                                                    {edu.is_current ? 'Present' : new Date(edu.end_date! + 'T12:00:00').getFullYear()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => setEditingEdu(edu)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(edu.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {edu.description && (
                                    <div className="mt-4 text-sm text-muted-foreground pl-[4rem]">
                                        <p className="font-medium text-foreground text-xs uppercase tracking-wider mb-1">Activities</p>
                                        {edu.description}
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
