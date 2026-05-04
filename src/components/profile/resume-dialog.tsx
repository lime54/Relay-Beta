"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    addEducation,
    addExperience,
    uploadResume,
} from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";
import {
    CheckCircle,
    FileText,
    FileUp,
    Loader2,
    Sparkles,
    Upload,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// ─── Resume Text Parsing ─────────────────────────────────────────────────────

function isEducationLine(line: string): boolean {
    const lower = line.toLowerCase();
    return (
        /\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate|coursework|gpa|cum laude|magna|summa|honors)\b/i.test(lower) ||
        /\b(university|college|institute|school of|academy)\b/i.test(lower)
    );
}

function detectSection(line: string): string | null {
    const lower = line.toLowerCase().trim();
    if (['experience', 'work experience', 'employment', 'employment history', 'professional experience', 'work history', 'relevant experience'].includes(lower)) return 'experience';
    if (['education', 'education history', 'academic background', 'academics'].includes(lower)) return 'education';
    if (['skills', 'technical skills', 'projects', 'certifications', 'awards', 'activities', 'volunteer', 'interests', 'publications', 'references', 'languages', 'leadership', 'organizations', 'extracurricular'].includes(lower)) return 'other';
    if (/^(?:work\s+)?experience/i.test(lower)) return 'experience';
    if (/^education/i.test(lower)) return 'education';
    if (/^(?:skills|projects|certifications|awards|activities)/i.test(lower)) return 'other';
    return null;
}

function extractDateRange(line: string): { startYear: string; endYear: string; isCurrent: boolean } | null {
    const lower = line.toLowerCase();
    const isCurrent = lower.includes('present') || lower.includes('current') || lower.includes('ongoing') || lower.includes('now');
    const yearMatch = line.match(/((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:20|19)\d{2})/gi);
    if (!yearMatch || yearMatch.length === 0) return null;
    const years = yearMatch.map(m => { const y = m.match(/(20\d{2}|19\d{2})/); return y ? y[1] : ''; }).filter(Boolean);
    if (years.length === 0) return null;
    return { startYear: years[0], endYear: years.length > 1 ? years[1] : (isCurrent ? '' : years[0]), isCurrent };
}

function parseResumeText(text: string): { experiences: ParsedExperience[]; educations: ParsedEducation[] } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const experiences: ParsedExperience[] = [];
    const educations: ParsedEducation[] = [];
    let currentSection = 'unknown';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const section = detectSection(line);
        if (section) { currentSection = section; continue; }
        if (line.length < 3) continue;
        const dateInfo = extractDateRange(line);

        if (dateInfo && currentSection === 'experience') {
            if (isEducationLine(line)) continue;

            const contextLines: string[] = [];
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const candidate = lines[j];
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                if (isEducationLine(candidate)) continue;
                if (candidate.length > 2) contextLines.push(candidate);
            }
            contextLines.reverse();

            const dateLineRest = line.replace(/((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:20|19)\d{2})/gi, '')
                .replace(/present|current|now/gi, '')
                .replace(/[^a-zA-Z\s]/g, ' ')
                .trim();

            let roleStr = '';
            let companyStr = '';

            if (contextLines.length >= 2) {
                companyStr = contextLines[0];
                roleStr = contextLines[1];
            } else if (contextLines.length === 1) {
                roleStr = contextLines[0];
            } else if (dateLineRest.length > 3) {
                roleStr = dateLineRest;
            } else {
                roleStr = 'Unknown Role';
            }

            if (roleStr && !companyStr) {
                const parts = roleStr.split(/\s*(?:[,|•·–—]|\s+at\s+)\s*/i).map(p => p.trim()).filter(Boolean);
                companyStr = parts[0] || 'Unknown Company';
                roleStr = parts.length > 1 ? parts[1] : companyStr;
            }

            if (/^(senior|junior|lead|staff|principal|associate|analyst|manager|director|vp|intern|engineer|developer|consultant|coordinator|founder|co-founder|head of|specialist|assistant)/i.test(companyStr) && roleStr !== companyStr) {
                [companyStr, roleStr] = [roleStr, companyStr];
            }

            if (!roleStr || roleStr === 'Unknown Role') {
                if (dateLineRest.length > 3) roleStr = dateLineRest;
            }

            let description = '';
            for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
                const descLine = lines[j];
                if (detectSection(descLine) !== null) break;
                if (extractDateRange(descLine)) break;
                const isList = descLine.startsWith('•') || descLine.startsWith('-') || descLine.startsWith('–') || descLine.startsWith('*');
                if (isList) {
                    description += (description ? '\n' : '') + descLine;
                } else if (descLine.length > 40 && !isList) {
                    description += (description ? '\n' : '') + descLine;
                }
            }

            experiences.push({ company: companyStr, role: roleStr, start_date: `${dateInfo.startYear}-01-01`, end_date: dateInfo.isCurrent ? '' : `${dateInfo.endYear}-01-01`, is_current: dateInfo.isCurrent, description });
        } else if (dateInfo && currentSection === 'education') {
            let schoolStr = '';
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const candidate = lines[j];
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                if (candidate.length > 2) { schoolStr = candidate; break; }
            }
            if (!schoolStr) {
                const dateLineRest = line.replace(/((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:20|19)\d{2})/gi, '')
                    .replace(/present|current|now/gi, '')
                    .replace(/[^a-zA-Z\s]/g, ' ')
                    .trim();
                schoolStr = dateLineRest.length > 3 ? dateLineRest : 'Unknown School';
            }

            let degree = '';
            for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
                if (/\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate|B\.?S\.?|B\.?A\.?)\b/i.test(lines[j])) {
                    degree = lines[j];
                    break;
                }
            }

            educations.push({ school: schoolStr, degree, start_date: `${dateInfo.startYear}-09-01`, end_date: dateInfo.isCurrent ? '' : `${dateInfo.endYear || parseInt(dateInfo.startYear) + 4}-05-01`, is_current: dateInfo.isCurrent });
        }
    }
    return { experiences, educations };
}

