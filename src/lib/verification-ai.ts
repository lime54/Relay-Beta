/**
 * AI-assisted athlete verification.
 *
 * Uses Groq's web-search-enabled `groq/compound` model to check whether a
 * person actually appears on their school's official NCAA team roster / athletics
 * bio online. This is a stronger signal than a .edu email (which only proves
 * they're a student, not an athlete) and works for alumni too (archived rosters).
 */

export interface AiRosterResult {
    status: 'verified' | 'likely' | 'not_found' | 'uncertain'
    confidence: number // 0..1
    sourceUrl: string | null
    reasoning: string
}

const SYSTEM_PROMPT = `You verify whether a person is a real NCAA college athlete (Division I, II, or III) by checking their official team's roster or athletics bio page online. Use web search.

You are given a name, school, sport, and whether they are a current student-athlete or a former athlete (alumni). Search the school's official athletics website (and reputable sources) for a roster or athlete bio that matches this person on that sport.

Decision:
- "verified": you found an official roster/athletics-bio page clearly listing this person on this school's team for this sport.
- "likely": strong but not conclusive evidence (e.g. news/stats sites, or a close-but-not-exact match).
- "not_found": you searched and found no evidence this person was on that team.
- "uncertain": you could not search effectively or the result is ambiguous.

Be conservative — do not claim "verified" without a real matching official source. For alumni, historical/archived rosters count.

Output ONLY a JSON object, no other text:
{ "status": "verified|likely|not_found|uncertain", "confidence": 0.0-1.0, "source_url": "<the best matching URL or null>", "reasoning": "<one or two sentences>" }`

export async function verifyRosterWithAI(input: {
    name: string
    school: string
    sport: string
    status?: 'current' | 'former' | string | null
    rosterUrlHint?: string | null
}): Promise<AiRosterResult> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
        return { status: 'uncertain', confidence: 0, sourceUrl: null, reasoning: 'Verification service not configured.' }
    }
    if (!input.name || !input.school || !input.sport) {
        return { status: 'uncertain', confidence: 0, sourceUrl: null, reasoning: 'Missing name, school, or sport.' }
    }

    const who = input.status === 'former' ? 'former athlete (alumni)' : 'current student-athlete'
    const userMsg = [
        `Name: ${input.name}`,
        `School: ${input.school}`,
        `Sport: ${input.sport}`,
        `Status: ${who}`,
        input.rosterUrlHint ? `Roster/bio link they provided (verify it really lists them): ${input.rosterUrlHint}` : '',
        '',
        'Search the web and decide. Output ONLY the JSON.',
    ].filter(Boolean).join('\n')

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: process.env.GROQ_VERIFY_MODEL || 'groq/compound',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMsg },
                ],
                temperature: 0,
            }),
        })

        if (!res.ok) {
            return { status: 'uncertain', confidence: 0, sourceUrl: null, reasoning: `Verification request failed (${res.status}).` }
        }

        const data = await res.json()
        const content: string = data.choices?.[0]?.message?.content || ''

        // groq/compound may wrap the JSON in prose; extract the first {...} block.
        let parsed: any = null
        try {
            parsed = JSON.parse(content)
        } catch {
            const m = content.match(/\{[\s\S]*\}/)
            if (m) {
                try { parsed = JSON.parse(m[0]) } catch { /* ignore */ }
            }
        }

        if (!parsed || typeof parsed.status !== 'string') {
            return { status: 'uncertain', confidence: 0, sourceUrl: null, reasoning: 'Could not interpret the verification result.' }
        }

        const status = ['verified', 'likely', 'not_found', 'uncertain'].includes(parsed.status)
            ? parsed.status as AiRosterResult['status']
            : 'uncertain'
        const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0
        const sourceUrl = typeof parsed.source_url === 'string' && parsed.source_url.startsWith('http') ? parsed.source_url : null
        const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 500) : ''

        return { status, confidence, sourceUrl, reasoning }
    } catch (err) {
        console.error('[verifyRosterWithAI] error', err)
        return { status: 'uncertain', confidence: 0, sourceUrl: null, reasoning: 'Verification service error.' }
    }
}
