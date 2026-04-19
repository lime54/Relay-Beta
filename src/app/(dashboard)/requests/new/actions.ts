'use server';

import { createClient } from "@/lib/supabase/server";

export async function refineRequestDraft(context: string, offer: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple heuristic refinement
    const refinedContext = `Hi! I'm reaching out as a fellow athlete. ${context.length > 5 ? context : "I'm interested in connecting and learning more about your journey."} I'm particularly impressed by your transition from the field to your current role and would love to hear your perspective.`;

    const refinedOffer = `I'll be sure to come prepared with specific questions to respect your time, and ${offer || "I'd love to share any insights I have on current campus culture"} or help in any way I can.`;

    return {
        refinedContext,
        refinedOffer,
        message: "Refined for professional clarity"
    }
}
