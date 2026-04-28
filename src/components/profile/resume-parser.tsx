"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { addExperience, addEducation } from "@/app/(dashboard)/profile/actions";
import { toast } from "sonner";
import { Loader2, FileText, Sparkles, CheckCircle, Upload, X, Linkedin, ArrowRight, Info } from "lucide-react";
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

// ─── LinkedIn CSV Parsing ────────────────────────────────────────────────────

/**
 * Parse a CSV string into rows of key-value objects.
 * Handles quoted fields with commas and newlines inside them.
 */
function parseCSV(csvText: string): Record<string, string>[] {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < csvText.length && csvText[i + 1] === '"') {
                current += '"'; // escaped quote
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === '\n' && !inQuotes) {
            lines.push(current);
            current = '';
        } else if (ch === '\r' && !inQuotes) {
            // skip carriage returns
        } else {
            current += ch;
        }
    }
    if (current.trim()) lines.push(current);

    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let val = '';
        let inQ = false;
        for (let j = 0; j < lines[i].length; j++) {
            const ch = lines[i][j];
            if (ch === '"') {
                if (inQ && j + 1 < lines[i].length && lines[i][j + 1] === '"') {
                    val += '"';
                    j++;
                } else {
                    inQ = !inQ;
                }
            } else if (ch === ',' && !inQ) {
                values.push(val.trim());
                val = '';
            } else {
                val += ch;
            }
        }
        values.push(val.trim());

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        rows.push(row);
    }

    return rows;
}

/**
 * Convert LinkedIn month-year string ("Jan 2020" or "January 2020") to ISO date
 */
function linkedinDateToISO(dateStr: string): string {
    if (!dateStr || !dateStr.trim()) return '';
    const clean = dateStr.trim();

    // Try "Month Year" format
    const monthMap: Record<string, string> = {
        'jan': '01', 'january': '01', 'feb': '02', 'february': '02',
        'mar': '03', 'march': '03', 'apr': '04', 'april': '04',
        'may': '05', 'jun': '06', 'june': '06', 'jul': '07', 'july': '07',
        'aug': '08', 'august': '08', 'sep': '09', 'september': '09',
        'oct': '10', 'october': '10', 'nov': '11', 'november': '11',
        'dec': '12', 'december': '12',
    };

    const match = clean.match(/^(\w+)\s+(\d{4})$/);
    if (match) {
        const monthKey = match[1].toLowerCase();
        const month = monthMap[monthKey];
        const year = match[2];
        if (month) return `${year}-${month}-01`;
    }

    // Try just year
    const yearOnly = clean.match(/^(\d{4})$/);
    if (yearOnly) return `${yearOnly[1]}-01-01`;

    return '';
}

/**
 * Parse LinkedIn Positions.csv export
 * Expected columns: Company Name, Title, Description, Location, Started On, Finished On
 */
function parseLinkedInPositions(csvText: string): ParsedExperience[] {
    const rows = parseCSV(csvText);
    return rows
        .filter(r => r['Company Name'] || r['Title'])
        .map(r => {
            const isCurrent = !r['Finished On'] || !r['Finished On'].trim();
            return {
                company: r['Company Name'] || 'Unknown Company',
                role: r['Title'] || 'Unknown Role',
                start_date: linkedinDateToISO(r['Started On']) || '2020-01-01',
                end_date: isCurrent ? '' : linkedinDateToISO(r['Finished On']),
                is_current: isCurrent,
                description: r['Description'] || '',
            };
        });
}

/**
 * Parse LinkedIn Education.csv export
 * Expected columns: School Name, Degree Name, Notes, Start Date, End Date, Activities
 */
function parseLinkedInEducation(csvText: string): ParsedEducation[] {
    const rows = parseCSV(csvText);
    return rows
        .filter(r => r['School Name'])
        .map(r => {
            const isCurrent = !r['End Date'] || !r['End Date'].trim();
            return {
                school: r['School Name'] || 'Unknown School',
                degree: r['Degree Name'] || '',
                start_date: linkedinDateToISO(r['Start Date']) || '2016-09-01',
                end_date: isCurrent ? '' : linkedinDateToISO(r['End Date']),
                is_current: isCurrent,
            };
        });
}

// ─── Resume Text Parsing (unchanged from previous version) ───────────────────

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

