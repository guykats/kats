import { getDate, getDay, getMonth, isBefore, startOfDay } from 'date-fns';
import type { FamilyEvent } from '../types';
import { keyToDate } from '../Components/DayModal';

export function eventOccursOnDay(event: FamilyEvent, day: Date): boolean {
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

export function getEventsForDay(events: FamilyEvent[], day: Date): FamilyEvent[] {
    return events.filter((event) => eventOccursOnDay(event, day));
}
