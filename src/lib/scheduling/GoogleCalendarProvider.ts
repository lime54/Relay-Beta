import { google } from 'googleapis';
import crypto from 'node:crypto';
import { CalendarProvider, CalendarEvent } from './CalendarProvider';

export class GoogleCalendarProvider implements CalendarProvider {
    private getClient(accessToken: string) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        return google.calendar({ version: 'v3', auth: oauth2Client });
    }

    async getFreeBusy(accessToken: string, startTime: Date, endTime: Date): Promise<{ start: Date; end: Date }[]> {
        const calendar = this.getClient(accessToken);
        const res = await calendar.freebusy.query({
            requestBody: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                items: [{ id: 'primary' }],
            },
        });
        const busyBlocks = res.data.calendars?.['primary']?.busy || [];
        return busyBlocks
            .filter((block) => block.start && block.end)
            .map((block) => ({
                start: new Date(block.start as string),
                end: new Date(block.end as string),
            }));
    }

    async createEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent> {
        const calendar = this.getClient(accessToken);
        // Use RFC3339 timestamps with explicit timeZone = UTC; Google will translate for the
        // attendee. This avoids ambiguity from server-local time.
        const res = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            sendUpdates: 'all', // email invites to attendees
            requestBody: {
                summary: event.title,
                description: event.description,
                start: { dateTime: event.startTime.toISOString(), timeZone: 'UTC' },
                end: { dateTime: event.endTime.toISOString(), timeZone: 'UTC' },
                attendees: event.attendeeEmails.map((email) => ({ email })),
                conferenceData: {
                    createRequest: {
                        requestId: crypto.randomUUID(),
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            },
        });

        return {
            ...event,
            providerEventId: res.data.id ?? undefined,
            meetLink: res.data.hangoutLink ?? undefined,
        };
    }

    async deleteEvent(accessToken: string, providerEventId: string): Promise<void> {
        const calendar = this.getClient(accessToken);
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: providerEventId,
            sendUpdates: 'all',
        });
    }
}