// ─── PDF Text Extraction ─────────────────────────────────────────────────────

async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
    }

    const textChunks: string[] = [];
    const tjPattern = /\(([^)]*)\)\s*Tj/g;
    let match;
    while ((match = tjPattern.exec(binaryString)) !== null) {
        const decoded = match[1].replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\t/g, ' ').replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\\/g, '\\');
        if (decoded.trim()) textChunks.push(decoded);
    }
    const tjArrayPattern = /\[([^\]]*)\]\s*TJ/g;
    while ((match = tjArrayPattern.exec(binaryString)) !== null) {
        const inner = match[1];
        const textParts: string[] = [];
        const partPattern = /\(([^)]*)\)/g;
        let partMatch;
        while ((partMatch = partPattern.exec(inner)) !== null) { textParts.push(partMatch[1]); }
        const combined = textParts.join('');
        if (combined.trim()) textChunks.push(combined);
    }
    if (textChunks.length > 0) {
        return textChunks.map(chunk => chunk.replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))).join('\n').replace(/\n{3,}/g, '\n\n');
    }
    const printablePattern = /[\x20-\x7E]{4,}/g;
    const printableChunks: string[] = [];
    while ((match = printablePattern.exec(binaryString)) !== null) {
        const text = match[0].trim();
        if (text.length > 5 && !text.match(/^(endobj|endstream|stream|xref|trailer|startxref|obj|\/\w+)/) && !text.match(/^[\d\s.]+$/) && !text.includes('/Filter') && !text.includes('/Length')) {
            printableChunks.push(text);
        }
    }
    if (printableChunks.length > 0) return printableChunks.join('\n');
    throw new Error('Could not extract text from this PDF. Try pasting the text manually instead.');
}

// ─── Main Component ──────────────────────────────────────────────────────────

type ImportTab = 'linkedin' | 'resume';

