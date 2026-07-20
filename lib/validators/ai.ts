import { z } from "zod";

export const aiRequestTypes = [
  "write_zalo_message",
  "write_email",
  "write_follow_up",
  "handle_objection",
  "summarize_notes",
  "suggest_next_step",
  "personalize_template",
  "rewrite_message",
  "shorten_message",
  "make_message_warmer",
  "make_message_more_professional",
] as const;

export const aiOutputTypes = [
  "email",
  "follow_up",
  "lead_summary",
  "next_step",
  "objection_response",
  "other",
  "zalo_message",
] as const;

export const aiGenerateSchema = z.object({
  channel: z.enum(["direct", "email", "other", "phone", "zalo"]).optional(),
  customInstruction: z.string().trim().max(1200).optional().or(z.literal("")),
  leadId: z.string().uuid().optional().or(z.literal("")),
  objectionType: z
    .enum([
      "call_later",
      "need_more_time",
      "no_need",
      "not_decision_maker",
      "other",
      "price_high",
      "send_info_first",
      "using_competitor",
    ])
    .optional(),
  requestType: z.enum(aiRequestTypes),
  templateId: z.string().uuid().optional().or(z.literal("")),
  tone: z
    .enum(["direct", "friendly", "persuasive", "professional", "short", "warm"])
    .optional(),
});

export const aiSaveOutputSchema = z.object({
  aiRequestId: z.string().uuid(),
  content: z.string().trim().min(2).max(4000),
  leadId: z.string().uuid().optional().or(z.literal("")),
  outputType: z.enum(aiOutputTypes).default("other"),
  title: z.string().trim().max(160).optional().or(z.literal("")),
});

export const aiSaveToNoteSchema = z.object({
  aiRequestId: z.string().uuid(),
  content: z.string().trim().min(2).max(2000),
  leadId: z.string().uuid(),
  outputType: z.enum(aiOutputTypes).default("other"),
});

export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;
export type AISaveOutputInput = z.infer<typeof aiSaveOutputSchema>;
export type AISaveToNoteInput = z.infer<typeof aiSaveToNoteSchema>;
