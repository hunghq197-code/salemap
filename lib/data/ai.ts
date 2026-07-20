import { buildAIPrompt, getAIOutputType } from "@/lib/ai/prompt-builder";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getLeadById } from "@/lib/data/leads";
import { createLeadNote, getLeadNotes } from "@/lib/data/lead-notes";
import { getTemplateById } from "@/lib/data/templates";
import {
  checkDailyQuota,
  consumeDailyQuota,
  QuotaExceededError,
  type DailyUsage,
} from "@/lib/data/usage";
import { AIConfigError } from "@/lib/providers/ai/default-provider";
import { getAIProvider } from "@/lib/providers/ai/provider";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AIGenerateInput,
  AISaveOutputInput,
  AISaveToNoteInput,
} from "@/lib/validators/ai";

export type AIRequestRecord = {
  created_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  estimated_cost?: number | null;
  id: string;
  lead_id?: string | null;
  model_name?: string | null;
  output_text?: string | null;
  provider?: string | null;
  request_type: string;
  status?: string | null;
  template_id?: string | null;
  tokens_input?: number | null;
  tokens_output?: number | null;
  user_id: string;
};

export class AIFeatureDisabledError extends Error {
  constructor() {
    super("Trợ lý AI đang được mở dần.");
    this.name = "AIFeatureDisabledError";
  }
}

export class AIResourceNotFoundError extends Error {
  constructor(message = "Không tìm thấy dữ liệu phù hợp.") {
    super(message);
    this.name = "AIResourceNotFoundError";
  }
}

function normalizeOptionalId(value?: string) {
  return value && value.trim() ? value.trim() : undefined;
}

function errorCode(error: unknown) {
  if (error instanceof AIConfigError) return "AI_NOT_CONFIGURED";
  if (error instanceof QuotaExceededError) return "AI_QUOTA_EXCEEDED";
  if (error instanceof AIFeatureDisabledError) return "AI_FEATURE_DISABLED";
  if (error instanceof AIResourceNotFoundError) return "AI_RESOURCE_NOT_FOUND";
  if (error instanceof Error) return error.message || "AI_GENERATE_FAILED";

  return "AI_GENERATE_FAILED";
}

async function insertAIRequest(input: {
  error?: unknown;
  inputContext: Record<string, unknown>;
  inputPrompt?: string;
  leadId?: string;
  outputText?: string;
  request: AIGenerateInput;
  result?: {
    modelName?: string;
    tokensInput?: number;
    tokensOutput?: number;
  };
  status: "completed" | "failed";
  templateId?: string;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_requests")
    .insert({
      error_code: input.error ? errorCode(input.error) : null,
      error_message:
        input.error instanceof Error ? input.error.message.slice(0, 500) : null,
      input_context: input.inputContext,
      input_prompt: input.inputPrompt || null,
      lead_id: input.leadId || null,
      model_name: input.result?.modelName || null,
      output_metadata: {
        channel: input.request.channel,
        outputType: getAIOutputType(input.request.requestType),
        tone: input.request.tone,
      },
      output_text: input.outputText || null,
      provider: process.env.AI_PROVIDER || "default_llm",
      request_type: input.request.requestType,
      status: input.status,
      template_id: input.templateId || null,
      tokens_input: input.result?.tokensInput || null,
      tokens_output: input.result?.tokensOutput || null,
      user_id: input.userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function generateAIContent(input: {
  request: AIGenerateInput;
  userId: string;
}) {
  const request = input.request;
  const leadId = normalizeOptionalId(request.leadId);
  const templateId = normalizeOptionalId(request.templateId);
  const featureEnabled = await isFeatureEnabled("ai_assistant", input.userId);

  if (!featureEnabled) {
    throw new AIFeatureDisabledError();
  }

  const quotaCheck = await checkDailyQuota("ai_request");

  if (!quotaCheck.allowed) {
    throw new QuotaExceededError();
  }

  const [lead, notes, template] = await Promise.all([
    leadId ? getLeadById(leadId) : Promise.resolve(null),
    leadId ? getLeadNotes(leadId) : Promise.resolve([]),
    templateId ? getTemplateById(templateId) : Promise.resolve(null),
  ]);

  if (leadId && !lead) {
    throw new AIResourceNotFoundError("Không tìm thấy lead.");
  }

  if (templateId && !template) {
    throw new AIResourceNotFoundError("Không tìm thấy template.");
  }

  const prompt = buildAIPrompt({
    lead,
    notes,
    request,
    template,
  });

  try {
    const result = await getAIProvider().generateText({
      maxTokens: request.requestType === "summarize_notes" ? 650 : 750,
      metadata: {
        hasLeadId: Boolean(leadId),
        hasTemplateId: Boolean(templateId),
        requestType: request.requestType,
      },
      systemPrompt: prompt.systemPrompt,
      temperature: request.tone === "short" ? 0.35 : 0.55,
      userPrompt: prompt.userPrompt,
    });
    const quota = await consumeDailyQuota("ai_request");
    const aiRequestId = await insertAIRequest({
      inputContext: {
        channel: request.channel,
        hasLeadId: Boolean(leadId),
        hasTemplateId: Boolean(templateId),
        objectionType: request.objectionType,
        tone: request.tone,
      },
      inputPrompt: prompt.userPrompt,
      leadId,
      outputText: result.text,
      request,
      result,
      status: "completed",
      templateId,
      userId: input.userId,
    });

    return {
      aiRequestId,
      outputType: getAIOutputType(request.requestType),
      quota,
      text: result.text,
    };
  } catch (error) {
    await insertAIRequest({
      error,
      inputContext: {
        channel: request.channel,
        hasLeadId: Boolean(leadId),
        hasTemplateId: Boolean(templateId),
        objectionType: request.objectionType,
        tone: request.tone,
      },
      inputPrompt: prompt.userPrompt,
      leadId,
      request,
      status: "failed",
      templateId,
      userId: input.userId,
    }).catch(() => undefined);

    throw error;
  }
}

async function assertOwnedAIRequest(userId: string, aiRequestId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_requests")
    .select("id,user_id,lead_id,request_type")
    .eq("id", aiRequestId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new AIResourceNotFoundError("Không tìm thấy AI request.");
  }

  return data as {
    id: string;
    lead_id?: string | null;
    request_type: string;
    user_id: string;
  };
}

export async function saveAIOutput(input: {
  payload: AISaveOutputInput;
  userId: string;
}) {
  await assertOwnedAIRequest(input.userId, input.payload.aiRequestId);

  if (input.payload.leadId) {
    const lead = await getLeadById(input.payload.leadId);

    if (!lead) {
      throw new AIResourceNotFoundError("Không tìm thấy lead.");
    }
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_saved_outputs")
    .insert({
      ai_request_id: input.payload.aiRequestId,
      content: input.payload.content,
      lead_id: normalizeOptionalId(input.payload.leadId) || null,
      output_type: input.payload.outputType,
      title: input.payload.title || "Nội dung AI đã lưu",
      user_id: input.userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

export async function saveAIOutputToLeadNote(input: {
  payload: AISaveToNoteInput;
  userId: string;
}) {
  await assertOwnedAIRequest(input.userId, input.payload.aiRequestId);
  await createLeadNote({
    content: input.payload.content,
    createReminder: false,
    interactionType:
      input.payload.outputType === "follow_up" ? "follow_up" : "other",
    leadId: input.payload.leadId,
    outcome: "AI hỗ trợ",
  });
}

export async function getAIQuotaSnapshot(): Promise<DailyUsage> {
  return checkDailyQuota("ai_request").then((result) => result.usage);
}
