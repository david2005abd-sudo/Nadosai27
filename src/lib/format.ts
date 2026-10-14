const numberFormatter = new Intl.NumberFormat("ar-IQ-u-nu-latn");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDateTime(value: string | Date, timeZone = "Asia/Baghdad"): string {
  return new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatDateOnly(value: string | Date, timeZone = "Asia/Baghdad"): string {
  return new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
    dateStyle: "medium",
    timeZone,
  }).format(new Date(value));
}

export function formatTimeOnly(value: string | Date, timeZone = "Asia/Baghdad"): string {
  return new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${formatNumber(Math.round(ms))} مللي ثانية`;
  return `${formatNumber(Math.round(ms / 100) / 10)} ثانية`;
}

export function formatPercent(value: number): string {
  return `${numberFormatter.format(Math.round(value))}٪`;
}
