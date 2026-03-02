'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Briefcase, Calendar } from "lucide-react"
import { addExperience, deleteExperience } from './actions'

type Experience = {
    id: string
    company: string
    role: string
    start_date: string
    end_date?: string
    is_current: boolean
    description?: string
}

export function ExperienceList({ initialExperiences }: { initialExperiences: Experience[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        try {
            const result = await addExperience(formData)
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
                    <Briefcase className="h-5 w-5 text-primary" />
                    Work Experience
                </h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 rounded-full border-dashed">
                            <Plus className="h-4 w-4" />
                            Add Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Experience</DialogTitle>
                            <DialogDescription>
                                Add your professional experience manually.
                            </DialogDescription>
                        </DialogHeader>

                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company / Organization</label>
                                <Input name="company" required placeholder="e.g. Google, Goldman Sachs" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role / Title</label>
                                <Input name="role" required placeholder="e.g. Software Engineer, Analyst" />
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
                                        <label htmlFor="is_current" className="text-xs text-muted-foreground">I currently work here</label>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea name="description" placeholder="Briefly describe your responsibilities..." />
                            </div>
                            <Button type="submit" className="w-full" loading={isSubmitting}>
                                Save Experience
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {initialExperiences.length === 0 ? (
                <Card className="border-dashed shadow-none bg-muted/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">No experience added</h3>
                        <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                            Your profile is looking a bit empty. Add your internships or jobs to stand out to recruiters.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                            Add your first role
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {initialExperiences.map((exp) => (
                        <Card key={exp.id} className="group border-l-4 border-l-primary/20 hover:border-l-primary transition-all hover:shadow-md">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-lg text-foreground">{exp.role}</h4>
                                        <p className="text-primary font-medium">{exp.company}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 bg-muted/30 inline-flex px-2 py-1 rounded-md">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                {' - '}
                                                {exp.is_current ? 'Present' : new Date(exp.end_date!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <form action={async () => {
                                        if (confirm('Are you sure you want to delete this experience?')) {
                                            await deleteExperience(exp.id)
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
