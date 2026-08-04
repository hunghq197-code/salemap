import type {
  AIProvider,
  GenerateTextInput,
  GenerateTextResult,
} from "@/lib/providers/ai/types";

export class AIConfigError extends Error {
  constructor(provider = "AI") {
    super(
      provider === "gemini"
        ? "Chưa cấu hình AI. Vui lòng thêm GEMINI_API_KEY hoặc thử lại sau."
        : "Chưa cấu hình AI. Vui lòng thêm AI_API_KEY hoặc thử lại sau.",
    );
    this.name = "AIConfigError";
  }
}

const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const GEMINI_GENERATE_CONTENT_URL = "https://generativelanguage.googleapis.com/v1beta";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function getConfig() {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() || "openai";
  const isGemini = provider === "gemini" || provider === "google_gemini";
  const apiKey = isGemini
    ? process.env.GEMINI_API_KEY?.trim() || process.env.AI_API_KEY?.trim()
    : process.env.AI_API_KEY?.trim();

  if (!apiKey) {
    throw new AIConfigError(isGemini ? "gemini" : provider);
  }

  return {
    apiKey,
    model: isGemini
      ? process.env.GEMINI_MODEL?.trim() ||
        process.env.AI_MODEL?.trim() ||
        DEFAULT_GEMINI_MODEL
      : process.env.AI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    provider,
  };
}

function parseOpenAIOutputText(raw: unknown) {
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

function parseGeminiOutputText(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return "";
  }

  const candidates = (raw as { candidates?: unknown }).candidates;

  if (!Array.isArray(candidates)) {
    return "";
  }

  return candidates
    .flatMap((candidate) => {
      const parts = (candidate as { content?: { parts?: unknown } }).content?.parts;
      return Array.isArray(parts) ? parts : [];
    })
    .map((part) => {
      const text = (part as { text?: unknown }).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function parseOpenAIUsage(raw: unknown) {
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

function parseGeminiUsage(raw: unknown) {
  const usage =
    raw && typeof raw === "object"
      ? (raw as { usageMetadata?: Record<string, unknown>; usage_metadata?: Record<string, unknown> })
          .usageMetadata ||
        (raw as { usage_metadata?: Record<string, unknown> }).usage_metadata
      : null;

  return {
    tokensInput:
      Number(usage?.promptTokenCount ?? usage?.prompt_token_count) || undefined,
    tokensOutput:
      Number(usage?.candidatesTokenCount ?? usage?.candidates_token_count) ||
      undefined,
  };
}

function shouldSendGeminiTemperature(model: string) {
  return !model.toLowerCase().startsWith("gemini-3");
}

function geminiModelPath(model: string) {
  return model.startsWith("models/") ? model : `models/${model}`;
}

async function generateOpenAIText(
  config: { apiKey: string; model: string },
  input: GenerateTextInput,
  signal: AbortSignal,
) {
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
    signal,
  });
  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("AI_PROVIDER_REQUEST_FAILED");
  }

  const text = parseOpenAIOutputText(raw);

  if (!text) {
    throw new Error("AI_PROVIDER_EMPTY_OUTPUT");
  }

  return {
    modelName: config.model,
    raw,
    text,
    ...parseOpenAIUsage(raw),
  } satisfies GenerateTextResult;
}

async function generateGeminiText(
  config: { apiKey: string; model: string },
  input: GenerateTextInput,
  signal: AbortSignal,
) {
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: input.maxTokens ?? 700,
  };

  if (input.responseMimeType === "application/json") {
    generationConfig.responseMimeType = "application/json";
  }

  if (
    typeof input.temperature === "number" &&
    shouldSendGeminiTemperature(config.model)
  ) {
    generationConfig.temperature = input.temperature;
  }

  const response = await fetch(
    `${GEMINI_GENERATE_CONTENT_URL}/${geminiModelPath(config.model)}:generateContent`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: input.userPrompt }],
            role: "user",
          },
        ],
        generationConfig,
        systemInstruction: {
          parts: [{ text: input.systemPrompt }],
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      method: "POST",
      signal,
    },
  );
  const raw = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("AI_PROVIDER_REQUEST_FAILED");
  }

  const text = parseGeminiOutputText(raw);

  if (!text) {
    throw new Error("AI_PROVIDER_EMPTY_OUTPUT");
  }

  return {
    modelName: config.model,
    raw,
    text,
    ...parseGeminiUsage(raw),
  } satisfies GenerateTextResult;
}

export class DefaultAIProvider implements AIProvider {
  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const config = getConfig();

    if (
      config.provider !== "openai" &&
      config.provider !== "default_llm" &&
      config.provider !== "gemini" &&
      config.provider !== "google_gemini"
    ) {
      throw new Error("AI_PROVIDER_NOT_SUPPORTED");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      if (config.provider === "gemini" || config.provider === "google_gemini") {
        return generateGeminiText(config, input, controller.signal);
      }

      return generateOpenAIText(config, input, controller.signal);
    } finally {
      clearTimeout(timeout);
    }
  }
}
