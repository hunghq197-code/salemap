import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (maxLength: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(maxLength).optional());

const cadenceCategorySchema = z.enum([
  "after_quote",
  "cold_lead",
  "general",
  "interested_lead",
  "new_lead",
  "old_customer",
]);

const taskTypeSchema = z.enum([
  "follow_up",
  "call",
  "zalo_message",
  "email",
  "meeting",
  "quote",
  "check_in",
  "other",
]);

const prioritySchema = z.enum(["low", "medium", "high"]);

const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "interested",
  "follow_up",
  "not_fit",
  "won",
  "lost",
]);

export const cadenceStepInputSchema = z.object({
  dayOffset: z.coerce.number().int().min(0).max(365),
  isRequired: z.coerce.boolean().default(true),
  priority: prioritySchema.default("medium"),
  stepOrder: z.coerce.number().int().min(1),
  suggestedLeadStatus: z.preprocess(
    emptyToUndefined,
    leadStatusSchema.optional(),
  ),
  suggestedMessage: optionalText(2000),
  suggestedNote: optionalText(2000),
  taskType: taskTypeSchema.default("follow_up"),
  title: z.string().trim().min(2).max(120),
});

export const createCadenceTemplateSchema = z.object({
  category: cadenceCategorySchema.default("general"),
  description: optionalText(500),
  isActive: z.coerce.boolean().default(true),
  name: z.string().trim().min(2).max(80),
  steps: z.array(cadenceStepInputSchema).min(1),
});

export const updateCadenceTemplateSchema = createCadenceTemplateSchema;

export const applyCadenceToLeadSchema = z.object({
  cadenceTemplateId: z.string().uuid(),
  leadId: z.string().uuid(),
  replaceExistingActive: z.coerce.boolean().default(false),
  startDate: z.string().trim().optional(),
});

export const applyCadenceToLeadsSchema = z.object({
  cadenceTemplateId: z.string().uuid(),
  leadIds: z.array(z.string().uuid()).min(1).max(100),
  replaceExistingActive: z.coerce.boolean().default(false),
  startDate: z.string().trim().optional(),
});

export const leadCadenceMutationSchema = z.object({
  cancelPendingTasks: z.coerce.boolean().default(true),
});

export type ApplyCadenceToLeadInput = z.infer<typeof applyCadenceToLeadSchema>;
export type ApplyCadenceToLeadsInput = z.infer<typeof applyCadenceToLeadsSchema>;
export type CadenceStepInput = z.infer<typeof cadenceStepInputSchema>;
export type CreateCadenceTemplateInput = z.infer<typeof createCadenceTemplateSchema>;
export type LeadCadenceMutationInput = z.infer<typeof leadCadenceMutationSchema>;
export type UpdateCadenceTemplateInput = z.infer<typeof updateCadenceTemplateSchema>;
