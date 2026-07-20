import type {
  AIProvider,
  GenerateTextInput,
  GenerateTextResult,
} from "@/lib/providers/ai/types";

export class AIConfigError extends Error {
  constructor() {
    super("Chưa cấu hình AI. Vui lòng thêm AI_API_KEY hoặc thử lại sau.");
    this.name = "AIConfigError";
  }
}

const DEFAULT_MODEL = "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function getConfig() {
  const apiKey = process.env.AI_API_KEY?.trim();

  if (!apiKey) {
    throw new AIConfigError();
  }

  return {
    apiKey,
    model: process.env.AI_MODEL?.trim() || DEFAULT_MODEL,
    provider: process.env.AI_PROVIDER?.trim() || "openai",
  };
}

function parseOutputText(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return "";
  }

  const record = raw as Record<string, unknown>;

  if (typeof record.output_text === "string") {
    return record.output_text.trim();
  }

  const output = record.output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      const text = (item as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function parseUsage(raw: unknown) {
  const usage =
    raw && typeof raw === "object"
      ? (raw as { usage?: Record<string, unknown> }).usage
      : null;

  return {
    tokensInput: Number(usage?.input_tokens ?? usage?.prompt_tokens) || undefined,
    tokensOutput:
      Number(usage?.output_tokens ?? usage?.completion_tokens) || undefined,
  };
}

export class DefaultAIProvider implements AIProvider {
  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const config = getConfig();

    if (config.provider !== "openai" && config.provider !== "default_llm") {
      throw new Error("AI_PROVIDER_NOT_SUPPORTED");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        body: JSON.stringify({
          input: [
            {
              content: input.systemPrompt,
              role: "system",
            },
            {
              content: input.userPrompt,
              role: "user",
            },
          ],
          max_output_tokens: input.maxTokens ?? 700,
          model: config.model,
          temperature: input.temperature ?? 0.5,
        }),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      });
      const raw = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error("AI_PROVIDER_REQUEST_FAILED");
      }

      const text = parseOutputText(raw);

      if (!text) {
        throw new Error("AI_PROVIDER_EMPTY_OUTPUT");
      }

      return {
        modelName: config.model,
        raw,
        text,
        ...parseUsage(raw),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
