import { CONTEXT_MAX_INPUT_TOKENS, CONTEXT_MAX_MESSAGES } from "@/lib/constants";
import { estimateTokens } from "@/lib/text/estimate";

export interface ContextMessage {
  role: "user" | "assistant";
  content: string;
}

export function selectContextMessages(
  messages: ContextMessage[],
  maxInputTokens: number = CONTEXT_MAX_INPUT_TOKENS,
  maxMessages: number = CONTEXT_MAX_MESSAGES,
): ContextMessage[] {
  const window = messages.slice(-maxMessages);
  const selected: ContextMessage[] = [];
  let total = 0;
  for (let index = window.length - 1; index >= 0; index -= 1) {
    const message = window[index];
    if (!message) continue;
    const cost = estimateTokens(message.content);
    if (selected.length > 0 && total + cost > maxInputTokens) break;
    selected.unshift(message);
    total += cost;
  }
  return selected;
}
