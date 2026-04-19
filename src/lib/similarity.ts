/**
 * Similarity Score Algorithm for Relay-Beta.
 * 
 * Weights:
 * - Same School: 30
 * - Same Sport: 30
 * - Same Major: 20
 * - Overlapping Career Interests: 20
 * 
 * Returns a score from 0 to 100.
 */

export interface Sport {
    name: string;
    division?: string;
    role?: string;
}

export interface ProfileSnippet {
    school?: string;
    sport?: string;
    sports?: Sport[]; // Added support for the array format used in onboarding
    majors?: string; // stored as string or comma-separated
    career_sectors?: string[]; // stored as array
    career_goals?: string[]; // stored as array
}

export function calculateSimilarityScore(p1: ProfileSnippet, p2: ProfileSnippet): number {
    let score = 0;

    // 1. Same School (30 points)
    if (p1.school && p2.school && p1.school.toLowerCase().trim() === p2.school.toLowerCase().trim()) {
        score += 30;
    }

    // 2. Same Sport (30 points)
    // We check both the singular 'sport' and the 'sports' array
    const getSportsList = (p: ProfileSnippet): string[] => {
        const list: string[] = [];
        if (p.sport) list.push(p.sport.toLowerCase().trim());
        if (p.sports && Array.isArray(p.sports)) {
            p.sports.forEach(s => {
                if (s.name) list.push(s.name.toLowerCase().trim());
            });
        }
        return [...new Set(list)]; // unique sports
    };

    const s1 = getSportsList(p1);
    const s2 = getSportsList(p2);
    const commonSports = s1.filter(s => s2.includes(s));

    if (commonSports.length > 0) {
        score += 30;
    }

    // 3. Same Major (20 points)
    if (p1.majors && p2.majors) {
        const m1 = p1.majors.toLowerCase().split(',').map(m => m.trim()).filter(Boolean);
        const m2 = p2.majors.toLowerCase().split(',').map(m => m.trim()).filter(Boolean);
        const commonMajors = m1.filter(m => m2.includes(m));
        if (commonMajors.length > 0) {
            score += 20;
        }
    }

    // 4. Overlapping Career Interests (20 points)
    const sectors1 = (p1.career_sectors || []).map(s => s.toLowerCase().trim());
    const sectors2 = (p2.career_sectors || []).map(s => s.toLowerCase().trim());
    const commonSectors = sectors1.filter(s => sectors2.includes(s));

    const goals1 = (p1.career_goals || []).map(g => g.toLowerCase().trim());
    const goals2 = (p2.career_goals || []).map(g => g.toLowerCase().trim());
    const commonGoals = goals1.filter(g => goals2.includes(g));

    if (commonSectors.length > 0 || commonGoals.length > 0) {
        score += 20;
    }

    return Math.min(score, 100);
}
