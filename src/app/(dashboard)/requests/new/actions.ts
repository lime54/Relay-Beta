'use server';

interface RefineResult {
    suggestions: string[];
    error?: string;
}

const SYSTEM_PROMPT = `You coach college student-athletes on writing genuine, effective cold outreach messages to alumni and fellow athletes on a networking platform. The user will paste THEIR OWN draft.

Give 2 to 4 short, specific, actionable suggestions to make it a stronger cold message — while keeping THEIR authentic voice.

Rules:
- Do NOT rewrite their message or hand back a rewritten version. Only give pointers.
- Be concrete. Point at the exact vague or generic parts and say what specific detail would make it land (e.g. "name the exact role or team you're curious about", "mention one concrete thing from their background", "cut the flattery and say why you're really reaching out").
- Reward authenticity and brevity. Flag anything that sounds generic, over-polished, or AI-generated — that's the opposite of what works here.
- Each suggestion is ONE short, plain, direct sentence. No preamble, no numbering.

Return ONLY JSON: { "suggestions": ["...", "..."] }`;

export async function refineRequestDraft(context: string, recipientInfo?: string): Promise<RefineResult> {
    const draft = (context || '').trim();
    if (draft.length < 5) {
        return { suggestions: [], error: 'Write a bit of your message first, then I can give you feedback.' };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return { suggestions: [], error: 'Suggestions are unavailable right now.' };
    }

    const userMsg = `${recipientInfo ? `They are writing to: ${recipientInfo}\n\n` : ''}Their draft:\n"""\n${draft.slice(0, 2000)}\n"""`;

    try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMsg },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.4,
            }),
        });

        if (!res.ok) {
            return { suggestions: [], error: 'Could not get suggestions right now. Please try again.' };
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) return { suggestions: [], error: 'Could not get suggestions right now.' };

        const parsed = JSON.parse(content);
        const suggestions: string[] = Array.isArray(parsed.suggestions)
            ? parsed.suggestions.filter((s: unknown) => typeof s === 'string' && s.trim()).slice(0, 4)
            : [];

        if (!suggestions.length) {
            return { suggestions: [], error: 'Could not get suggestions right now. Please try again.' };
        }
        return { suggestions };
    } catch {
        return { suggestions: [], error: 'Could not get suggestions right now. Please try again.' };
    }
}
