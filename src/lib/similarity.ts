/**
 * Similarity Score Algorithm for Relay.
 *
 * Scores how well two athlete profiles match, 0–100. Factors:
 * - Same sport .................................. 35  (the strongest signal on an athlete network)
 * - Same school ................................. 20
 * - Industry / interests overlap (career_sectors) 18  (graduated; ~on par with school)
 * - Goals overlap (aspiration free-text) ........ 7   (graduated)
 * - Bonus: overlap in previous experience ....... up to 20  (shared companies + roles)
 *
 * The four base factors sum to 80, so overlapping previous experience is a
 * real differentiator that pushes a match toward 100. Multi-valued factors
 * (sectors, goals, experience) are graduated, so sharing more counts for more.
 */

const WEIGHTS = {
    sport: 35,
    school: 20,
    sectors: 18,
    goals: 7,
    experience: 20, // bonus cap
} as const;

export interface Sport {
    name: string;
    division?: string;
    role?: string;
}

export interface ExperienceSnippet {
    company?: string | null;
    role?: string | null;
}

export interface ProfileSnippet {
    school?: string;
    sport?: string;
    sports?: Sport[]; // array format used in onboarding
    career_sectors?: string[]; // industries / interests (multi-select)
    aspiration?: string; // free-text career goal
    experiences?: ExperienceSnippet[]; // all roles (current + past) for the user
    // legacy / optional — kept for backwards compatibility
    majors?: string;
    career_goals?: string[];
}

// ---- helpers ---------------------------------------------------------------

const norm = (s: string) => s.toLowerCase().trim();

/** Fraction of the smaller set that is shared (0–1). Rewards matching most of what someone cares about. */
function overlapRatio(a: string[], b: string[]): number {
    const set = new Set(a);
    const common = b.filter((x) => set.has(x)).length;
    const denom = Math.min(a.length, b.length);
    return denom === 0 ? 0 : common / denom;
}

const GOAL_STOPWORDS = new Set([
    "the", "a", "an", "to", "of", "in", "and", "or", "for", "my", "i", "want",
    "wanna", "be", "become", "work", "working", "career", "job", "role", "at",
    "with", "on", "as", "is", "am", "looking", "hope", "hoping", "plan", "into",
    "after", "college", "field", "industry", "get", "getting", "would", "like",
    "pursue", "pursuing", "interested", "eventually", "someday", "future",
]);

function goalTokens(text?: string): string[] {
    if (!text) return [];
    return [
        ...new Set(
            text
                .toLowerCase()
                .split(/[^a-z]+/)
                .filter((w) => w.length > 2 && !GOAL_STOPWORDS.has(w))
        ),
    ];
}

function sportsList(p: ProfileSnippet): string[] {
    const list: string[] = [];
    if (p.sport) list.push(norm(p.sport));
    if (Array.isArray(p.sports)) {
        p.sports.forEach((s) => s?.name && list.push(norm(s.name)));
    }
    return [...new Set(list)];
}

/** Normalize a company name so "Google Inc." and "google" match. */
function normCompany(name?: string | null): string {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/[.,]/g, "")
        .replace(/\b(inc|incorporated|llc|llp|ltd|corp|corporation|co|company|group|the)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function companySet(p: ProfileSnippet): Set<string> {
    return new Set((p.experiences || []).map((e) => normCompany(e.company)).filter(Boolean));
}

function roleSet(p: ProfileSnippet): Set<string> {
    return new Set(
        (p.experiences || [])
            .map((e) => (e.role ? norm(e.role) : ""))
            .filter(Boolean)
    );
}

function sharedCount(a: Set<string>, b: Set<string>): number {
    let n = 0;
    a.forEach((x) => b.has(x) && n++);
    return n;
}

// ---- main ------------------------------------------------------------------

export function calculateSimilarityScore(p1: ProfileSnippet, p2: ProfileSnippet): number {
    let score = 0;

    // 1. Same school
    if (p1.school && p2.school && norm(p1.school) === norm(p2.school)) {
        score += WEIGHTS.school;
    }

    // 2. Same sport
    const shareSport = sportsList(p1).some((s) => sportsList(p2).includes(s));
    if (shareSport) score += WEIGHTS.sport;

    // 3. Industry / interests overlap (graduated)
    const sectors1 = (p1.career_sectors || []).map(norm).filter(Boolean);
    const sectors2 = (p2.career_sectors || []).map(norm).filter(Boolean);
    score += WEIGHTS.sectors * overlapRatio(sectors1, sectors2);

    // 4. Goals overlap from free-text aspiration (graduated; 2+ shared keywords = full)
    const g1 = goalTokens(p1.aspiration);
    const g2 = goalTokens(p2.aspiration);
    if (g1.length && g2.length) {
        const shared = g2.filter((t) => g1.includes(t)).length;
        score += WEIGHTS.goals * Math.min(1, shared / 2);
    }

    // 5. Bonus: overlap in previous experience (shared employers + role titles)
    const sharedCompanies = sharedCount(companySet(p1), companySet(p2));
    const sharedRoles = sharedCount(roleSet(p1), roleSet(p2));
    if (sharedCompanies > 0 || sharedRoles > 0) {
        const bonus = sharedCompanies * 15 + sharedRoles * 5;
        score += Math.min(WEIGHTS.experience, bonus);
    }

    return Math.round(Math.min(score, 100));
}
