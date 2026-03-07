'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function submitRequest(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const recipientId = formData.get('recipient_id') as string;
    const type = formData.get('type') as string;
    const context = formData.get('context') as string;
    const offer = formData.get('offer') as string;
    const timeCommitment = formData.get('time_commitment') as string;

    const { error } = await supabase
        .from('requests')
        .insert({
            requester_id: user.id,
            recipient_id: recipientId,
            request_type: type,
            context: `${context}\n\nOffer: ${offer}\nTime: ${timeCommitment}`,
            status: 'pending'
        });

    if (error) {
        console.error("Submission error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/requests');

    return { success: true };
}
