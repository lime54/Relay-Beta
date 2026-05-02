export interface CalendarEvent {
    providerEventId?: string;
    startTime: Date;
    endTime: Date;
    title: string;
    description?: string;
    attendeeEmails: string[];
    meetLink?: string;
}

export interface CalendarProvider {
    getFreeBusy(accessToken: string, startTime: Date, endTime: Date): Promise<{ start: Date; end: Date }[]>;
    createEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent>;
    deleteEvent(accessToken: string, providerEventId: string): Promise<void>;
}
