export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const FALLBACK_TIME_ZONES = [
  "Asia/Baghdad",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Amman",
  "Asia/Beirut",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

export function listTimeZones(): string[] {
  try {
    const values = Intl.supportedValuesOf("timeZone");
    if (values.length > 0) return values;
  } catch {
    void 0;
  }
  return FALLBACK_TIME_ZONES;
}
