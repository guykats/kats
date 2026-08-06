import { addDays, getDate, getDay, getMonth, isBefore, startOfDay, subDays } from 'date-fns';
import type { FamilyEvent } from '../types';
import { keyToDate } from '../Components/DayModal';

/** Does `day` land exactly on one of the event's recurrence anchors (ignoring multi-day span)? */
function isOccurrenceAnchor(event: FamilyEvent, day: Date): boolean {
    const start = startOfDay(keyToDate(event.date));
    const target = startOfDay(day);

    if (event.recurrence === 'none' || !event.recurrence) {
        return target.getTime() === start.getTime();
    }

    if (isBefore(target, start)) {
        return false;
    }

    switch (event.recurrence) {
        case 'weekly':
            return getDay(target) === getDay(start);
        case 'monthly':
            return getDate(target) === getDate(start);
        case 'yearly':
            return getDate(target) === getDate(start) && getMonth(target) === getMonth(start);
        default:
            return false;
    }
}

export function eventOccursOnDay(event: FamilyEvent, day: Date): boolean {
    const span = Math.max(1, event.days ?? 1);
    for (let offset = 0; offset < span; offset++) {
        if (isOccurrenceAnchor(event, subDays(day, offset))) {
            return true;
        }
    }
    return false;
}

export function getEventsForDay(events: FamilyEvent[], day: Date): FamilyEvent[] {
    return events.filter((event) => eventOccursOnDay(event, day));
}

export type WeekSegment = {
    event: FamilyEvent;
    /** 1-based column index (1-7) within the week */
    startCol: number;
    endCol: number;
    /** false when the event continues into the previous/next week, so that edge stays flat */
    isTrueStart: boolean;
    isTrueEnd: boolean;
    lane: number;
};

/**
 * For a single week (exactly 7 days), find each event's contiguous run(s) of
 * occurrence within that week, so a multi-day event can render as one
 * unbroken bar instead of separate per-day dots.
 */
export function getWeekSegments(events: FamilyEvent[], weekDays: Date[]): WeekSegment[] {
    const raw: Omit<WeekSegment, 'lane'>[] = [];

    for (const event of events) {
        let runStart = -1;
        for (let i = 0; i < weekDays.length; i++) {
            const occurs = eventOccursOnDay(event, weekDays[i]);
            if (occurs && runStart === -1) {
                runStart = i;
            }
            if (!occurs && runStart !== -1) {
                raw.push(buildSegment(event, weekDays, runStart, i - 1));
                runStart = -1;
            }
        }
        if (runStart !== -1) {
            raw.push(buildSegment(event, weekDays, runStart, weekDays.length - 1));
        }
    }

    raw.sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);

    const laneEnds: number[] = [];
    const segments: WeekSegment[] = [];
    for (const seg of raw) {
        let lane = laneEnds.findIndex((end) => end < seg.startCol);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(seg.endCol);
        } else {
            laneEnds[lane] = seg.endCol;
        }
        segments.push({ ...seg, lane });
    }

    return segments;
}

function buildSegment(
    event: FamilyEvent,
    weekDays: Date[],
    startIdx: number,
    endIdx: number,
): Omit<WeekSegment, 'lane'> {
    const dayBeforeStart = subDays(weekDays[startIdx], 1);
    const dayAfterEnd = addDays(weekDays[endIdx], 1);
    return {
        event,
        startCol: startIdx + 1,
        endCol: endIdx + 1,
        isTrueStart: !eventOccursOnDay(event, dayBeforeStart),
        isTrueEnd: !eventOccursOnDay(event, dayAfterEnd),
    };
}
