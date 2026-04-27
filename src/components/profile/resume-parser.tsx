"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { addExperience, addEducation } from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";
import { Loader2, FileText, Sparkles, CheckCircle, Upload, X } from "lucide-react";
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

/**
 * Detect if a line is education-related (not work experience)
 */
function isEducationLine(line: string): boolean {
    const lower = line.toLowerCase();
    return (
        /\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate|coursework|gpa|cum laude|magna|summa|honors)\b/i.test(lower) ||
        /\b(university|college|institute|school of|academy)\b/i.test(lower)
    );
}

/**
 * Detect common section headers
 */
function detectSection(line: string): string | null {
    const lower = line.toLowerCase().trim();
    // Exact matches
    if (['experience', 'work experience', 'employment', 'employment history', 'professional experience', 'work history', 'relevant experience'].includes(lower)) return 'experience';
    if (['education', 'education history', 'academic background', 'academics'].includes(lower)) return 'education';
    if (['skills', 'technical skills', 'projects', 'certifications', 'awards', 'activities', 'volunteer', 'interests', 'publications', 'references', 'languages', 'leadership', 'organizations', 'extracurricular'].includes(lower)) return 'other';
    // Partial matches (for headers like "EXPERIENCE:" or "Education & Training")
    if (/^(?:work\s+)?experience/i.test(lower)) return 'experience';
    if (/^education/i.test(lower)) return 'education';
    if (/^(?:skills|projects|certifications|awards|activities)/i.test(lower)) return 'other';
    return null;
}

/**
 * Extract a date range from a line
 */
function extractDateRange(line: string): { startYear: string; endYear: string; isCurrent: boolean } | null {
    const lower = line.toLowerCase();
    const isCurrent = lower.includes('present') || lower.includes('current') || lower.includes('ongoing') || lower.includes('now');

    // Match patterns like "2020 - 2023", "Jan 2020 – Present", "2020-Present"
    const yearMatch = line.match(/((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:20|19)\d{2})/gi);

    if (!yearMatch || yearMatch.length === 0) return null;

    // Extract just the year digits
    const years = yearMatch.map(m => {
        const y = m.match(/(20\d{2}|19\d{2})/);
        return y ? y[1] : '';
    }).filter(Boolean);

    if (years.length === 0) return null;

    return {
        startYear: years[0],
        endYear: years.length > 1 ? years[1] : (isCurrent ? '' : years[0]),
        isCurrent,
    };
}

/**
 * Parse raw resume text into structured experiences and educations
 */
