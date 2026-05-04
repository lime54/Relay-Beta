import { test, expect } from '@playwright/test';
import { generateAvailableSlots } from '../src/lib/scheduling/slot-generator';

const FRIDAY_9_TO_5 = {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
};

test.describe('generateAvailableSlots', () => {
    test('produces 30-min slots across a single workday', () => {
        // A Wednesday at midnight local time
        const day = new Date(2030, 5, 5, 0, 0, 0);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        const slots = generateAvailableSlots({
            rangeStart: day,
            rangeEnd: next,
            schedule: FRIDAY_9_TO_5,
            durationMins: 30,
            now: day, // freeze "now" at midnight so all of the day is in the future
        });

        // 9am-5pm = 8 hours = 16 thirty-minute slots
        expect(slots.length).toBe(16);
    });

    test('skips slots that overlap busy blocks', () => {
        const day = new Date(2030, 5, 5, 0, 0, 0);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        const noon = new Date(day);
        noon.setHours(12, 0, 0, 0);
        const onePm = new Date(day);
        onePm.setHours(13, 0, 0, 0);

        const slots = generateAvailableSlots({
            rangeStart: day,
            rangeEnd: next,
            schedule: FRIDAY_9_TO_5,
            durationMins: 30,
            busyBlocks: [{ start: noon, end: onePm }],
            now: day,
        });

        // 16 - 2 (the 12:00 and 12:30 slots) = 14
        expect(slots.length).toBe(14);
        const isoNoon = noon.toISOString();
        const iso1230 = new Date(noon.getTime() + 30 * 60_000).toISOString();
        expect(slots).not.toContain(isoNoon);
        expect(slots).not.toContain(iso1230);
    });

    test('respects buffer-before and buffer-after windows', () => {
        const day = new Date(2030, 5, 5, 0, 0, 0);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        const noon = new Date(day);
        noon.setHours(12, 0, 0, 0);
        const oneThirty = new Date(day);
        oneThirty.setHours(13, 30, 0, 0);

        const baseline = generateAvailableSlots({
            rangeStart: day,
            rangeEnd: next,
            schedule: FRIDAY_9_TO_5,
            durationMins: 30,
            busyBlocks: [{ start: noon, end: oneThirty }],
            now: day,
        });

        const buffered = generateAvailableSlots({
            rangeStart: day,
            rangeEnd: next,
            schedule: FRIDAY_9_TO_5,
            durationMins: 30,
            bufferBeforeMins: 15,
            bufferAfterMins: 15,
            busyBlocks: [{ start: noon, end: oneThirty }],
            now: day,
        });

        expect(buffered.length).toBeLessThan(baseline.length);
    });

    test('skips slots in the past', () => {
        const day = new Date(2030, 5, 5, 0, 0, 0);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);

        const noon = new Date(day);
        noon.setHours(12, 0, 0, 0);

        const slots = generateAvailableSlots({
            rangeStart: day,
            rangeEnd: next,
            schedule: FRIDAY_9_TO_5,
            durationMins: 30,
            now: noon,
        });

        // 12:00 itself is excluded (slotStart > now is strict), so 12:30..4:30 = 9 slots.
        expect(slots.length).toBe(9);
        for (const s of slots) {
            expect(new Date(s).getTime()).toBeGreaterThan(noon.getTime());
        }
    });

    test('returns empty array on inverted range', () => {
        const a = new Date(2030, 5, 5);
        const b = new Date(2030, 5, 4);
        const slots = generateAvailableSlots({
            rangeStart: a,
            rangeEnd: b,
            schedule: FRIDAY_9_TO_5,
            durationMins: 30,
        });
        expect(slots).toEqual([]);
    });

    test('skips weekends when schedule does not include them', () => {
        // Saturday June 1, 2030
        const sat = new Date(2030, 5, 1, 0, 0, 0);
        const sun = new Date(sat);
        sun.setDate(sun.getDate() + 2);
        const slots = generateAvailableSlots({
            rangeStart: sat,
            rangeEnd: sun,
            schedule: FRIDAY_9_TO_5,
            durationMins: 30,
            now: sat,
        });
        expect(slots).toEqual([]);
    });
});
