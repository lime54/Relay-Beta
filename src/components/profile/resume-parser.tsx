"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { addExperience, addEducation } from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";
import { Loader2, FileText, Sparkles, CheckCircle, ArrowRight } from "lucide-react";

interface ParsedExperience {
    company: string;
    role: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
}

interface ParsedEducation {
    school: string;
    degree: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export function ResumeParser({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [rawText, setRawText] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parsed, setParsed] = useState<{
        experiences: ParsedExperience[];
        educations: ParsedEducation[];
    } | null>(null);

    const handleParse = async () => {
        if (!rawText.trim()) {
            toast.error("Please paste your resume text first.");
            return;
        }

        setIsParsing(true);
        // Simulate a slight delay to make it feel like it's doing heavy work
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // Heuristic Parsing Engine (Client-Side)
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            const experiences: ParsedExperience[] = [];
            const educations: ParsedEducation[] = [];
            
            let currentSection = 'unknown';

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lower = line.toLowerCase();
                
                // Section transitions
                if (lower === 'experience' || lower.includes('work experience') || lower === 'employment') {
                    currentSection = 'experience';
                    continue;
                } else if (lower === 'education' || lower.includes('education history')) {
                    currentSection = 'education';
                    continue;
                } else if (lower === 'skills' || lower === 'projects') {
                    currentSection = 'other';
                    continue;
                }

                // Look for dates (e.g., 2020 - 2023 or 2022 - Present)
                const hasDate = /(20\d{2}|19\d{2})/.test(line);

                if (currentSection === 'experience' && hasDate) {
                    // Heuristically assume the line above is the role/company
                    let roleStr = i > 0 ? lines[i - 1] : 'Unknown Role';
                    // Skip if the previous line was the section header itself
                    if (roleStr.toLowerCase().includes('experience') && i > 1) {
                        roleStr = lines[i - 2];
                    }

                    const parts = roleStr.split(/,|\||-/).map(p => p.trim());
                    const company = parts[0] || 'Unknown Company';
                    const role = parts[1] || company; // fallback to company if no split
                    const is_current = lower.includes('present') || lower.includes('current');
                    
                    const yearMatch = line.match(/(20\d{2}|19\d{2})/g);
                    const startYear = yearMatch && yearMatch.length > 0 ? yearMatch[0] : '2020';
                    const endYear = yearMatch && yearMatch.length > 1 ? yearMatch[1] : (is_current ? '' : startYear);

                    // Grab next 2 lines as description if they look like bullets and don't match dates
                    let description = '';
                    if (i + 1 < lines.length && !/(20\d{2}|19\d{2})/.test(lines[i + 1])) {
                        description += lines[i + 1];
                    }

                    experiences.push({
                        company,
                        role,
                        start_date: `${startYear}-01-01`,
                        end_date: is_current ? '' : `${endYear}-01-01`,
                        is_current,
                        description
                    });

                } else if (currentSection === 'education' && hasDate) {
                    let schoolStr = i > 0 ? lines[i - 1] : 'Unknown School';
                    if (schoolStr.toLowerCase().includes('education') && i > 1) {
                        schoolStr = lines[i - 2];
                    }

                    const is_current = lower.includes('present') || lower.includes('expected');
                    const yearMatch = line.match(/(20\d{2}|19\d{2})/g);
                    const startYear = yearMatch && yearMatch.length > 0 ? yearMatch[0] : '2016';
                    
                    let degree = 'Bachelor of Science';
                    if (i + 1 < lines.length && lines[i + 1].toLowerCase().includes('degree') || lines[i + 1].toLowerCase().includes('bachelor')) {
                        degree = lines[i + 1];
                    } else if (line.toLowerCase().includes('b.s.') || line.toLowerCase().includes('b.a.')) {
                        degree = line;
                    }

                    educations.push({
                        school: schoolStr,
                        degree,
                        start_date: `${startYear}-09-01`,
                        end_date: is_current ? '' : `${parseInt(startYear) + 4}-05-01`,
                        is_current
                    });
                }
            }

            // Fallback: If heuristic found nothing, generate a generic one from the whole text if it's long enough
            if (experiences.length === 0 && educations.length === 0 && rawText.length > 100) {
                toast.warning("Could not clearly parse sections, capturing as general experience.");
                experiences.push({
                    company: "Imported Profile",
                    role: "Professional Experience",
                    start_date: "2020-01-01",
                    end_date: "",
                    is_current: true,
                    description: rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "")
                });
            } else {
                toast.success(`Found ${experiences.length} roles and ${educations.length} schools.`);
            }