function parseResumeText(text: string): { experiences: ParsedExperience[]; educations: ParsedEducation[] } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const experiences: ParsedExperience[] = [];
    const educations: ParsedEducation[] = [];

    let currentSection = 'unknown';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for section headers
        const section = detectSection(line);
        if (section) {
            currentSection = section;
            continue;
        }

        // Skip lines that are too short to be meaningful
        if (line.length < 3) continue;

        // Look for date-containing lines
        const dateInfo = extractDateRange(line);

        if (dateInfo && currentSection === 'experience') {
            // Skip if this line is actually education content (e.g., "B.S. Computer Science, 2020")
            if (isEducationLine(line)) continue;

            // Look backwards for the role/company line
            let roleStr = '';
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const candidate = lines[j];
                // Skip if it's a section header or a date line
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                // Skip if it's an education line that leaked in
                if (isEducationLine(candidate)) continue;
                if (candidate.length > 2) {
                    roleStr = candidate;
                    break;
                }
            }

            if (!roleStr) roleStr = 'Unknown Role';

            // Split role from company: "Senior Analyst, McKinsey" or "McKinsey | Senior Analyst"
            const parts = roleStr.split(/\s*[,|•·–—]\s*/).map(p => p.trim()).filter(Boolean);
            let company = parts[0] || 'Unknown Company';
            let role = parts.length > 1 ? parts[1] : company;

            // If the "company" looks more like a role (starts with action words), swap them
            if (/^(senior|junior|lead|staff|principal|associate|analyst|manager|director|vp|intern|engineer|developer|consultant|coordinator)/i.test(company) && parts.length > 1) {
                [company, role] = [role, company];
            }

            // Grab next lines as description (bullets or short text, not dates or headers)
            let description = '';
            for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
                const descLine = lines[j];
                if (detectSection(descLine) !== null) break;
                if (extractDateRange(descLine)) break;
                if (descLine.startsWith('•') || descLine.startsWith('-') || descLine.startsWith('–') || descLine.startsWith('*')) {
                    description += (description ? '\n' : '') + descLine;
                } else if (descLine.length > 20 && !extractDateRange(descLine)) {
                    description += (description ? '\n' : '') + descLine;
                    break; // only grab one non-bullet description line
                } else {
                    break;
                }
            }

            experiences.push({
                company,
                role,
                start_date: `${dateInfo.startYear}-01-01`,
                end_date: dateInfo.isCurrent ? '' : `${dateInfo.endYear}-01-01`,
                is_current: dateInfo.isCurrent,
                description
            });

        } else if (dateInfo && currentSection === 'education') {
            // Look backwards for school name
            let schoolStr = '';
            for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                const candidate = lines[j];
                if (detectSection(candidate) !== null) break;
                if (extractDateRange(candidate)) break;
                if (candidate.length > 2) {
                    schoolStr = candidate;
                    break;
                }
            }

            if (!schoolStr) schoolStr = 'Unknown School';

            // Try to find the degree — check the current line and the next line
            let degree = '';
            // Check if current line has degree info
            if (/\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate)\b/i.test(line)) {
                degree = line;
            }
            // Check the next line
            if (!degree && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (/\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate)\b/i.test(nextLine)) {
                    degree = nextLine;
                }
            }
            // Check the line before the school name
            if (!degree) {
                for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
                    if (/\b(bachelor|master|associate|doctorate|ph\.?d|m\.?b\.?a|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|degree|diploma|certificate)\b/i.test(lines[j])) {
                        degree = lines[j];
                        break;
                    }
                }
            }
            // No degree found — leave it blank rather than hardcoding
            if (!degree) degree = '';

            educations.push({
                school: schoolStr,
                degree,
                start_date: `${dateInfo.startYear}-09-01`,
                end_date: dateInfo.isCurrent ? '' : `${dateInfo.endYear || parseInt(dateInfo.startYear) + 4}-05-01`,
                is_current: dateInfo.isCurrent
            });
        }
    }

    return { experiences, educations };
}

/**
 * Extract text from a PDF file using the browser's built-in capabilities
 * Falls back to basic binary-to-text extraction
 */
