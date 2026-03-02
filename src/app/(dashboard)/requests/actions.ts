'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitRequest(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const requestType = formData.get('type') as string
    const context = formData.get('context') as string
    const timeCommitment = formData.get('time_commitment') as string
    const offer = formData.get('offer') as string
    const aiAssisted = formData.get('ai_assisted') === 'true'

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error } = await supabase
        .from('requests')
        .insert({
            requester_id: user.id,
            request_type: requestType,
            context: context,
            time_commitment: timeCommitment,
            offer_in_return: offer,
            ai_assisted: aiAssisted,
            status: 'pending',
            expires_at: expiresAt.toISOString(),
        })

    if (error) {
        console.error('Error creating request:', error)
        return redirect('/requests/new?error=Failed to create request')
    }

    revalidatePath('/requests')
    redirect('/requests')
}

export async function refineRequestDraft(context: string, offer: string) {
    // Placeholder for AI refinement - in production this would call an AI API
    // For now, return slightly improved versions
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

    return {
        refinedContext: context.trim() + (context.endsWith('.') ? '' : '.'),
        refinedOffer: offer.trim() + (offer.endsWith('.') ? '' : '.'),
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
