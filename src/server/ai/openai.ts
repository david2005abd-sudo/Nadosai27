import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  PROVIDER_CONNECT_TIMEOUT_MS,
  PROVIDER_TOTAL_TIMEOUT_MS,
  SYSTEM_PROMPT,
} from "@/lib/constants";
import type { ChatProvider, ProviderStream, ProviderStreamParams } from "@/server/ai/provider";

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
}

export function createOpenAICompatibleProvider(config: OpenAICompatibleConfig): ChatProvider {
  const provider = createOpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });
  const model = provider.chat(config.model);

  return {
    name: "openai",
    stream(params: ProviderStreamParams): ProviderStream {
      const result = streamText({
        model,
        instructions: SYSTEM_PROMPT,
        messages: params.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        maxOutputTokens: params.maxOutputTokens,
        abortSignal: params.signal,
        timeout: {
          firstChunkMs: PROVIDER_CONNECT_TIMEOUT_MS,
          totalMs: PROVIDER_TOTAL_TIMEOUT_MS,
        },
      });
      return {
        textStream: result.textStream,
        usage: result.usage.then((usage) => ({
          promptTokens: usage.inputTokens,
          completionTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
        })),
      };
    },
  };
}
