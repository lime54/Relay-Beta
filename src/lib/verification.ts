'use server'

/**
 * Roster Verification Engine for Relay
 * 
 * Scrapes public college athletic roster pages and fuzzy-matches
 * a user's name to verify they appear on the team.
 * 
 * Works with most NCAA Division I/II/III schools that use
 * standard roster page formats (SIDEarm, PrestoSports, etc.)
 */

interface RosterCheckResult {
    verified: boolean
    confidence: 'high' | 'medium' | 'low' | 'none'
    matchedName: string | null
    rosterUrl: string | null
    details: string
}

/**
 * Normalize a name for fuzzy comparison:
 * - Lowercase, trim, remove accents
 * - Handle "First Last" vs "Last, First" formats
 */
function normalizeName(name: string): string[] {
    const clean = name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z\s-]/g, '')       // keep only letters, spaces, hyphens
        .replace(/\s+/g, ' ')            // collapse spaces

    const parts = clean.split(' ').filter(Boolean)
    return parts
}

/**
 * Compare two names and return a confidence score
 */
function nameMatch(userName: string, rosterEntry: string): { match: boolean; confidence: 'high' | 'medium' | 'low' } {
    const userParts = normalizeName(userName)
    const rosterParts = normalizeName(rosterEntry)

    if (userParts.length === 0 || rosterParts.length === 0) {
        return { match: false, confidence: 'low' }
    }

    // Exact match (all parts present)
    const userFull = userParts.join(' ')
    const rosterFull = rosterParts.join(' ')

    if (userFull === rosterFull) {
        return { match: true, confidence: 'high' }
    }

    // Handle "Last, First" format common on rosters
    const rosterReversed = rosterParts.length >= 2
        ? [rosterParts[rosterParts.length - 1], ...rosterParts.slice(0, -1)].join(' ')
        : rosterFull

    if (userFull === rosterReversed) {
        return { match: true, confidence: 'high' }
    }

    // First name + Last name partial match
    const userFirst = userParts[0]
    const userLast = userParts[userParts.length - 1]

    const rosterHasFirst = rosterParts.some(p => p === userFirst)
    const rosterHasLast = rosterParts.some(p => p === userLast)

    if (rosterHasFirst && rosterHasLast) {
        return { match: true, confidence: 'high' }
    }

    // Last name only match (medium confidence)
    if (rosterHasLast && userLast.length > 2) {
        return { match: true, confidence: 'medium' }
    }

    // Check if roster entry contains the full user name as substring
    if (rosterFull.includes(userFull) || userFull.includes(rosterFull)) {
        return { match: true, confidence: 'medium' }
    }

    return { match: false, confidence: 'low' }
}

/**
 * Extract names from raw HTML roster page content.
 * Handles common roster formats:
 * - Table rows with player names
 * - Structured lists
 * - SIDEarm/PrestoSports/SIDEARM style
 */
function extractNamesFromHtml(html: string): string[] {
    const names: string[] = []

    // Strategy 1: Look for common roster name patterns in roster tables
    // Most rosters have names in <a> tags or <td> with specific classes
    const patterns = [
        // SIDEarm format: <a href="/sports/.../roster/...">Name</a>
        /<a[^>]*href="[^"]*roster[^"]*"[^>]*>([^<]+)<\/a>/gi,
        // Table cell names: <td class="...name...">Name</td>
        /<td[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/td>/gi,
        // Span with name: <span class="...name...">Name</span>
        /<span[^>]*class="[^"]*(?:player-name|roster-name|sidearm-roster-player-name|name)[^"]*"[^>]*>([^<]+)<\/span>/gi,
        // H3/H4 names common in card layouts
        /<(?:h[2-4])[^>]*class="[^"]*(?:player|roster|name)[^"]*"[^>]*>([^<]+)<\/(?:h[2-4])>/gi,
        // Links in roster sections
        /<a[^>]*class="[^"]*(?:roster|player)[^"]*"[^>]*>([^<]+)<\/a>/gi,
        // General table data that looks like names (First Last pattern)
        /<td[^>]*>\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*<\/td>/g,
        // PrestoSports: <div class="name"><a>Name</a></div>
        /<div[^>]*class="[^"]*name[^"]*"[^>]*>\s*(?:<a[^>]*>)?([^<]+)(?:<\/a>)?\s*<\/div>/gi,
    ]

    for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
            const name = match[1].trim()
            // Filter out non-name content
            if (
                name.length > 3 &&
                name.length < 60 &&
                !name.match(/^\d/) &&              // doesnt start with number
                !name.match(/position|height|weight|class|hometown|major|coach/i) &&
                name.includes(' ')                  // has at least first + last name
            ) {
                names.push(name)
            }
        }
    }

    // Strategy 2: If no structured matches found, try to find name-like strings
    // in the text content (fallback for unusual page formats)
    if (names.length === 0) {
        const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
        // Look for capitalized word pairs that look like names
        const namePattern = /\b([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,20})\b/g
        let match
        while ((match = namePattern.exec(textContent)) !== null) {
            const candidate = `${match[1]} ${match[2]}`
            if (!candidate.match(/^(?:The|This|That|And|For|With|From|About|Home|Next|Last|News|More|View|Read|Click|Page|Site|Copyright|All Rights)/)) {
                names.push(candidate)
            }
        }
    }

    // Deduplicate
    return [...new Set(names)]
}

