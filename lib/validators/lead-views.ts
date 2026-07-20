import { z } from "zod";
import { LEAD_PRIORITIES } from "@/lib/constants/lead-priority";
import { LEAD_STATUSES } from "@/lib/constants/lead-status";

const statusValues = LEAD_STATUSES.map((status) => status.value) as [string, ...string[]];
const priorityValues = LEAD_PRIORITIES.map((priority) => priority.value) as [
  string,
  ...string[],
];

const optionalStringArray = z.preprocess((value) => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}, z.array(z.string().trim().min(1)).max(30).optional());

export const leadFiltersSchema = z
  .object({
    archived: z.boolean().optional(),
    category: optionalStringArray,
    createdFrom: z.string().optional(),
    createdTo: z.string().optional(),
    deleted: z.boolean().optional(),
    followUp: z
      .enum(["today", "overdue", "today_or_overdue", "this_week", "future"])
      .optional(),
    hasEmail: z.boolean().optional(),
    hasPhone: z.boolean().optional(),
    hasWebsite: z.boolean().optional(),
    noFollowUp: z.boolean().optional(),
    priority: z.array(z.enum(priorityValues)).max(10).optional(),
    q: z.string().trim().max(160).optional(),
    source: optionalStringArray,
    staleDays: z.coerce.number().int().min(1).max(365).optional(),
    status: z.array(z.enum(statusValues)).max(10).optional(),
    tagIds: z.array(z.string().uuid()).max(30).optional(),
    tagNames: optionalStringArray,
  })
  .partial();

export const createSavedViewSchema = z.object({
  color: z.string().trim().max(40).optional(),
  description: z.string().trim().max(300).optional(),
  filters: leadFiltersSchema.default({}),
  icon: z.string().trim().max(60).optional(),
  isPinned: z.boolean().optional(),
  name: z.string().trim().min(1).max(80),
  sortBy: z.string().trim().max(40).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

export const updateSavedViewSchema = createSavedViewSchema.partial().extend({
  isPinned: z.boolean().optional(),
});

export const updatePipelineStatusSchema = z.object({
  fromStatus: z.string().optional(),
  leadId: z.string().uuid(),
  position: z.coerce.number().int().min(0).optional(),
  toStatus: z.enum(statusValues),
});

export type CreateSavedViewInput = z.infer<typeof createSavedViewSchema>;
export type LeadFiltersInput = z.infer<typeof leadFiltersSchema>;
export type UpdatePipelineStatusInput = z.infer<typeof updatePipelineStatusSchema>;
export type UpdateSavedViewInput = z.infer<typeof updateSavedViewSchema>;