async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Convert to string and extract text between stream markers
    // This is a lightweight approach that works for most text-based PDFs
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }

    // Strategy 1: Extract text from PDF text objects
    // PDF text is usually in BT...ET blocks with Tj or TJ operators
    const textChunks: string[] = [];

    // Look for text between parentheses in Tj operators
    const tjPattern = /\(([^)]*)\)\s*Tj/g;
    let match;
    while ((match = tjPattern.exec(binaryString)) !== null) {
        const decoded = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, ' ')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
        if (decoded.trim()) textChunks.push(decoded);
    }

    // Look for TJ arrays: [(text) kerning (text)]
    const tjArrayPattern = /\[([^\]]*)\]\s*TJ/g;
    while ((match = tjArrayPattern.exec(binaryString)) !== null) {
        const inner = match[1];
        const textParts: string[] = [];
        const partPattern = /\(([^)]*)\)/g;
        let partMatch;
        while ((partMatch = partPattern.exec(inner)) !== null) {
            textParts.push(partMatch[1]);
        }
        const combined = textParts.join('');
        if (combined.trim()) textChunks.push(combined);
    }

    if (textChunks.length > 0) {
        // Join chunks — add newlines between sections
        return textChunks
            .map(chunk => chunk.replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))))
            .join('\n')
            .replace(/\n{3,}/g, '\n\n'); // collapse excessive newlines
    }

    // Strategy 2: Fallback — extract any printable text sequences
    const printablePattern = /[\x20-\x7E]{4,}/g;
    const printableChunks: string[] = [];
    while ((match = printablePattern.exec(binaryString)) !== null) {
        const text = match[0].trim();
        // Filter out PDF operators and metadata
        if (
            text.length > 5 &&
            !text.match(/^(endobj|endstream|stream|xref|trailer|startxref|obj|\/\w+)/) &&
            !text.match(/^[\d\s.]+$/) &&
            !text.includes('/Filter') &&
            !text.includes('/Length')
        ) {
            printableChunks.push(text);
        }
    }

    if (printableChunks.length > 0) {
        return printableChunks.join('\n');
    }

    throw new Error('Could not extract text from this PDF. Try pasting the text manually instead.');
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
    const [pdfFileName, setPdfFileName] = useState<string | null>(null);
    const [isExtractingPdf, setIsExtractingPdf] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsed, setParsed] = useState<{
        experiences: ParsedExperience[];
        educations: ParsedEducation[];
    } | null>(null);

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 10MB.');
            return;
        }

        setIsExtractingPdf(true);
        setPdfFileName(file.name);

        try {
            const text = await extractTextFromPdf(file);
            if (text.trim().length < 20) {
                toast.warning("Could not extract much text from this PDF. It may be a scanned image. Try pasting the text manually.");
                setRawText(text);
            } else {
                setRawText(text);
                toast.success(`Extracted text from "${file.name}"`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to extract text from PDF.');
        } finally {
            setIsExtractingPdf(false);
        }
    };

    const clearPdf = () => {
        setPdfFileName(null);
        setRawText("");
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleParse = async () => {
        if (!rawText.trim()) {
            toast.error("Please paste your resume text or upload a PDF first.");
            return;
        }

        setIsParsing(true);
        await new Promise(resolve => setTimeout(resolve, 600));

        try {
            const { experiences, educations } = parseResumeText(rawText);

            if (experiences.length === 0 && educations.length === 0 && rawText.length > 100) {
                toast.warning("Could not clearly parse sections. Try formatting with clear 'Experience' and 'Education' headers.");
                experiences.push({
                    company: "Imported Profile",
                    role: "Professional Experience",
                    start_date: "2020-01-01",
                    end_date: "",
                    is_current: true,
                    description: rawText.substring(0, 500) + (rawText.length > 500 ? "..." : "")
                });
            } else {
                toast.success(`Found ${experiences.length} role${experiences.length !== 1 ? 's' : ''} and ${educations.length} school${educations.length !== 1 ? 's' : ''}.`);
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
            setPdfFileName(null);
        } catch (e) {
            toast.error("Failed to save some items.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setParsed(null); setPdfFileName(null); } onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[600px] bg-background">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-secondary" />
                        Import Resume
                    </DialogTitle>
                    <DialogDescription>
                        Upload a PDF or paste your resume text. Our parser will extract your work history and education.
                    </DialogDescription>
                </DialogHeader>

                {!parsed ? (
                    <div className="space-y-4 py-4">
                        {/* PDF Upload Zone */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handlePdfUpload}
                        />

                        {pdfFileName ? (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                                <FileText className="h-5 w-5 text-secondary shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{pdfFileName}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {isExtractingPdf ? 'Extracting text...' : 'Text extracted — review below'}
                                    </p>
                                </div>
                                {isExtractingPdf ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                                ) : (
                                    <button onClick={clearPdf} className="text-muted-foreground hover:text-foreground transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isExtractingPdf}
                                className="w-full h-24 rounded-xl border-2 border-dashed border-border/50 hover:border-secondary/50 hover:bg-secondary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-secondary transition-colors" />
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-secondary transition-colors">
                                    Click to upload PDF resume
                                </span>
                            </button>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border/50" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">or paste text</span>
                            <div className="flex-1 h-px bg-border/50" />
                        </div>

                        <Textarea
                            placeholder="Paste your plain text resume here..."
                            className="min-h-[200px] resize-none font-mono text-xs bg-muted/20"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button
                                onClick={handleParse}
                                disabled={isParsing || isExtractingPdf || !rawText}
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
                                                {exp.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                                                )}
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
                                                {edu.degree && <div className="text-muted-foreground text-xs">{edu.degree}</div>}
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
