import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { GoogleCalendarProvider } from './GoogleCalendarProvider';

interface CalendarConnectionRow {
    id: string;
    user_id: string;
    provider: string;
    provider_account_id: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: string | null;
    is_active: boolean;
}

// Refresh tokens that expire in less than 60 seconds.
const TOKEN_REFRESH_LEEWAY_MS = 60 * 1000;

export class BookingService {
    static getProvider(providerName: string) {
        if (providerName === 'google') return new GoogleCalendarProvider();
        throw new Error(`Provider not supported: ${providerName}`);
    }

    /**
     * Returns a valid access token for a calendar_connection. If the stored token is expired
     * (or about to be), uses the refresh_token to obtain a fresh one and persists it.
     */
    static async getValidToken(connectionId: string): Promise<string | null> {
        const supabase = await createClient();
        const { data: conn } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('id', connectionId)
            .single<CalendarConnectionRow>();

        if (!conn || !conn.is_active) return null;

        const expiresAt = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
        const isExpired = !expiresAt || Date.now() + TOKEN_REFRESH_LEEWAY_MS >= expiresAt;

        if (!isExpired && conn.access_token) {
            return conn.access_token;
        }

        if (!conn.refresh_token) {
            console.warn(`[BookingService] connection ${conn.id} has no refresh_token`);
            return conn.access_token;
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error('[BookingService] Missing GOOGLE_CLIENT_ID/SECRET; cannot refresh');
            return conn.access_token;
        }

        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            oauth2Client.setCredentials({ refresh_token: conn.refresh_token });

            const { credentials } = await oauth2Client.refreshAccessToken();
            const newAccess = credentials.access_token || conn.access_token;
            const newExpiresAt = credentials.expiry_date
                ? new Date(credentials.expiry_date).toISOString()
                : null;

            await supabase
                .from('calendar_connections')
                .update({
                    access_token: newAccess,
                    expires_at: newExpiresAt,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', conn.id);

            return newAccess ?? null;
        } catch (err) {
            console.error('[BookingService] Failed to refresh token', err);
            // Mark the connection as inactive so the user is prompted to reconnect.
            await supabase
                .from('calendar_connections')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', conn.id);
            return null;
        }
    }

    static async createBooking(
        requesterId: string,
        recipientId: string,
        start: Date,
        end: Date,
        idempotencyKey: string,
        message?: string
    ) {
        const supabase = await createClient();

        // 1. Insert the booking. The DB constraint on idempotency_key + (recipient_id, start_time)
        //    prevents double-booking and duplicate submits.
        const { data: booking, error } = await supabase
            .from('bookings')
            .insert({
                requester_id: requesterId,
                recipient_id: recipientId,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                idempotency_key: idempotencyKey,
                status: 'CONFIRMED',
                message: message ?? null,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Idempotency key collision or slot already booked');
            }
            throw error;
        }

        // 2. Look up the recipient's calendar connection so we can create a Google event.
        const { data: conn } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('user_id', recipientId)
            .eq('is_active', true)
            .maybeSingle<CalendarConnectionRow>();

        // 3. Gather attendee emails. We use both auth.users (via supabase admin would be needed)
        //    and the public.users mirror; fall back gracefully if lookups fail under RLS.
        const { data: usersRows } = await supabase
            .from('users')
            .select('id, email')
            .in('id', [requesterId, recipientId]);

        const attendeeEmails = (usersRows ?? [])
            .map((u) => u.email)
            .filter((e): e is string => Boolean(e));

        if (conn) {
            const provider = this.getProvider(conn.provider);
            const token = await this.getValidToken(conn.id);

            if (token) {
                try {
                    const event = await provider.createEvent(token, {
                        startTime: start,
                        endTime: end,
                        title: 'Relay Meeting',
                        description: message
                            ? `Message from requester:\n\n${message}`
                            : 'A meeting booked through Relay.',
                        attendeeEmails,
                    });

                    await supabase
                        .from('bookings')
                        .update({
                            provider_event_id: event.providerEventId,
                            meeting_link: event.meetLink,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', booking.id);

                    return { ...booking, meeting_link: event.meetLink };
                } catch (err) {
                    console.error('[BookingService] Calendar event creation failed', err);
                    // The booking still exists locally; surface it to the caller.
                }
            }
        }

        return booking;
    }
}