            setParsed({ experiences, educations });
        } catch (e) {
            toast.error("Error parsing resume.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleImport = async () => {
        if (!parsed) return;
        setIsImporting(true);

        try {
            let successCount = 0;

            for (const exp of parsed.experiences) {
                const fd = new FormData();
                fd.append('company', exp.company);
                fd.append('role', exp.role);
                fd.append('start_date', exp.start_date);
                if (!exp.is_current) fd.append('end_date', exp.end_date);
                if (exp.is_current) fd.append('is_current', 'on');
                fd.append('description', exp.description);
                await addExperience(fd);
                successCount++;
            }

            for (const edu of parsed.educations) {
                const fd = new FormData();
                fd.append('school', edu.school);
                fd.append('degree', edu.degree);
                fd.append('start_date', edu.start_date);
                if (!edu.is_current) fd.append('end_date', edu.end_date);
                if (edu.is_current) fd.append('is_current', 'on');
                fd.append('description', '');
                await addEducation(fd);
                successCount++;
            }

            toast.success(`Successfully imported ${successCount} items to your profile!`);
            onOpenChange(false);
            setRawText("");
            setParsed(null);
        } catch (e) {
            toast.error("Failed to save some items.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-secondary" />
                        Import Resume
                    </DialogTitle>
                    <DialogDescription>
                        Paste your resume text below. Our parser will instantly extract your work history and education.
                    </DialogDescription>
                </DialogHeader>

                {!parsed ? (
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Paste your plain text resume here... (Tip: Cmd+C from LinkedIn or your PDF)"
                            className="min-h-[250px] resize-none font-mono text-xs bg-muted/20"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button 
                                onClick={handleParse} 
                                disabled={isParsing || !rawText}
                                className="bg-secondary text-white hover:bg-secondary/90 w-full rounded-xl h-11"
                            >
                                {isParsing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</>
                                ) : (
                                    <><Sparkles className="mr-2 h-4 w-4" /> Extract Info</>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            <div>
                                <h4 className="font-bold text-sm mb-2 text-foreground/80 border-b pb-1">Found Experience ({parsed.experiences.length})</h4>
                                {parsed.experiences.length === 0 ? <p className="text-xs text-muted-foreground">No roles found.</p> : (
                                    <ul className="space-y-3">
                                        {parsed.experiences.map((exp, i) => (
                                            <li key={i} className="bg-muted/30 p-3 rounded-lg text-sm">
                                                <div className="font-bold">{exp.role}</div>
                                                <div className="text-secondary font-medium text-xs">{exp.company}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {exp.start_date.split('-')[0]} - {exp.is_current ? 'Present' : exp.end_date.split('-')[0]}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-sm mb-2 text-foreground/80 border-b pb-1">Found Education ({parsed.educations.length})</h4>
                                {parsed.educations.length === 0 ? <p className="text-xs text-muted-foreground">No schools found.</p> : (
                                    <ul className="space-y-3">
                                        {parsed.educations.map((edu, i) => (
                                            <li key={i} className="bg-muted/30 p-3 rounded-lg text-sm">
                                                <div className="font-bold">{edu.school}</div>
                                                <div className="text-muted-foreground text-xs">{edu.degree}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setParsed(null)}>
                                Retry
                            </Button>
                            <Button 
                                className="flex-2 bg-primary text-primary-foreground flex-1" 
                                onClick={handleImport}
                                disabled={isImporting || (parsed.experiences.length === 0 && parsed.educations.length === 0)}
                            >
                                {isImporting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                ) : (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Import All</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
