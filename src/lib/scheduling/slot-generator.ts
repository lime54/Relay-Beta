export interface DaySchedule {
    start: string; // "HH:MM"
    end: string; // "HH:MM"
}

export type WeeklySchedule = Record<string, DaySchedule[]>;

export interface SlotGenerationOptions {
    rangeStart: Date;
    rangeEnd: Date;
    schedule: WeeklySchedule;
    durationMins: number;
    bufferBeforeMins?: number;
    bufferAfterMins?: number;
    busyBlocks?: { start: Date; end: Date }[];
    /** Defaults to `new Date()`. Slots that begin before this are excluded. */
    now?: Date;
}

/**
 * Pure helper that generates ISO-string slots within a range based on a weekly schedule,
 * removing any that overlap with the supplied busy blocks (with optional buffers).
 *
 * Splitting this out lets us unit-test the booking math without involving Supabase or Google.
 */
export function generateAvailableSlots(opts: SlotGenerationOptions): string[] {
    const {
        rangeStart,
        rangeEnd,
        schedule,
        durationMins,
        bufferBeforeMins = 0,
        bufferAfterMins = 0,
        busyBlocks = [],
        now = new Date(),
    } = opts;

    if (rangeEnd <= rangeStart || durationMins <= 0) return [];

    const out: string[] = [];

    const cursor = new Date(rangeStart);
    cursor.setHours(0, 0, 0, 0);

    while (cursor < rangeEnd) {
        const dow = cursor
            .toLocaleDateString('en-US', { weekday: 'long' })
            .toLowerCase();
        const dayRules = schedule[dow];

        if (dayRules && dayRules.length > 0) {
            for (const rule of dayRules) {
                const [sh, sm] = rule.start.split(':').map(Number);
                const [eh, em] = rule.end.split(':').map(Number);

                const ruleStart = new Date(cursor);
                ruleStart.setHours(sh, sm, 0, 0);
                const ruleEnd = new Date(cursor);
                ruleEnd.setHours(eh, em, 0, 0);

                let slotStart = new Date(ruleStart);
                while (slotStart < ruleEnd) {
                    const slotEnd = new Date(slotStart.getTime() + durationMins * 60_000);
                    if (slotEnd > ruleEnd) break;

                    if (slotStart > now && slotStart >= rangeStart && slotEnd <= rangeEnd) {
                        const sb = new Date(slotStart.getTime() - bufferBeforeMins * 60_000);
                        const eb = new Date(slotEnd.getTime() + bufferAfterMins * 60_000);
                        const conflict = busyBlocks.some(
                            (b) => sb < b.end && eb > b.start
                        );
                        if (!conflict) out.push(slotStart.toISOString());
                    }

                    slotStart = new Date(slotStart.getTime() + durationMins * 60_000);
                }
            }
        }

        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
    }

    return out;
}
