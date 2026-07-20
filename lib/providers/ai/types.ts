export type GenerateTextInput = {
  maxTokens?: number;
  metadata?: Record<string, unknown>;
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
