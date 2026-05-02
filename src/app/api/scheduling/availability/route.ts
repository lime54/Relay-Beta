import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BookingService } from '@/lib/scheduling/BookingService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, startDate, endDate } = body;

        if (!userId || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Fetch Availability Rules
        const { data: rules } = await supabase
            .from('availability_rules')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!rules) {
            return NextResponse.json({ error: "User has not set up availability" }, { status: 404 });
        }

        // 2. Fetch Free/Busy from Calendar Provider
        const { data: conn } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        let busyBlocks: { start: Date; end: Date }[] = [];

        if (conn) {
            const token = await BookingService.getValidToken(conn.id);
            if (token) {
                const provider = BookingService.getProvider(conn.provider);
                try {
                    busyBlocks = await provider.getFreeBusy(token, new Date(startDate), new Date(endDate));
                } catch (e) {
                    console.error("Error fetching free/busy:", e);
                }
            }
        }

        // 3. Generate Available Slots
        const durationMins = rules.meeting_duration_mins || 30;
        const bufferBefore = rules.buffer_before_mins || 0;
        const bufferAfter = rules.buffer_after_mins || 0;
        const schedule = rules.schedule as Record<string, { start: string, end: string }[]>;

        const availableSlots: string[] = [];
        
        let current = new Date(startDate);
        const end = new Date(endDate);

        while (current < end) {
            const dayOfWeek = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const dayRules = schedule[dayOfWeek];

            if (dayRules) {
                for (const rule of dayRules) {
                    const [startHour, startMin] = rule.start.split(':').map(Number);
                    const [endHour, endMin] = rule.end.split(':').map(Number);
                    
                    const ruleStart = new Date(current);
                    ruleStart.setHours(startHour, startMin, 0, 0);
                    
                    const ruleEnd = new Date(current);
                    ruleEnd.setHours(endHour, endMin, 0, 0);

                    // Generate slots within this rule
                    let slotStart = new Date(ruleStart);
                    while (slotStart < ruleEnd) {
                        const slotEnd = new Date(slotStart.getTime() + durationMins * 60000);
                        
                        if (slotEnd <= ruleEnd) {
                            // Check if this slot conflicts with busyBlocks
                            const slotStartWithBuffer = new Date(slotStart.getTime() - bufferBefore * 60000);
                            const slotEndWithBuffer = new Date(slotEnd.getTime() + bufferAfter * 60000);

                            const isConflict = busyBlocks.some(block => 
                                (slotStartWithBuffer < block.end && slotEndWithBuffer > block.start)
                            );

                            // Also check existing bookings in our DB
                            // In MVP, we might rely entirely on GCal free/busy, but ideally we check our DB too
                            // We will skip local DB check here to keep it simple, assuming GCal syncs fast enough,
                            // but in a production app you'd query the `bookings` table here too.

                            if (!isConflict) {
                                availableSlots.push(slotStart.toISOString());
                            }
                        }
                        
                        // Increment slotStart by duration (or 30 mins)
                        slotStart = new Date(slotStart.getTime() + durationMins * 60000);
                    }
                }
            }
            
            // Move to next day
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);
        }

        return NextResponse.json({ slots: availableSlots });
    } catch (error: any) {
        console.error("Availability error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
