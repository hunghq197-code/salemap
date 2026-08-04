export type GenerateTextInput = {
  maxTokens?: number;
  metadata?: Record<string, unknown>;
  responseMimeType?: "application/json" | "text/plain";
  systemPrompt: string;
  temperature?: number;
  userPrompt: string;
};

export type GenerateTextResult = {
  modelName?: string;
  raw?: unknown;
  text: string;
  tokensInput?: number;
  tokensOutput?: number;
};

export type AIProvider = {
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
};
