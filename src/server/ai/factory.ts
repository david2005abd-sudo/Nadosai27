import { MOCK_MODEL } from "@/lib/constants";
import { createMockProvider } from "@/server/ai/mock";
import { createOpenAICompatibleProvider } from "@/server/ai/openai";
import type { ChatProvider } from "@/server/ai/provider";

export interface ProviderSelection {
  provider: ChatProvider;
  model: string;
  isMock: boolean;
}

export function getChatProvider(conversationModel: string): ProviderSelection {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    return { provider: createMockProvider(), model: MOCK_MODEL, isMock: true };
  }
  const aiModel = process.env.AI_MODEL?.trim() || conversationModel;
  const baseURL = process.env.AI_BASE_URL?.trim();
  return {
    provider: createOpenAICompatibleProvider({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
      model: aiModel,
    }),
    model: aiModel,
    isMock: false,
  };
}
