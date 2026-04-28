"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { addExperience, addEducation } from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";
import { Loader2, FileText, Sparkles, CheckCircle, Upload, X, FileUp } from "lucide-react";
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
            let roleStr = '';
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const candidate = lines[j];
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                if (isEducationLine(candidate)) continue;
                if (candidate.length > 2) { roleStr = candidate; break; }
            }
            if (!roleStr) roleStr = 'Unknown Role';
            const parts = roleStr.split(/\s*[,|•·–—]\s*/).map(p => p.trim()).filter(Boolean);
            let company = parts[0] || 'Unknown Company';
            let role = parts.length > 1 ? parts[1] : company;
            if (/^(senior|junior|lead|staff|principal|associate|analyst|manager|director|vp|intern|engineer|developer|consultant|coordinator)/i.test(company) && parts.length > 1) {
                [company, role] = [role, company];
            }
            let description = '';
            for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
                const descLine = lines[j];
                if (detectSection(descLine) !== null) break;
                if (extractDateRange(descLine)) break;
                if (descLine.startsWith('•') || descLine.startsWith('-') || descLine.startsWith('–') || descLine.startsWith('*')) {
                    description += (description ? '\n' : '') + descLine;
                } else if (descLine.length > 20 && !extractDateRange(descLine)) {
                    description += (description ? '\n' : '') + descLine;
                    break;
                } else { break; }
            }
            experiences.push({ company, role, start_date: `${dateInfo.startYear}-01-01`, end_date: dateInfo.isCurrent ? '' : `${dateInfo.endYear}-01-01`, is_current: dateInfo.isCurrent, description });
        } else if (dateInfo && currentSection === 'education') {
            let schoolStr = '';
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const candidate = lines[j];
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                if (candidate.length > 2) { schoolStr = candidate; break; }
            }
            if (!schoolStr) schoolStr = 'Unknown School';
            let degree = '';
            if (/\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate)\b/i.test(line)) degree = line;
            if (!degree && i + 1 < lines.length && /\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate)\b/i.test(lines[i + 1])) degree = lines[i + 1];
            educations.push({ school: schoolStr, degree, start_date: `${dateInfo.startYear}-09-01`, end_date: dateInfo.isCurrent ? '' : `${dateInfo.endYear || parseInt(dateInfo.startYear) + 4}-05-01`, is_current: dateInfo.isCurrent });
        }
    }
    return { experiences, educations };
}

// ─── PDF Text Extraction using pdf.js ────────────────────────────────────────

async function extractTextFromPdf(file: File): Promise<string> {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // Disable the web worker — run PDF parsing on the main thread.
    // This avoids CDN/worker loading issues in Next.js and is fast enough
    // for text extraction from resumes (not rendering full pages).
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
    }).promise;

    const textPages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Group text items by their Y position to reconstruct lines
        const items = textContent.items as Array<{ str: string; transform: number[] }>;

        // Sort by Y position (descending - top of page first) then X position
        const sortedItems = items
            .filter((item) => item.str && item.str.trim())
            .sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5];
                if (Math.abs(yDiff) > 3) return yDiff; // different line
                return a.transform[4] - b.transform[4]; // same line, sort by X
            });

        // Group items into lines based on Y coordinate proximity
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
        if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
        }

        textPages.push(lines.join('\n'));
    }

    const fullText = textPages.join('\n\n');

    if (fullText.trim().length < 10) {
        throw new Error('Could not extract text from this PDF. It may be a scanned image. Try pasting the text manually.');
    }

    return fullText;
}

