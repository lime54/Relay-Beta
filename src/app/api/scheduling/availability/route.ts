import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BookingService } from '@/lib/scheduling/BookingService';
import { generateAvailableSlots } from '@/lib/scheduling/slot-generator';

const DEFAULT_SCHEDULE: Record<string, { start: string; end: string }[]> = {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
};

const MAX_RANGE_DAYS = 31;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, startDate, endDate } = body ?? {};

        if (!userId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
        }

        const rangeMs = end.getTime() - start.getTime();
        if (rangeMs > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
            return NextResponse.json(
                { error: `Date range too large (max ${MAX_RANGE_DAYS} days)` },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Availability rules. If the user hasn't set them up, fall back to a sensible default.
        const { data: rules } = await supabase
            .from('availability_rules')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        const durationMins = rules?.meeting_duration_mins || 30;
        const bufferBefore = rules?.buffer_before_mins || 0;
        const bufferAfter = rules?.buffer_after_mins || 0;
        const schedule =
            (rules?.schedule as Record<string, { start: string; end: string }[]> | undefined) ||
            DEFAULT_SCHEDULE;

        const hasAnySchedule = Object.values(schedule).some((arr) => arr && arr.length > 0);
        if (!hasAnySchedule) {
            return NextResponse.json({ slots: [] });
        }

        // 2. Free/busy from the recipient's connected calendar (best-effort).
        const { data: conn } = await supabase
            .from('calendar_connections')
            .select('id, provider, is_active')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        let busyBlocks: { start: Date; end: Date }[] = [];

        if (conn) {
            const token = await BookingService.getValidToken(conn.id);
            if (token) {
                try {
                    const provider = BookingService.getProvider(conn.provider);
                    busyBlocks = await provider.getFreeBusy(token, start, end);
                } catch (e) {
                    console.error('[availability] free/busy lookup failed', e);
                }
            }
        }

        // 3. Existing CONFIRMED bookings on Relay are also busy.
        const { data: existingBookings } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('recipient_id', userId)
            .eq('status', 'CONFIRMED')
            .gte('end_time', start.toISOString())
            .lte('start_time', end.toISOString());

        if (existingBookings) {
            busyBlocks = busyBlocks.concat(
                existingBookings.map((b) => ({
                    start: new Date(b.start_time),
                    end: new Date(b.end_time),
                }))
            );
        }

        // 4. Generate available slots.
        const availableSlots = generateAvailableSlots({
            rangeStart: start,
            rangeEnd: end,
            schedule,
            durationMins,
            bufferBeforeMins: bufferBefore,
            bufferAfterMins: bufferAfter,
            busyBlocks,
        });

        return NextResponse.json({ slots: availableSlots });
    } catch (error: unknown) {
        console.error('[availability] error', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
