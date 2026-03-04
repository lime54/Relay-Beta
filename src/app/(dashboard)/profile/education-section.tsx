'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, GraduationCap, Calendar } from "lucide-react"
import { addEducation, deleteEducation } from './actions'

type Education = {
    id: string
    school: string
    degree: string
    start_date: string
    end_date?: string
    is_current: boolean
    description?: string
}

export function EducationSection({ initialEducations }: { initialEducations: Education[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        try {
            const result = await addEducation(formData)
            if (result?.error) {
                alert(result.error)
            } else {
                setIsOpen(false)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Education
                </h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 rounded-full border-dashed">
                            <Plus className="h-4 w-4" />
                            Add Education
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Education</DialogTitle>
                            <DialogDescription>
                                Add your schools and degrees.
                            </DialogDescription>
                        </DialogHeader>

                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">School / University</label>
                                <Input name="school" required placeholder="e.g. Stanford University" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Degree / Field of Study</label>
                                <Input name="degree" required placeholder="e.g. BS Computer Science" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Date</label>
                                    <Input name="start_date" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End Date</label>
                                    <Input name="end_date" type="date" />
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="checkbox" name="is_current" id="is_current" className="rounded border-gray-300" />
                                        <label htmlFor="is_current" className="text-xs text-muted-foreground">I currently study here</label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Activities & Societies</label>
                                <Textarea name="description" placeholder="e.g. Varsity Squash, Newspaper Editor..." />
                            </div>
                            <Button type="submit" className="w-full" loading={isSubmitting}>
                                Save Education
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {initialEducations.length === 0 ? (
                <Card className="border-dashed shadow-none bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground max-w-sm mb-4 text-sm">
                            Add your education history.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                            Add School
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {initialEducations.map((edu) => (
                        <Card key={edu.id} className="group border-l-4 border-l-blue-400 hover:shadow-md transition-all">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        {/* School Logo Placeholder */}
                                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                                            {edu.school.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-foreground">{edu.school}</h4>
                                            <p className="text-foreground/80">{edu.degree}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {new Date(edu.start_date).getFullYear()}
                                                    {' - '}
                                                    {edu.is_current ? 'Present' : new Date(edu.end_date!).getFullYear()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <form action={async () => {
                                        if (confirm('Are you sure you want to delete this education?')) {
                                            await deleteEducation(edu.id)
                                        }
                                    }}>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
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
