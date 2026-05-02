import { google } from 'googleapis';
import { CalendarProvider, CalendarEvent } from './CalendarProvider';

export class GoogleCalendarProvider implements CalendarProvider {
    private getClient(accessToken: string) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        return google.calendar({ version: 'v3', auth: oauth2Client });
    }

    async getFreeBusy(accessToken: string, startTime: Date, endTime: Date): Promise<{ start: Date; end: Date }[]> {
        const calendar = this.getClient(accessToken);
        try {
            const res = await calendar.freebusy.query({
                requestBody: {
                    timeMin: startTime.toISOString(),
                    timeMax: endTime.toISOString(),
                    items: [{ id: 'primary' }]
                }
            });
            const busyBlocks = res.data.calendars?.['primary']?.busy || [];
            return busyBlocks.map(block => ({
                start: new Date(block.start!),
                end: new Date(block.end!)
            }));
        } catch (error) {
            console.error("Failed to query Google Calendar Free/Busy", error);
            // On failure (e.g., token expired), we might return empty array or throw.
            // In a production environment, if token expired, we would try to refresh it first.
            throw error;
        }
    }

    async createEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent> {
        const calendar = this.getClient(accessToken);
        const res = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1, // Required for Google Meet links
            requestBody: {
                summary: event.title,
                description: event.description,
                start: { dateTime: event.startTime.toISOString() },
                end: { dateTime: event.endTime.toISOString() },
                attendees: event.attendeeEmails.map(email => ({ email })),
                conferenceData: {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7), // Unique request ID
                        conferenceSolutionKey: { type: "hangoutsMeet" }
                    }
                }
            }
        });
        
        return {
            ...event,
            providerEventId: res.data.id!,
            meetLink: res.data.hangoutLink!
        };
    }

    async deleteEvent(accessToken: string, providerEventId: string): Promise<void> {
        const calendar = this.getClient(accessToken);
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: providerEventId
        });
    }
}
