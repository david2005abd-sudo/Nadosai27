export interface DayRange {
  readonly start: Date;
  readonly end: Date;
}

function formatLocalDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string): string => {
    const part = parts.find((p) => p.type === type);
    return part ? part.value : "01";
  };
  return `${get("year")}-${get("month")}-${get("day")}`;
}

interface LocalClocks {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function localClocks(date: Date, timeZone: string): LocalClocks {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function zonedMidnightToUtc(dateStr: string, timeZone: string): Date {
  const [yearStr = "1970", monthStr = "1", dayStr = "1"] = dateStr.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const localMidnightAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let ts = localMidnightAsUtc;
  for (let i = 0; i < 3; i += 1) {
    const clocks = localClocks(new Date(ts), timeZone);
    const asUtc = Date.UTC(
      clocks.year,
      clocks.month - 1,
      clocks.day,
      clocks.hour,
      clocks.minute,
      clocks.second,
    );
    const offset = asUtc - ts;
    const next = localMidnightAsUtc - offset;
    if (next === ts) break;
    ts = next;
  }
  return new Date(ts);
}

function addDaysToDateString(dateStr: string, days: number): string {
  const [yearStr = "1970", monthStr = "1", dayStr = "1"] = dateStr.split("-");
  const base = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr) + days));
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  const d = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayRangeUtc(timeZone: string, now: Date = new Date()): DayRange {
  const localDate = formatLocalDate(now, timeZone);
  const start = zonedMidnightToUtc(localDate, timeZone);
  const end = zonedMidnightToUtc(addDaysToDateString(localDate, 1), timeZone);
  return { start, end };
}

export function isSameLocalDay(a: Date, b: Date, timeZone: string): boolean {
  return formatLocalDate(a, timeZone) === formatLocalDate(b, timeZone);
}

export function localDateKey(date: Date, timeZone: string): string {
  return formatLocalDate(date, timeZone);
}