export function ResumeParser({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [activeTab, setActiveTab] = useState<ImportTab>('linkedin');
    const [rawText, setRawText] = useState("");
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const linkedinFileRef = useRef<HTMLInputElement>(null);
    const [parsed, setParsed] = useState<{
        experiences: ParsedExperience[];
        educations: ParsedEducation[];
    } | null>(null);

    const resetState = () => {
        setParsed(null);
        setRawText("");
        setUploadedFileName(null);
        setIsExtracting(false);
    };

    // ── LinkedIn CSV/ZIP Upload Handler ──

    const handleLinkedInUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        setUploadedFileName(file.name);

        try {
            let positionsText = '';
            let educationText = '';

            if (file.name.endsWith('.zip')) {
                // Handle LinkedIn data export ZIP
                // We need to find Positions.csv and Education.csv inside the ZIP
                // Using JSZip-like approach with the built-in DecompressionStream
                const arrayBuffer = await file.arrayBuffer();
                const blob = new Blob([arrayBuffer]);

                // Try to find CSV files by reading the ZIP as text and looking for CSV content
                // Simple ZIP parsing: look for local file headers
                const bytes = new Uint8Array(arrayBuffer);
                const decoder = new TextDecoder('utf-8', { fatal: false });

                // Find file entries in ZIP (local file header signature: 0x04034b50)
                const files: { name: string; content: string }[] = [];
                for (let i = 0; i < bytes.length - 4; i++) {
                    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4B && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
                        // Local file header found
                        const nameLen = bytes[i + 26] | (bytes[i + 27] << 8);
                        const extraLen = bytes[i + 28] | (bytes[i + 29] << 8);
                        const compSize = bytes[i + 18] | (bytes[i + 19] << 8) | (bytes[i + 20] << 16) | (bytes[i + 21] << 24);
                        const compMethod = bytes[i + 8] | (bytes[i + 9] << 8);

                        const nameStart = i + 30;
                        const fileName = decoder.decode(bytes.slice(nameStart, nameStart + nameLen));
                        const dataStart = nameStart + nameLen + extraLen;

                        // Only handle uncompressed (stored) files for simplicity
                        if (compMethod === 0 && compSize > 0) {
                            const content = decoder.decode(bytes.slice(dataStart, dataStart + compSize));
                            files.push({ name: fileName, content });
                        }
                    }
                }

                const posFile = files.find(f => f.name.toLowerCase().includes('positions') && f.name.endsWith('.csv'));
                const eduFile = files.find(f => f.name.toLowerCase().includes('education') && f.name.endsWith('.csv'));

                if (posFile) positionsText = posFile.content;
                if (eduFile) educationText = eduFile.content;

                if (!posFile && !eduFile) {
                    // If ZIP parsing didn't work (compressed files), give user instructions
                    toast.error("Could not read ZIP file. Please unzip it first and upload the individual CSV files, or paste the data as text.");
                    setIsExtracting(false);
                    return;
                }

            } else if (file.name.endsWith('.csv')) {
                // Single CSV file — detect which one it is
                const text = await file.text();
                const firstLine = text.split('\n')[0].toLowerCase();

                if (firstLine.includes('company name') || firstLine.includes('title')) {
                    positionsText = text;
                } else if (firstLine.includes('school name') || firstLine.includes('degree')) {
                    educationText = text;
                } else {
                    // Try both parsers
                    positionsText = text;
                    educationText = text;
                }
            } else {
                toast.error("Please upload a .csv or .zip file from your LinkedIn data export.");
                setIsExtracting(false);
                return;
            }

            // Parse the CSVs
            const experiences = positionsText ? parseLinkedInPositions(positionsText) : [];
            const educations = educationText ? parseLinkedInEducation(educationText) : [];

            if (experiences.length === 0 && educations.length === 0) {
                toast.warning("No data found. Make sure you uploaded Positions.csv or Education.csv from your LinkedIn export.");
            } else {
                toast.success(`Found ${experiences.length} role${experiences.length !== 1 ? 's' : ''} and ${educations.length} school${educations.length !== 1 ? 's' : ''} from LinkedIn!`);
            }

            setParsed({ experiences, educations });

        } catch (err: any) {
            console.error('LinkedIn import error:', err);
            toast.error("Failed to parse LinkedIn data. Try uploading individual CSV files.");
        } finally {
            setIsExtracting(false);
        }
    };

    // ── PDF/Text Upload Handler ──

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setIsExtracting(true);
        setUploadedFileName(file.name);

        try {
            const text = await extractTextFromPdf(file);
            if (text.trim().length < 20) {
                toast.warning("Could not extract much text. It may be a scanned image. Try pasting manually.");
            } else {
                toast.success(`Extracted text from "${file.name}"`);
            }
            setRawText(text);
        } catch (err: any) {
            toast.error(err.message || 'Failed to extract text from PDF.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleParse = async () => {
        if (!rawText.trim()) {
            toast.error("Please paste your resume text or upload a PDF first.");
            return;
        }
        setIsParsing(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        try {
            const result = parseResumeText(rawText);
            if (result.experiences.length === 0 && result.educations.length === 0 && rawText.length > 100) {
                toast.warning("Could not clearly parse sections. Try formatting with clear 'Experience' and 'Education' headers.");
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

    // ── Remove a parsed item before importing ──
    const removeExperience = (index: number) => {
        if (!parsed) return;
        setParsed({
            ...parsed,
            experiences: parsed.experiences.filter((_, i) => i !== index),
        });
    };

    const removeEducation = (index: number) => {
        if (!parsed) return;
        setParsed({
            ...parsed,
            educations: parsed.educations.filter((_, i) => i !== index),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-[640px] bg-background">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-secondary" />
                        Import Profile Data
                    </DialogTitle>
                    <DialogDescription>
                        Import your experience and education from LinkedIn or a resume.
                    </DialogDescription>
                </DialogHeader>

                {!parsed ? (
                    <div className="space-y-4 py-2">
                        {/* Tab Switcher */}
                        <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
                            <button
                                onClick={() => { setActiveTab('linkedin'); resetState(); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === 'linkedin'
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Linkedin className="h-4 w-4" />
                                LinkedIn Import
                            </button>
                            <button
                                onClick={() => { setActiveTab('resume'); resetState(); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
                                    activeTab === 'resume'
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <FileText className="h-4 w-4" />
                                Resume / PDF
                            </button>
                        </div>

                        {activeTab === 'linkedin' ? (
                            <div className="space-y-4">
                                {/* Instructions */}
                                <div className="p-4 rounded-xl bg-[#0077B5]/5 border border-[#0077B5]/15 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-[#0077B5]/10 flex items-center justify-center shrink-0">
                                            <Linkedin className="h-4 w-4 text-[#0077B5]" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-foreground">How to export your LinkedIn data:</p>
                                            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                                                <li>Go to <strong>LinkedIn.com</strong> → click your profile photo → <strong>Settings & Privacy</strong></li>
                                                <li>Click <strong>Data privacy</strong> → <strong>Get a copy of your data</strong></li>
                                                <li>Select <strong>&quot;Want something in particular?&quot;</strong></li>
                                                <li>Check <strong>Positions</strong> and <strong>Education</strong>, then click <strong>Request archive</strong></li>
                                                <li>Download the ZIP or CSV files when ready (usually a few minutes)</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                {/* Upload */}
                                <input
                                    ref={linkedinFileRef}
                                    type="file"
                                    accept=".csv,.zip"
                                    className="hidden"
                                    onChange={handleLinkedInUpload}
                                />

                                {uploadedFileName ? (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0077B5]/10 border border-[#0077B5]/20">
                                        <Linkedin className="h-5 w-5 text-[#0077B5] shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{uploadedFileName}</p>
                                            <p className="text-[10px] text-muted-foreground">{isExtracting ? 'Processing...' : 'Imported successfully'}</p>
                                        </div>
                                        {isExtracting ? <Loader2 className="h-4 w-4 animate-spin text-[#0077B5]" /> : (
                                            <button onClick={() => { setUploadedFileName(null); if (linkedinFileRef.current) linkedinFileRef.current.value = ''; }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => linkedinFileRef.current?.click()}
                                        disabled={isExtracting}
                                        className="w-full h-28 rounded-xl border-2 border-dashed border-[#0077B5]/30 hover:border-[#0077B5]/60 hover:bg-[#0077B5]/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-[#0077B5] transition-colors" />
                                        <span className="text-sm font-medium text-muted-foreground group-hover:text-[#0077B5] transition-colors">
                                            Upload Positions.csv, Education.csv, or ZIP
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">From your LinkedIn data export</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                {uploadedFileName ? (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                                        <FileText className="h-5 w-5 text-secondary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{uploadedFileName}</p>
                                            <p className="text-[10px] text-muted-foreground">{isExtracting ? 'Extracting text...' : 'Text extracted — review below'}</p>
                                        </div>
                                        {isExtracting ? <Loader2 className="h-4 w-4 animate-spin text-secondary" /> : (
                                            <button onClick={() => { setUploadedFileName(null); setRawText(""); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-20 rounded-xl border-2 border-dashed border-border/50 hover:border-secondary/50 hover:bg-secondary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <Upload className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                                        <span className="text-xs font-medium text-muted-foreground group-hover:text-secondary transition-colors">Upload PDF resume</span>
                                    </button>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-border/50" />
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">or paste text</span>
                                    <div className="flex-1 h-px bg-border/50" />
                                </div>

                                <Textarea
                                    placeholder="Paste your plain text resume here..."
                                    className="min-h-[180px] resize-none font-mono text-xs bg-muted/20"
                                    value={rawText}
                                    onChange={e => setRawText(e.target.value)}
                                />
                                <Button
                                    onClick={handleParse}
                                    disabled={isParsing || isExtracting || !rawText}
                                    className="bg-secondary text-white hover:bg-secondary/90 w-full rounded-xl h-11"
                                >
                                    {isParsing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</> : <><Sparkles className="mr-2 h-4 w-4" /> Extract Info</>}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Results View ── */
                    <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
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
                                                        {exp.start_date.split('-').slice(0, 2).join('/')} – {exp.is_current ? 'Present' : exp.end_date.split('-').slice(0, 2).join('/')}
                                                    </div>
                                                    {exp.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>}
                                                </div>
                                                <button
                                                    onClick={() => removeExperience(i)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 shrink-0 mt-1"
                                                    title="Remove this item"
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
                                                        {edu.start_date.split('-').slice(0, 2).join('/')} – {edu.is_current ? 'Present' : edu.end_date.split('-').slice(0, 2).join('/')}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeEducation(i)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 shrink-0 mt-1"
                                                    title="Remove this item"
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
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Import {parsed.experiences.length + parsed.educations.length} Items</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
