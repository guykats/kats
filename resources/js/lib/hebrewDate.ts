import { HDate, HebrewCalendar, Locale, Sedra, gematriya } from '@hebcal/core';

export type HebrewDayInfo = {
    /** Compact Hebrew day-of-month numeral, e.g. "כ״ב" — for per-cell display */
    dayNumeral: string;
    /** Full Hebrew date (day, month, year), e.g. "כ״ב אב תשפ״ו" */
    fullDate: string;
    /** Hebrew names of any holidays/Rosh Chodesh falling on this day */
    holidays: string[];
    /** Hebrew name of the Torah portion read on the Shabbat of this day's week, or null during festival weeks with no regular reading */
    parasha: string | null;
};

function stripNiqqud(text: string): string {
    return text.normalize('NFC').replace(/[֑-ׇ]/g, '');
}

function stripHebrewYearSuffix(text: string): string {
    return text.replace(/\s+\d+$/, '').trim();
}

const sedraByYear = new Map<number, Sedra>();

function getSedra(hebrewYear: number): Sedra {
    let sedra = sedraByYear.get(hebrewYear);
    if (!sedra) {
        sedra = new Sedra(hebrewYear, true); // Israel reading schedule
        sedraByYear.set(hebrewYear, sedra);
    }
    return sedra;
}

export function getHebrewDayInfo(date: Date): HebrewDayInfo {
    const hd = new HDate(date);

    const holidayEvents = HebrewCalendar.getHolidaysOnDate(hd, true) ?? [];
    const holidays = holidayEvents.map((event) => stripNiqqud(stripHebrewYearSuffix(event.render('he'))));

    const sedra = getSedra(hd.getFullYear());
    const weekly = sedra.lookup(hd);
    const parasha =
        !weekly.chag && weekly.parsha.length > 0
            ? stripNiqqud(weekly.parsha.map((name) => Locale.gettext(name, 'he')).join('־'))
            : null;

    return {
        dayNumeral: gematriya(hd.getDate()),
        fullDate: stripNiqqud(hd.renderGematriya()),
        holidays,
        parasha,
    };
}
