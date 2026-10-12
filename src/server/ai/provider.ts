export interface ProviderMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProviderUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ProviderStream {
  textStream: AsyncIterable<string>;
  usage: PromiseLike<ProviderUsage | undefined>;
}

export interface ProviderStreamParams {
  messages: ProviderMessage[];
  signal: AbortSignal;
  maxOutputTokens: number;
}

export interface ChatProvider {
  readonly name: string;
  stream(params: ProviderStreamParams): ProviderStream;
}
