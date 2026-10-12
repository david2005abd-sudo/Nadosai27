import { MOCK_PROVIDER_NAME } from "@/lib/constants";
import { ar } from "@/messages/ar";
import type { ChatProvider, ProviderStream, ProviderStreamParams } from "@/server/ai/provider";

const CHUNK_DELAY_MS = 12;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockProvider(): ChatProvider {
  return {
    name: MOCK_PROVIDER_NAME,
    stream(params: ProviderStreamParams): ProviderStream {
      const text = ar.mock.providerMessage;
      const signal = params.signal;

      async function* generate(): AsyncGenerator<string, void, void> {
        for (const char of Array.from(text)) {
          if (signal.aborted) return;
          await delay(CHUNK_DELAY_MS);
          yield char;
        }
      }

      return {
        textStream: generate(),
        usage: Promise.resolve(undefined),
      };
    },
  };
}
