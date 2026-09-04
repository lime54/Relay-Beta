'use server';

export async function refineRequestDraft(context: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple heuristic refinement
    const refinedContext = `Hi! I'm reaching out as a fellow athlete. ${context.length > 5 ? context : "I'm interested in connecting and learning more about your journey."} I'm particularly impressed by your path and would love to hear your perspective — and I'd be glad to help however I can, too.`;

    return {
        refinedContext,
        message: "Refined for clarity"
    }
}
