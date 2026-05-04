'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitRequest(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' }
    }

    const requestType = formData.get('type') as string
    const context = formData.get('context') as string
    const timeCommitment = formData.get('time_commitment') as string
    const offer = formData.get('offer') as string
    const recipientId = formData.get('recipient_id') as string

    if (!requestType || !context) {
        return { success: false, error: 'Request type and context are required' }
    }

    // Requests auto-expire 7 days from now (per PRD)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const insertPayload = {
        requester_id: user.id,
        recipient_id: recipientId || null,
        request_type: requestType,
        context,
        time_commitment: timeCommitment || null,
        offer_in_return: offer || null,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
    }

    const { error } = await supabase
        .from('requests')
        .insert(insertPayload)
        .select()

    if (error) {
        console.error('[submitRequest] insert failed', error.message)
        return { success: false, error: error.message || 'Failed to create request' }
    }

    revalidatePath('/requests')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function refineRequestDraft(context: string, offer: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Simple heuristic refinement
    const refinedContext = `Hi! I'm reaching out as a fellow athlete. ${context.length > 5 ? context : "I'm interested in connecting and learning more about your journey."} I'm particularly impressed by your transition from the field to your current role and would love to hear your perspective.`

    const refinedOffer = `I'll be sure to come prepared with specific questions to respect your time, and ${offer || "I'd love to share any insights I have on current campus culture"} or help in any way I can.`

    return {
        refinedContext,
        refinedOffer,
    }
}

export async function respondToRequest(requestId: string, responseType: 'accept' | 'decline' | 'refer', message?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('responses')
        .insert({
            request_id: requestId,
            responder_id: user.id,
            response_type: responseType,
            message: message || null,
        })

    if (error) {
        console.error('Error responding to request:', error)
        return { error: 'Failed to respond' }
    }

    // Update request status
    await supabase
        .from('requests')
        .update({ status: responseType === 'accept' ? 'accepted' : responseType === 'decline' ? 'declined' : 'referred' })
        .eq('id', requestId)

    revalidatePath('/requests')
    return { success: true }
}

export async function logOutcome(requestId: string, outcomeType: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('outcomes')
        .insert({
            request_id: requestId,
            outcome_type: outcomeType,
            logged_by: user.id,
        })

    if (error) {
        console.error('Error logging outcome:', error)
        return { error: 'Failed to log outcome' }
    }

    revalidatePath('/requests')
    return { success: true }
}
