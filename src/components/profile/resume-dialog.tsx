"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    Pencil,
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

const MONTHS: Record<string, string> = {
    jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
    apr: '04', april: '04', may: '05', jun: '06', june: '06',
    jul: '07', july: '07', aug: '08', august: '08', sep: '09', sept: '09', september: '09',
    oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
};

function isEducationLine(line: string): boolean {
    return (
        /\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?c?|b\.?a\.?|m\.?s\.?c?|m\.?a\.?|degree|diploma|certificate|coursework|gpa|cum laude|magna|summa|honors)\b/i.test(line) ||
        /\b(university|college|institute|school of|academy|polytechnic)\b/i.test(line)
    );
}

const ROLE_TITLES = /^(senior|junior|lead|staff|principal|associate|analyst|manager|director|vp|vice president|intern|engineer|developer|consultant|coordinator|founder|co-founder|head of|specialist|assistant|executive|officer|architect|designer|researcher|scientist|professor|lecturer|teacher|counsel|attorney|paralegal|nurse|physician|therapist|accountant|auditor|trader|advisor|planner|recruiter|editor|producer|strategist)/i;

function detectSection(line: string): string | null {
    const lower = line.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    if (/^(work\s+)?experience|^professional\s+experience|^employment(\s+history)?|^work\s+history|^relevant\s+experience|^career\s+history/.test(lower)) return 'experience';
    if (/^education(\s+history)?|^academic\s+(background|history)|^academics/.test(lower)) return 'education';
    if (/^(skills|technical\s+skills|projects|certifications|awards|activities|volunteer|interests|publications|references|languages|leadership|organizations|extracurricular|summary|objective|profile|professional\s+summary|about\s+me|core\s+competencies|training|licenses|hobbies|additional)/.test(lower)) return 'other';
    return null;
}

interface DateRange {
    startDate: string;
    endDate: string;
    isCurrent: boolean;
}

function monthToNum(m: string): string {
    return MONTHS[m.toLowerCase().replace(/\.$/, '')] || '01';
}

function extractDateRange(line: string): DateRange | null {
    const lower = line.toLowerCase();
    const isCurrent = /\b(present|current|ongoing|now)\b/i.test(lower);

    // Match patterns like "Jan 2020 – Mar 2022", "January 2020 - Present", "2019 - 2023", "05/2020 – 12/2022"
    const monthYearPat = /(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+)?((?:19|20)\d{2})/gi;
    const numericPat = /(\d{1,2})\/((?:19|20)\d{2})/g;

    interface DatePart { month: string; year: string }
    const parts: DatePart[] = [];

    let match;
    while ((match = monthYearPat.exec(line)) !== null) {
        parts.push({ month: match[1] ? monthToNum(match[1]) : '01', year: match[2] });
    }
    while ((match = numericPat.exec(line)) !== null) {
        const m = match[1].padStart(2, '0');
        if (parseInt(m) >= 1 && parseInt(m) <= 12) {
            parts.push({ month: m, year: match[2] });
        }
    }

    if (parts.length === 0) return null;

    parts.sort((a, b) => {
        const diff = parseInt(a.year) - parseInt(b.year);
        return diff !== 0 ? diff : parseInt(a.month) - parseInt(b.month);
    });

    const start = parts[0];
    const end = parts.length > 1 ? parts[parts.length - 1] : (isCurrent ? null : start);

    return {
        startDate: `${start.year}-${start.month}-01`,
        endDate: end ? `${end.year}-${end.month}-01` : '',
        isCurrent,
    };
}

