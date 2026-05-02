import { createClient } from "@/lib/supabase/server";
import { GoogleCalendarProvider } from "./GoogleCalendarProvider";

export class BookingService {
    static getProvider(providerName: string) {
        if (providerName === 'google') return new GoogleCalendarProvider();
        throw new Error("Provider not supported");
    }

    /**
     * Gets a valid access token. If expired, it should theoretically use the refresh token to get a new one.
     * Note: For MVP, we are assuming the access token is valid or we use a library/middleware to refresh.
     * With googleapis, you can set the refresh token and it auto-refreshes, but you'd need to save the new access token.
     */
    static async getValidToken(connectionId: string): Promise<string | null> {
        const supabase = await createClient();
        const { data: conn } = await supabase.from('calendar_connections').select('*').eq('id', connectionId).single();
        
        if (!conn) return null;

        // In a production app: Check if expires_at is past, then refresh. 
        // For MVP scaffold, we'll return the access_token.
        return conn.access_token;
    }

    static async createBooking(requesterId: string, recipientId: string, start: Date, end: Date, idempotencyKey: string) {
        const supabase = await createClient();
        
        // 1. Transaction / Optimistic Insert to prevent double booking
        const { data: booking, error } = await supabase.from('bookings').insert({
            requester_id: requesterId,
            recipient_id: recipientId,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            idempotency_key: idempotencyKey,
            status: 'CONFIRMED' // Or PENDING if manual approval needed
        }).select().single();

        if (error) {
            if (error.code === '23505') throw new Error("Idempotency key collision or double booking");
            throw error;
        }

        // 2. Fetch Recipient Calendar Connection
        const { data: conn } = await supabase.from('calendar_connections')
            .select('*')
            .eq('user_id', recipientId)
            .eq('is_active', true)
            .single();
        
        // Fetch Requester and Recipient emails to send invites
        const { data: users } = await supabase.from('users')
            .select('id, email')
            .in('id', [requesterId, recipientId]);
        
        const attendeeEmails = users?.map(u => u.email).filter(Boolean) || [];

        if (conn) {
            const provider = this.getProvider(conn.provider);
            const token = await this.getValidToken(conn.id);
            
            if (token) {
                // 3. Create Event
                try {
                    const event = await provider.createEvent(token, {
                        startTime: start,
                        endTime: end,
                        title: `Relay Meeting`,
                        attendeeEmails: attendeeEmails
                    });

                    // 4. Update booking with provider metadata
                    await supabase.from('bookings').update({
                        provider_event_id: event.providerEventId,
                        meeting_link: event.meetLink
                    }).eq('id', booking.id);

                    return { ...booking, meeting_link: event.meetLink };
                } catch (err) {
                    console.error("External calendar failure", err);
                    // Even if Google fails, the booking exists locally. We might want to flag it.
                }
            }
        }
        
        return booking;
    }
}
