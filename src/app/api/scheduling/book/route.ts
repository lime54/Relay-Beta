import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BookingService } from '@/lib/scheduling/BookingService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipientId, startTime, endTime, message, idempotencyKey } = body;

        if (!recipientId || !startTime || !endTime || !idempotencyKey) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (user.id === recipientId) {
            return NextResponse.json({ error: "Cannot book a meeting with yourself" }, { status: 400 });
        }

        // Validate time
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (start < new Date()) {
            return NextResponse.json({ error: "Cannot book a meeting in the past" }, { status: 400 });
        }

        // Call BookingService
        const booking = await BookingService.createBooking(
            user.id,
            recipientId,
            start,
            end,
            idempotencyKey
        );

        // Optionally, update the booking message if provided
        if (message) {
            await supabase.from('bookings').update({ message }).eq('id', booking.id);
        }

        return NextResponse.json({ success: true, booking });
    } catch (error: any) {
        console.error("Booking error:", error);
        if (error.message.includes("Idempotency")) {
            return NextResponse.json({ error: "This slot may have just been taken or the request was duplicated." }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