/**
 * Main verification function.
 * Fetches a roster URL and checks if the user's name appears on it.
 */
export async function verifyRoster(
    userName: string,
    rosterUrl: string,
): Promise<RosterCheckResult> {
    // Validate inputs
    if (!userName || !rosterUrl) {
        return {
            verified: false,
            confidence: 'none',
            matchedName: null,
            rosterUrl: null,
            details: 'Missing name or roster URL'
        }
    }

    // Validate URL
    try {
        const url = new URL(rosterUrl)
        // Only allow http/https
        if (!['http:', 'https:'].includes(url.protocol)) {
            return {
                verified: false,
                confidence: 'none',
                matchedName: null,
                rosterUrl,
                details: 'Invalid URL protocol'
            }
        }
    } catch {
        return {
            verified: false,
            confidence: 'none',
            matchedName: null,
            rosterUrl,
            details: 'Invalid URL format'
        }
    }

    try {
        // Fetch the roster page
        const response = await fetch(rosterUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RelayVerificationBot/1.0)',
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        if (!response.ok) {
            return {
                verified: false,
                confidence: 'none',
                matchedName: null,
                rosterUrl,
                details: `Could not fetch roster page (HTTP ${response.status})`
            }
        }

        const html = await response.text()
        const rosterNames = extractNamesFromHtml(html)

        if (rosterNames.length === 0) {
            return {
                verified: false,
                confidence: 'low',
                matchedName: null,
                rosterUrl,
                details: 'Could not extract names from this roster page. It may use an unsupported format. Manual review needed.'
            }
        }

        // Check for name matches
        let bestMatch: { name: string; confidence: 'high' | 'medium' | 'low' } | null = null

        for (const rosterName of rosterNames) {
            const result = nameMatch(userName, rosterName)
            if (result.match) {
                if (!bestMatch || (result.confidence === 'high' && bestMatch.confidence !== 'high')) {
                    bestMatch = { name: rosterName, confidence: result.confidence }
                }
                // If we found a high-confidence match, stop looking
                if (result.confidence === 'high') break
            }
        }

        if (bestMatch) {
            return {
                verified: bestMatch.confidence === 'high',
                confidence: bestMatch.confidence,
                matchedName: bestMatch.name,
                rosterUrl,
                details: bestMatch.confidence === 'high'
                    ? `High-confidence match found: "${bestMatch.name}" on the roster.`
                    : `Partial match found: "${bestMatch.name}". Manual review recommended.`
            }
        }

        return {
            verified: false,
            confidence: 'none',
            matchedName: null,
            rosterUrl,
            details: `Name "${userName}" was not found among ${rosterNames.length} roster entries. Manual review needed.`
        }

    } catch (error: any) {
        return {
            verified: false,
            confidence: 'none',
            matchedName: null,
            rosterUrl,
            details: `Error fetching roster: ${error.message || 'Unknown error'}`
        }
    }
}

/**
 * Check if an email is a .edu email
 */
export function isEduEmail(email: string): boolean {
    return email.toLowerCase().trim().endsWith('.edu')
}

/**
 * Get verification tier based on checks passed
 */
export type VerificationTier = 'unverified' | 'email_verified' | 'roster_verified' | 'fully_verified'

export function getVerificationTier(checks: {
    eduEmailVerified: boolean
    rosterVerified: boolean
    linkedinVerified?: boolean
}): VerificationTier {
    const { eduEmailVerified, rosterVerified, linkedinVerified } = checks

    if (eduEmailVerified && rosterVerified) return 'fully_verified'
    if (rosterVerified) return 'roster_verified'
    if (eduEmailVerified) return 'email_verified'
    return 'unverified'
}
