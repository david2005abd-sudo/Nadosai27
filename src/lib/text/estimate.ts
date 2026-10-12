export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

export function estimateMessagesTokens(texts: readonly string[]): number {
  let total = 0;
  for (const text of texts) total += estimateTokens(text);
  return total;
}
