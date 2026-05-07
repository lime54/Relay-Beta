import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BookingService } from '@/lib/scheduling/BookingService'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { bookingId, action } = await request.json()

        if (!bookingId || !action) {
            return NextResponse.json({ error: 'Missing bookingId or action' }, { status: 400 })
        }

        if (action === 'approve') {
            const result = await BookingService.confirmBooking(bookingId, user.id)
            return NextResponse.json(result)
        }

        if (action === 'decline') {
            const result = await BookingService.declineBooking(bookingId, user.id)
            return NextResponse.json(result)
        }

        return NextResponse.json({ error: 'Invalid action. Use "approve" or "decline".' }, { status: 400 })
    } catch (err) {
        console.error('[scheduling/respond]', err)
        const message = err instanceof Error ? err.message : 'Failed to respond to meeting request'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
