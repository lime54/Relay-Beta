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

const MODEL_PREFERENCES = [
    process.env.GROQ_RESUME_MODEL,
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'moonshotai/kimi-k2-instruct',
    'qwen/qwen3-32b',
    'llama-3.1-8b-instant',
].filter(Boolean) as string[];

const NON_CHAT_MODEL = /(whisper|tts|guard|embedding|distil|compound)/i;

// Pick chat models this Groq account actually has access to (hardcoded IDs get
// deprecated). Falls back to the preference list if the models call fails.
async function pickModels(apiKey: string): Promise<string[]> {
    try {
        const r = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!r.ok) return MODEL_PREFERENCES.slice(0, 3);
        const d = await r.json();
        const ids: string[] = Array.isArray(d?.data) ? d.data.map((m: any) => m.id).filter(Boolean) : [];
        const chat = ids.filter((id) => !NON_CHAT_MODEL.test(id));
        if (!chat.length) return MODEL_PREFERENCES.slice(0, 3);
        const preferred = MODEL_PREFERENCES.filter((m) => chat.includes(m));
        const rest = chat.filter((m) => !preferred.includes(m));
        return [...preferred, ...rest].slice(0, 3);
    } catch {
        return MODEL_PREFERENCES.slice(0, 3);
    }
}

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
    const models = await pickModels(apiKey);
    const lastError = 'Could not get suggestions right now. Please try again.';

    for (const model of models) {
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userMsg },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.4,
                }),
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) break;
                continue;
            }

            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) continue;

            let parsed: any;
            try {
                parsed = JSON.parse(content);
            } catch {
                const m = content.match(/\{[\s\S]*\}/);
                if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
            }
            const suggestions: string[] = Array.isArray(parsed?.suggestions)
                ? parsed.suggestions.filter((s: unknown) => typeof s === 'string' && (s as string).trim()).slice(0, 4)
                : [];

            if (suggestions.length) return { suggestions };
        } catch {
            /* try next model */
        }
    }

    return { suggestions: [], error: lastError };
}