async function extractTextFromPdf(file: File): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textPages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str: string; transform: number[] }>;
        const sortedItems = items
            .filter((item) => item.str && item.str.trim())
            .sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5];
                if (Math.abs(yDiff) > 3) return yDiff;
                return a.transform[4] - b.transform[4];
            });

        const lines: string[] = [];
        let currentLine: string[] = [];
        let lastY = -Infinity;
        for (const item of sortedItems) {
            const y = item.transform[5];
            if (Math.abs(y - lastY) > 3 && currentLine.length > 0) {
                lines.push(currentLine.join(' '));
                currentLine = [];
            }
            currentLine.push(item.str);
            lastY = y;
        }
        if (currentLine.length > 0) lines.push(currentLine.join(' '));
        textPages.push(lines.join('\n'));
    }

    const fullText = textPages.join('\n\n');
    if (fullText.trim().length < 10) {
        throw new Error('Could not extract text from this PDF. It may be a scanned image.');
    }
    return fullText;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ResumeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentResumeUrl?: string | null;
}

type Step = 'select' | 'review' | 'done';

export function ResumeDialog({ open, onOpenChange, currentResumeUrl }: ResumeDialogProps) {
    const [step, setStep] = useState<Step>('select');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsed, setParsed] = useState<{ experiences: ParsedExperience[]; educations: ParsedEducation[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep('select');
        setFile(null);
        setIsDragging(false);
        setIsProcessing(false);
        setParsed(null);
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const acceptFile = (selected: File) => {
        if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Please choose a PDF file.');
            return;
        }
        if (selected.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB.');
            return;
        }
        setFile(selected);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) acceptFile(selected);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) acceptFile(dropped);
    }, []);

    // Upload + parse together. Upload always; parsing is best-effort.
    const handleUploadAndParse = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadResume(formData);
            if (!result?.success) {
                toast.error(result?.error || 'Upload failed.');
                setIsProcessing(false);
                return;
            }
            toast.success('Resume saved to your profile.');

            // Best-effort: try to extract sections to offer auto-import
            try {
                const text = await extractTextFromPdf(file);
                const sections = parseResumeText(text);
                if (sections.experiences.length === 0 && sections.educations.length === 0) {
                    handleClose(false);
                    return;
                }
                setParsed(sections);
                setStep('review');
            } catch {
                handleClose(false);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Unexpected error during upload.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        if (!parsed) return;
        setIsImporting(true);
        try {
            let count = 0;
            for (const exp of parsed.experiences) {
                const fd = new FormData();
                fd.append('company', exp.company);
                fd.append('role', exp.role);
                fd.append('start_date', exp.start_date);
                if (!exp.is_current) fd.append('end_date', exp.end_date);
                if (exp.is_current) fd.append('is_current', 'on');
                fd.append('description', exp.description);
                await addExperience(fd);
                count++;
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
                count++;
            }
            toast.success(`Imported ${count} item${count !== 1 ? 's' : ''} to your profile.`);
            handleClose(false);
        } catch {
            toast.error('Failed to save some items.');
        } finally {
            setIsImporting(false);
        }
    };

    const removeExperience = (index: number) => {
        if (!parsed) return;
        setParsed({ ...parsed, experiences: parsed.experiences.filter((_, i) => i !== index) });
    };

    const removeEducation = (index: number) => {
        if (!parsed) return;
        setParsed({ ...parsed, educations: parsed.educations.filter((_, i) => i !== index) });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[620px] bg-background">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <FileText className="h-5 w-5 text-secondary" />
                        {currentResumeUrl ? 'Update Resume' : 'Upload Resume'}
                    </DialogTitle>
                    <DialogDescription>
                        Upload your PDF resume. We&apos;ll save it to your profile and offer to import any experience and education we can detect.
                    </DialogDescription>
                </DialogHeader>

                {step === 'select' && (
                    <div className="space-y-4 py-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {!file ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    'w-full h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group',
                                    isDragging
                                        ? 'border-secondary bg-secondary/10 scale-[1.02]'
                                        : 'border-border/50 hover:border-secondary/50 hover:bg-secondary/5'
                                )}
                            >
                                <div className={cn(
                                    'h-14 w-14 rounded-xl flex items-center justify-center transition-all',
                                    isDragging ? 'bg-secondary/20' : 'bg-muted/50 group-hover:bg-secondary/10'
                                )}>
                                    <FileUp className={cn(
                                        'h-7 w-7 transition-colors',
                                        isDragging ? 'text-secondary' : 'text-muted-foreground group-hover:text-secondary'
                                    )} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold">
                                        {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF resume'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        or <span className="text-secondary font-medium">click to browse</span> &bull; PDF up to 5MB
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/5 border border-secondary/20">
                                <FileText className="h-6 w-6 text-secondary shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{file.name}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                    aria-label="Remove selected file"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {currentResumeUrl && !file && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                                <FileText className="h-4 w-4 text-secondary" />
                                <span className="text-xs font-medium truncate flex-1">Current resume on file</span>
                                <a
                                    href={currentResumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-secondary uppercase hover:underline"
                                >
                                    View
                                </a>
                            </div>
                        )}

                        <Button
                            onClick={handleUploadAndParse}
                            disabled={!file || isProcessing}
                            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        >
                            {isProcessing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Upload className="mr-2 h-4 w-4" /> {currentResumeUrl ? 'Replace Resume' : 'Upload Resume'}</>
                            )}
                        </Button>
                    </div>
                )}

                {step === 'review' && parsed && (
                    <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-4">
                        <div className="rounded-xl bg-secondary/5 border border-secondary/15 p-3 flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                                Your resume was saved. We detected experience and education in the file — review and import what looks correct, or skip.
                            </p>
                        </div>

                        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
                            <div>
                                <h4 className="font-bold text-sm mb-2 text-foreground/80 border-b pb-1">
                                    Work Experience ({parsed.experiences.length})
                                </h4>
                                {parsed.experiences.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-2">No roles found.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {parsed.experiences.map((exp, i) => (
                                            <li key={i} className="bg-muted/30 p-3 rounded-lg text-sm flex items-start gap-3 group">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-foreground">{exp.role}</div>
                                                    <div className="text-secondary font-medium text-xs">{exp.company}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {exp.start_date.split('-')[0]} – {exp.is_current ? 'Present' : exp.end_date.split('-')[0]}
                                                    </div>
                                                    {exp.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>}
                                                </div>
                                                <button
                                                    onClick={() => removeExperience(i)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 shrink-0 mt-1"
                                                    title="Remove"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <h4 className="font-bold text-sm mb-2 text-foreground/80 border-b pb-1">
                                    Education ({parsed.educations.length})
                                </h4>
                                {parsed.educations.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-2">No schools found.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {parsed.educations.map((edu, i) => (
                                            <li key={i} className="bg-muted/30 p-3 rounded-lg text-sm flex items-start gap-3 group">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-foreground">{edu.school}</div>
                                                    {edu.degree && <div className="text-muted-foreground text-xs">{edu.degree}</div>}
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {edu.start_date.split('-')[0]} – {edu.is_current ? 'Present' : edu.end_date.split('-')[0]}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeEducation(i)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 shrink-0 mt-1"
                                                    title="Remove"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => handleClose(false)} disabled={isImporting}>
                                Skip
                            </Button>
                            <Button
                                className="flex-[2] bg-primary text-primary-foreground"
                                onClick={handleImport}
                                disabled={isImporting || (parsed.experiences.length === 0 && parsed.educations.length === 0)}
                            >
                                {isImporting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                                ) : (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Import {parsed.experiences.length + parsed.educations.length} Item{(parsed.experiences.length + parsed.educations.length) !== 1 ? 's' : ''}</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
