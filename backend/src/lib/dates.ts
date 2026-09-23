/** Calendar-day helpers that group instants by day in a given IANA timezone. */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of `date` as seen in `timeZone`. */
export function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Shifts a "YYYY-MM-DD" key by whole days. */
export function addDays(key: string, days: number): string {
  const time = Date.parse(`${key}T00:00:00Z`) + days * MS_PER_DAY;
  return new Date(time).toISOString().slice(0, 10);
}

/** Keys for Monday…Sunday of the week containing `today`. */
export function weekKeys(today: string): string[] {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const monday = addDays(today, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Date-only column value ("YYYY-MM-DD" at UTC midnight) and back. */
export const parseDateOnly = (value: string) => new Date(`${value}T00:00:00Z`);
export const formatDateOnly = (value: Date) =>
  value.toISOString().slice(0, 10);