// ─── Main Component ──────────────────────────────────────────────────────────

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
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsed, setParsed] = useState<{
        experiences: ParsedExperience[];
        educations: ParsedEducation[];
    } | null>(null);

    const resetState = () => {
        setParsed(null);
        setRawText("");
        setUploadedFileName(null);
        setIsExtracting(false);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Process a PDF file (shared between click-upload and drag-drop) ──

    const processPdfFile = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            toast.error('Please upload a PDF file.');
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 15MB.');
            return;
        }

        setIsExtracting(true);
        setUploadedFileName(file.name);

        try {
            const text = await extractTextFromPdf(file);
            setRawText(text);
            toast.success(`Extracted ${text.split('\n').filter(l => l.trim()).length} lines from "${file.name}"`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to extract text from PDF.');
            setUploadedFileName(null);
        } finally {
            setIsExtracting(false);
        }
    }, []);

    // ── File input handler ──

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await processPdfFile(file);
    };

    // ── Drag and drop handlers ──

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

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) await processPdfFile(file);
    }, [processPdfFile]);

    // ── Parse text ──

    const handleParse = async () => {
        if (!rawText.trim()) {
            toast.error("Please paste your resume text or upload a PDF first.");
            return;
        }
        setIsParsing(true);
        await new Promise(resolve => setTimeout(resolve, 400));
        try {
            const result = parseResumeText(rawText);
            if (result.experiences.length === 0 && result.educations.length === 0 && rawText.length > 100) {
                toast.warning("Could not clearly parse sections. Make sure your resume has 'Experience' and 'Education' headers.");
            } else {
                toast.success(`Found ${result.experiences.length} role${result.experiences.length !== 1 ? 's' : ''} and ${result.educations.length} school${result.educations.length !== 1 ? 's' : ''}.`);
            }
            setParsed(result);
        } catch {
            toast.error("Error parsing resume.");
        } finally {
            setIsParsing(false);
        }
    };

    // ── Import to profile ── 

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
            resetState();
        } catch {
            toast.error("Failed to save some items.");
        } finally {
            setIsImporting(false);
        }
    };

    // ── Remove items before importing ──

    const removeExperience = (index: number) => {
        if (!parsed) return;
        setParsed({ ...parsed, experiences: parsed.experiences.filter((_, i) => i !== index) });
    };

    const removeEducation = (index: number) => {
        if (!parsed) return;
        setParsed({ ...parsed, educations: parsed.educations.filter((_, i) => i !== index) });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[620px] bg-background">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-secondary" />
                        Import Resume
                    </DialogTitle>
                    <DialogDescription>
                        Upload your PDF resume or paste text to automatically extract your experience and education.
                    </DialogDescription>
                </DialogHeader>

                {!parsed ? (
                    <div className="space-y-4 py-2">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* PDF Upload / Drag-Drop Zone */}
                        {uploadedFileName ? (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                                <FileText className="h-6 w-6 text-secondary shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{uploadedFileName}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {isExtracting ? 'Extracting text from PDF...' : `${rawText.split('\n').filter(l => l.trim()).length} lines extracted — review and extract below`}
                                    </p>
                                </div>
                                {isExtracting ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                                ) : (
                                    <button onClick={resetState} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "w-full h-32 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group",
                                    isDragging
                                        ? "border-secondary bg-secondary/10 scale-[1.02]"
                                        : "border-border/50 hover:border-secondary/50 hover:bg-secondary/5"
                                )}
                            >
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                                    isDragging ? "bg-secondary/20" : "bg-muted/50 group-hover:bg-secondary/10"
                                )}>
                                    <FileUp className={cn(
                                        "h-6 w-6 transition-colors",
                                        isDragging ? "text-secondary" : "text-muted-foreground group-hover:text-secondary"
                                    )} />
                                </div>
                                <div className="text-center">
                                    <p className={cn(
                                        "text-sm font-semibold transition-colors",
                                        isDragging ? "text-secondary" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {isDragging ? "Drop your PDF here" : "Drag & drop your PDF resume"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        or <span className="text-secondary font-medium">click to browse</span> • PDF up to 15MB
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border/50" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">or paste text</span>
                            <div className="flex-1 h-px bg-border/50" />
                        </div>

                        {/* Text paste area */}
                        <Textarea
                            placeholder={"Paste your resume text here...\n\nTip: Copy from LinkedIn, a Word doc, or any text source.\nMake sure it has clear 'Experience' and 'Education' sections."}
                            className="min-h-[160px] resize-none font-mono text-xs bg-muted/20 leading-relaxed"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                        />

                        {/* Extract button */}
                        <Button
                            onClick={handleParse}
                            disabled={isParsing || isExtracting || !rawText.trim()}
                            className="bg-secondary text-white hover:bg-secondary/90 w-full rounded-xl h-11 text-sm font-semibold"
                        >
                            {isParsing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting...</>
                            ) : (
                                <><Sparkles className="mr-2 h-4 w-4" /> Extract Experience & Education</>
                            )}
                        </Button>
                    </div>
                ) : (
                    /* ── Results View ── */
                    <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-2">
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

                            {/* Education */}
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

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={resetState}>
                                ← Back
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
