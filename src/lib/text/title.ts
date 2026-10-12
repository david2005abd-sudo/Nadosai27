export function truncateTitle(input: string, max = 40): string {
  const normalized = input.trim().replace(/\s+/g, " ");
  const chars = Array.from(normalized);
  if (chars.length <= max) return normalized;
  let slice = chars.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > 0) slice = slice.slice(0, lastSpace);
  return slice.join("").trim();
}
