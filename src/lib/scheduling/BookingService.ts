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
    private static async deactivateConnection(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
        await supabase
            .from('calendar_connections')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);
    }

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

        // Token is expired (or has unknown expiry). We need a refresh_token to recover.
        // Never return a stale access_token — Google will reject it with
        // "invalid authentication credentials" and the booking will fail.
        if (!conn.refresh_token) {
            console.warn(`[BookingService] connection ${conn.id} has no refresh_token; deactivating`);
            await this.deactivateConnection(supabase, conn.id);
            return null;
        }

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error('[BookingService] Missing GOOGLE_CLIENT_ID/SECRET; cannot refresh');
            return null;
        }

        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            oauth2Client.setCredentials({ refresh_token: conn.refresh_token });

            const { credentials } = await oauth2Client.refreshAccessToken();
            if (!credentials.access_token) {
                console.error('[BookingService] Refresh response had no access_token');
                await this.deactivateConnection(supabase, conn.id);
                return null;
            }
            const newAccess = credentials.access_token;
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

            return newAccess;
        } catch (err) {
            console.error('[BookingService] Failed to refresh token', err);
            // invalid_grant means the refresh token itself was revoked / expired.
            await this.deactivateConnection(supabase, conn.id);
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
        // 1. Insert the booking as PENDING — recipient must approve before it's confirmed.
        const { data: booking, error } = await supabase
            .from('bookings')
            .insert({
                requester_id: requesterId,
                recipient_id: recipientId,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                idempotency_key: idempotencyKey,
                status: 'PENDING',
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

        return {
            ...booking,
            calendar_synced: false,
            calendar_error: null,
            meeting_link: null,
        };
    }

    /**
     * Confirms a PENDING booking: updates status to CONFIRMED and syncs to Google Calendar.
     * Only the recipient of the booking may confirm it.
     */
    static async confirmBooking(bookingId: string, userId: string) {
        const supabase = await createClient();

        // Fetch the booking
        const { data: booking, error: fetchErr } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (fetchErr || !booking) throw new Error('Booking not found');
        if (booking.recipient_id !== userId) throw new Error('Only the recipient can approve this meeting');
        if (booking.status !== 'PENDING') throw new Error(`Booking is already ${booking.status.toLowerCase()}`);

        // Update to CONFIRMED
        const { error: updateErr } = await supabase
            .from('bookings')
            .update({ status: 'CONFIRMED' })
            .eq('id', bookingId);

        if (updateErr) throw updateErr;

        // Now sync to Google Calendar
        const requesterId = booking.requester_id;
        const recipientId = booking.recipient_id;
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);

        const { data: conns } = await supabase
            .from('calendar_connections')
            .select('*')
            .in('user_id', [requesterId, recipientId])
            .eq('is_active', true)
            .returns<CalendarConnectionRow[]>();

        const orderedConnections = (conns ?? []).sort((a, b) => {
            if (a.user_id === requesterId) return -1;
            if (b.user_id === requesterId) return 1;
            return 0;
        });

        const { data: usersRows } = await supabase
            .from('users')
            .select('id, email')
            .in('id', [requesterId, recipientId]);

        const emailByUser = new Map<string, string>();
        for (const row of usersRows ?? []) {
            if (row.email) emailByUser.set(row.id, row.email);
        }

        let calendarSynced = false;
        let calendarError: string | undefined;
        let meetingLink: string | undefined;

        for (const conn of orderedConnections) {
            const token = await this.getValidToken(conn.id);
            if (!token) continue;

            const ownerEmail = conn.provider_account_id;
            const otherUserId = conn.user_id === requesterId ? recipientId : requesterId;
            const otherEmail = emailByUser.get(otherUserId);
            const attendeeEmails = [ownerEmail, otherEmail].filter((e): e is string => Boolean(e));

            try {
                const provider = this.getProvider(conn.provider);
                const event = await provider.createEvent(token, {
                    startTime: start,
                    endTime: end,
                    title: 'Relay Meeting',
                    description: booking.message
                        ? `Message from requester:\n\n${booking.message}`
                        : 'A meeting booked through Relay.',
                    attendeeEmails,
                });

                await supabase
                    .from('bookings')
                    .update({
                        provider_event_id: event.providerEventId,
                        meeting_link: event.meetLink,
                    })
                    .eq('id', bookingId);

                calendarSynced = true;
                meetingLink = event.meetLink;
                calendarError = undefined;
                break;
            } catch (err) {
                console.error('[BookingService] Calendar sync on confirm failed', err);
                const errMsg = err instanceof Error ? err.message : String(err);
                const isAuthError = /invalid authentication credentials|invalid_grant|unauthorized|\b401\b|\b403\b/i.test(errMsg);
                if (isAuthError) await this.deactivateConnection(supabase, conn.id);
                calendarError = `Calendar sync failed: ${errMsg}`;
            }
        }

        return { success: true, calendar_synced: calendarSynced, calendar_error: calendarError ?? null, meeting_link: meetingLink ?? null };
    }

    /**
     * Declines a PENDING booking.
     * Only the recipient may decline.
     */
    static async declineBooking(bookingId: string, userId: string) {
        const supabase = await createClient();

        const { data: booking, error: fetchErr } = await supabase
            .from('bookings')
            .select('id, recipient_id, status')
            .eq('id', bookingId)
            .single();

        if (fetchErr || !booking) throw new Error('Booking not found');
        if (booking.recipient_id !== userId) throw new Error('Only the recipient can decline this meeting');
        if (booking.status !== 'PENDING') throw new Error(`Booking is already ${booking.status.toLowerCase()}`);

        const { error } = await supabase
            .from('bookings')
            .update({ status: 'DECLINED' })
            .eq('id', bookingId);

        if (error) throw error;
        return { success: true };
    }
}