function stripDates(line: string): string {
    return line
        .replace(/(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}/gi, '')
        .replace(/\d{1,2}\/(?:19|20)\d{2}/g, '')
        .replace(/\b(present|current|ongoing|now)\b/gi, '')
        .replace(/[–—\-|,]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function splitRoleCompany(text: string): { role: string; company: string } {
    // Try common separators: "Role at Company", "Role, Company", "Role | Company", "Role – Company"
    const atSplit = text.split(/\s+at\s+/i);
    if (atSplit.length === 2 && atSplit[0].length > 2 && atSplit[1].length > 2) {
        return { role: atSplit[0].trim(), company: atSplit[1].trim() };
    }
    const sepSplit = text.split(/\s*[|•·–—,]\s*/).map(p => p.trim()).filter(p => p.length > 1);
    if (sepSplit.length >= 2) {
        // Heuristic: if the first part looks like a role title, it's the role
        if (ROLE_TITLES.test(sepSplit[0])) {
            return { role: sepSplit[0], company: sepSplit.slice(1).join(', ') };
        }
        if (ROLE_TITLES.test(sepSplit[1])) {
            return { role: sepSplit[1], company: sepSplit[0] };
        }
        // Default: first = company, second = role (common resume layout)
        return { role: sepSplit[1], company: sepSplit[0] };
    }
    return { role: text, company: '' };
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

            // Gather context lines above the date line (role, company)
            const contextLines: string[] = [];
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const candidate = lines[j];
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                if (isEducationLine(candidate)) continue;
                if (candidate.length > 2) contextLines.push(candidate);
            }
            contextLines.reverse();

            const dateLineRest = stripDates(line);

            let roleStr = '';
            let companyStr = '';

            if (contextLines.length >= 2) {
                // Two lines above: could be Company then Role, or Role then Company
                const first = contextLines[0];
                const second = contextLines[1];
                if (ROLE_TITLES.test(second) || isEducationLine(first)) {
                    companyStr = first;
                    roleStr = second;
                } else if (ROLE_TITLES.test(first)) {
                    roleStr = first;
                    companyStr = second;
                } else {
                    companyStr = first;
                    roleStr = second;
                }
            } else if (contextLines.length === 1) {
                const parsed = splitRoleCompany(contextLines[0]);
                roleStr = parsed.role;
                companyStr = parsed.company;
            } else if (dateLineRest.length > 3) {
                const parsed = splitRoleCompany(dateLineRest);
                roleStr = parsed.role;
                companyStr = parsed.company;
            }

            // If role looks like a company name and company looks like a role, swap
            if (companyStr && ROLE_TITLES.test(companyStr) && !ROLE_TITLES.test(roleStr)) {
                [companyStr, roleStr] = [roleStr, companyStr];
            }

            if (!roleStr) roleStr = dateLineRest.length > 3 ? dateLineRest : 'Unknown Role';
            if (!companyStr) companyStr = 'Unknown Company';

            // Collect bullet points / description below
            let description = '';
            for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
                const descLine = lines[j];
                if (detectSection(descLine) !== null) break;
                if (extractDateRange(descLine) && !descLine.startsWith('•') && !descLine.startsWith('-')) break;
                const isBullet = /^[•\-–*▪◦]/.test(descLine);
                if (isBullet || descLine.length > 30) {
                    description += (description ? '\n' : '') + descLine;
                } else if (descLine.length <= 30 && !isBullet) {
                    break;
                }
            }

            // Deduplicate: skip if we already have an entry with same company + role
            const isDupe = experiences.some(e =>
                e.company.toLowerCase() === companyStr.toLowerCase() &&
                e.role.toLowerCase() === roleStr.toLowerCase()
            );
            if (!isDupe) {
                experiences.push({ company: companyStr, role: roleStr, start_date: dateInfo.startDate, end_date: dateInfo.endDate, is_current: dateInfo.isCurrent, description });
            }
        } else if (dateInfo && currentSection === 'education') {
            // Look for school name above the date line
            let schoolStr = '';
            let degree = '';
            for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
                const candidate = lines[j];
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                if (candidate.length < 3) continue;

                if (!schoolStr && /\b(university|college|institute|school|academy|polytechnic)\b/i.test(candidate)) {
                    schoolStr = candidate;
                } else if (!degree && /\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?c?|b\.?a\.?|m\.?s\.?c?|m\.?a\.?|degree|diploma|certificate)\b/i.test(candidate)) {
                    degree = candidate;
                }
            }

            // Also check lines below for degree
            if (!degree) {
                for (let j = i + 1; j <= Math.min(lines.length - 1, i + 3); j++) {
                    if (detectSection(lines[j]) !== null) break;
                    if (/\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?c?|b\.?a\.?|m\.?s\.?c?|m\.?a\.?|degree|diploma|certificate)\b/i.test(lines[j])) {
                        degree = lines[j];
                        break;
                    }
                }
            }

            if (!schoolStr) {
                const rest = stripDates(line);
                schoolStr = rest.length > 3 ? rest : 'Unknown School';
            }

            const isDupe = educations.some(e => e.school.toLowerCase() === schoolStr.toLowerCase());
            if (!isDupe) {
                educations.push({
                    school: schoolStr,
                    degree,
                    start_date: dateInfo.startDate,
                    end_date: dateInfo.endDate || (dateInfo.isCurrent ? '' : `${parseInt(dateInfo.startDate) + 4}-05-01`),
                    is_current: dateInfo.isCurrent,
                });
            }
        } else if (dateInfo && currentSection === 'unknown') {
            // No section header yet — infer from content
            if (isEducationLine(line) || (i > 0 && isEducationLine(lines[i - 1]))) {
                currentSection = 'education';
                i--;
            } else {
                currentSection = 'experience';
                i--;
            }
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
    const router = useRouter();
    const [step, setStep] = useState<Step>('select');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsed, setParsed] = useState<{ experiences: ParsedExperience[]; educations: ParsedEducation[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [editingExpIdx, setEditingExpIdx] = useState<number | null>(null);
    const [expDraft, setExpDraft] = useState<ParsedExperience | null>(null);
    const [editingEduIdx, setEditingEduIdx] = useState<number | null>(null);
    const [eduDraft, setEduDraft] = useState<ParsedEducation | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep('select');
        setFile(null);
        setIsDragging(false);
        setIsProcessing(false);
        setParsed(null);
        setIsImporting(false);
        setEditingExpIdx(null);
        setExpDraft(null);
        setEditingEduIdx(null);
        setEduDraft(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];

    const acceptFile = (selected: File) => {
        const ext = selected.name.toLowerCase().slice(selected.name.lastIndexOf('.'));
        if (!ALLOWED_TYPES.includes(selected.type) && !ALLOWED_EXTS.includes(ext)) {
            toast.error('Please choose a PDF, JPEG, or PNG file.');
            return;
        }
        if (selected.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB.');
            return;
        }
        setFile(selected);
    };

    const isImageFile = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png)$/i.test(f.name);

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
            router.refresh();

            if (isImageFile(file)) {
                toast.info('Image resume saved. Upload a PDF to auto-import experience and education.');
                handleClose(false);
                return;
            }

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
                toast.error('Could not parse your PDF. Your resume was still saved.');
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
            router.refresh();
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
                        Upload your resume as a PDF, JPEG, or PNG. PDFs will be scanned to auto-import experience and education.
                    </DialogDescription>
                </DialogHeader>

                {step === 'select' && (
                    <div className="space-y-4 py-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
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
                                        {isDragging ? 'Drop your file here' : 'Drag & drop your resume'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        or <span className="text-secondary font-medium">click to browse</span> &bull; PDF, JPEG, or PNG up to 5MB
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
                                Your resume was saved. Review and edit the detected items before importing, or skip.
                            </p>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {/* Experiences */}
                            <div>
                                <h4 className="font-bold text-sm mb-2 text-foreground/80 border-b pb-1">
                                    Work Experience ({parsed.experiences.length})
                                </h4>
                                {parsed.experiences.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-2">No roles found.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {parsed.experiences.map((exp, i) => (
                                            <li key={i} className="bg-muted/30 rounded-lg text-sm group">
                                                {editingExpIdx === i && expDraft ? (
                                                    <div className="p-3 space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Role</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    value={expDraft.role}
                                                                    onChange={e => setExpDraft({ ...expDraft, role: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Company</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    value={expDraft.company}
                                                                    onChange={e => setExpDraft({ ...expDraft, company: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Start</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    type="date"
                                                                    value={expDraft.start_date}
                                                                    onChange={e => setExpDraft({ ...expDraft, start_date: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">End</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    type="date"
                                                                    value={expDraft.end_date}
                                                                    disabled={expDraft.is_current}
                                                                    onChange={e => setExpDraft({ ...expDraft, end_date: e.target.value })}
                                                                />
                                                                <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-gray-300"
                                                                        checked={expDraft.is_current}
                                                                        onChange={e => setExpDraft({ ...expDraft, is_current: e.target.checked, end_date: e.target.checked ? '' : expDraft.end_date })}
                                                                    />
                                                                    <span className="text-[10px] text-muted-foreground">Current</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                                                            <Textarea
                                                                className="text-xs mt-0.5 min-h-[56px] resize-none"
                                                                value={expDraft.description}
                                                                onChange={e => setExpDraft({ ...expDraft, description: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 h-7 text-xs"
                                                                onClick={() => { setEditingExpIdx(null); setExpDraft(null); }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 h-7 text-xs"
                                                                onClick={() => {
                                                                    const next = [...parsed.experiences];
                                                                    next[i] = expDraft;
                                                                    setParsed({ ...parsed, experiences: next });
                                                                    setEditingExpIdx(null);
                                                                    setExpDraft(null);
                                                                }}
                                                            >
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3 p-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-foreground">{exp.role}</div>
                                                            <div className="text-secondary font-medium text-xs">{exp.company}</div>
                                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                                {exp.start_date.split('-')[0]} – {exp.is_current ? 'Present' : exp.end_date.split('-')[0]}
                                                            </div>
                                                            {exp.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                            <button
                                                                onClick={() => { setEditingExpIdx(i); setExpDraft({ ...exp }); }}
                                                                className="text-muted-foreground hover:text-foreground p-0.5"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeExperience(i)}
                                                                className="text-muted-foreground hover:text-red-500 ml-1 p-0.5"
                                                                title="Remove"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Educations */}
                            <div>
                                <h4 className="font-bold text-sm mb-2 text-foreground/80 border-b pb-1">
                                    Education ({parsed.educations.length})
                                </h4>
                                {parsed.educations.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-2">No schools found.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {parsed.educations.map((edu, i) => (
                                            <li key={i} className="bg-muted/30 rounded-lg text-sm group">
                                                {editingEduIdx === i && eduDraft ? (
                                                    <div className="p-3 space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">School</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    value={eduDraft.school}
                                                                    onChange={e => setEduDraft({ ...eduDraft, school: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Degree</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    value={eduDraft.degree}
                                                                    onChange={e => setEduDraft({ ...eduDraft, degree: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Start</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    type="date"
                                                                    value={eduDraft.start_date}
                                                                    onChange={e => setEduDraft({ ...eduDraft, start_date: e.target.value })}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">End</label>
                                                                <Input
                                                                    className="h-7 text-xs mt-0.5"
                                                                    type="date"
                                                                    value={eduDraft.end_date}
                                                                    disabled={eduDraft.is_current}
                                                                    onChange={e => setEduDraft({ ...eduDraft, end_date: e.target.value })}
                                                                />
                                                                <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-gray-300"
                                                                        checked={eduDraft.is_current}
                                                                        onChange={e => setEduDraft({ ...eduDraft, is_current: e.target.checked, end_date: e.target.checked ? '' : eduDraft.end_date })}
                                                                    />
                                                                    <span className="text-[10px] text-muted-foreground">Current</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 h-7 text-xs"
                                                                onClick={() => { setEditingEduIdx(null); setEduDraft(null); }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 h-7 text-xs"
                                                                onClick={() => {
                                                                    const next = [...parsed.educations];
                                                                    next[i] = eduDraft;
                                                                    setParsed({ ...parsed, educations: next });
                                                                    setEditingEduIdx(null);
                                                                    setEduDraft(null);
                                                                }}
                                                            >
                                                                Save
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3 p-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-foreground">{edu.school}</div>
                                                            {edu.degree && <div className="text-muted-foreground text-xs">{edu.degree}</div>}
                                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                                {edu.start_date.split('-')[0]} – {edu.is_current ? 'Present' : edu.end_date.split('-')[0]}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                            <button
                                                                onClick={() => { setEditingEduIdx(i); setEduDraft({ ...edu }); }}
                                                                className="text-muted-foreground hover:text-foreground p-0.5"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeEducation(i)}
                                                                className="text-muted-foreground hover:text-red-500 ml-1 p-0.5"
                                                                title="Remove"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
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
