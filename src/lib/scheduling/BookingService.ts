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

        // 2. Look up calendar connections for BOTH users. We'll try the requester first
        //    (they initiated the booking, so they're likeliest to expect it on their calendar)
        //    and fall back to the recipient. As long as ONE user has Google Calendar connected,
        //    Google emails invites to both via sendUpdates: 'all'.
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

        // 3. Gather attendee emails from public.users (best effort under RLS).
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

        if (orderedConnections.length === 0) {
            calendarError =
                'Neither account has Google Calendar connected. Connect your calendar in Settings to send invites automatically.';
        }

        for (const conn of orderedConnections) {
            const isOwnerRequester = conn.user_id === requesterId;
            const ownerLabel = isOwnerRequester ? 'your' : "the recipient's";

            const token = await this.getValidToken(conn.id);
            if (!token) {
                calendarError = `${isOwnerRequester ? 'Your' : "The recipient's"} Google Calendar connection has expired. ${isOwnerRequester ? 'Please reconnect it in Settings → Calendar.' : 'Ask them to reconnect it in Settings → Calendar, or connect your own.'}`;
                continue;
            }

            // The connection owner's verified Google email is the most reliable address.
            // Fall back to public.users for the OTHER user.
            const ownerEmail = conn.provider_account_id;
            const otherUserId = isOwnerRequester ? recipientId : requesterId;
            const otherEmail = emailByUser.get(otherUserId);

            const attendeeEmails = [ownerEmail, otherEmail].filter(
                (e): e is string => Boolean(e)
            );

            try {
                const provider = this.getProvider(conn.provider);
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

                calendarSynced = true;
                meetingLink = event.meetLink;
                calendarError = undefined;
                break;
            } catch (err) {
                console.error('[BookingService] Calendar event creation failed', err);
                const errMsg = err instanceof Error ? err.message : String(err);

                // Detect auth/credential errors from Google. The token Supabase had on file
                // was rejected by Google — deactivate so the user is prompted to reconnect
                // and we don't keep retrying with a dead connection.
                const isAuthError =
                    /invalid authentication credentials/i.test(errMsg) ||
                    /invalid_grant/i.test(errMsg) ||
                    /unauthorized/i.test(errMsg) ||
                    /\b401\b/.test(errMsg) ||
                    /\b403\b/.test(errMsg);

                if (isAuthError) {
                    await this.deactivateConnection(supabase, conn.id);
                    calendarError = `${isOwnerRequester ? 'Your' : "The recipient's"} Google Calendar connection was rejected by Google and has been disconnected. ${isOwnerRequester ? 'Please reconnect it in Settings → Calendar.' : 'Ask them to reconnect it, or connect your own.'}`;
                } else {
                    calendarError = `Couldn't create the event on ${ownerLabel} calendar: ${errMsg}`;
                }
                // Try the next connection if available.
            }
        }

        return {
            ...booking,
            meeting_link: meetingLink ?? booking.meeting_link ?? null,
            calendar_synced: calendarSynced,
            calendar_error: calendarError ?? null,
        };
    }
}
