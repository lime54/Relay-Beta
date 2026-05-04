import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BookingService } from '@/lib/scheduling/BookingService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipientId, startTime, endTime, message, idempotencyKey } = body ?? {};

        if (!recipientId || !startTime || !endTime || !idempotencyKey) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.id === recipientId) {
            return NextResponse.json(
                { error: 'You cannot book a meeting with yourself' },
                { status: 400 }
            );
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
        }

        if (end <= start) {
            return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
        }

        if (start < new Date()) {
            return NextResponse.json(
                { error: 'Cannot book a meeting in the past' },
                { status: 400 }
            );
        }

        const trimmedMessage =
            typeof message === 'string' && message.trim().length > 0
                ? message.trim().slice(0, 1000)
                : undefined;

        const booking = await BookingService.createBooking(
            user.id,
            recipientId,
            start,
            end,
            idempotencyKey,
            trimmedMessage
        );

        return NextResponse.json({ success: true, booking });
    } catch (error: unknown) {
        console.error('[book] error', error);
        const message = error instanceof Error ? error.message : 'Booking failed';
        if (message.toLowerCase().includes('idempotency') || message.toLowerCase().includes('booked')) {
            return NextResponse.json(
                { error: 'This slot may have just been taken. Please try another time.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
