import { z } from "zod";
import { LEAD_PRIORITIES } from "@/lib/constants/lead-priority";
import { LEAD_STATUSES } from "@/lib/constants/lead-status";
import { BULK_ACTION_TYPES, MERGE_FIELD_OPTIONS } from "@/lib/constants/lead-cleanup";

const leadStatusValues = LEAD_STATUSES.map((status) => status.value) as [
  string,
  ...string[],
];
const leadPriorityValues = LEAD_PRIORITIES.map((priority) => priority.value) as [
  string,
  ...string[],
];
const bulkActionValues = Object.keys(BULK_ACTION_TYPES) as [string, ...string[]];

export const mergeLeadsSchema = z
  .object({
    fieldStrategy: z
      .partialRecord(z.enum(MERGE_FIELD_OPTIONS), z.string().uuid())
      .optional()
      .default({}),
    mergeGroupId: z.string().uuid().optional(),
    mergedLeadIds: z.array(z.string().uuid()).min(1),
    primaryLeadId: z.string().uuid(),
  })
  .transform((input) => ({
    ...input,
    mergedLeadIds: Array.from(
      new Set(input.mergedLeadIds.filter((leadId) => leadId !== input.primaryLeadId)),
    ),
  }));

export const dismissMergeGroupSchema = z.object({
  action: z.literal("dismiss"),
});

export const scanDataQualitySchema = z.object({
  force: z.boolean().optional(),
});

export const bulkActionSchema = z
  .object({
    actionType: z.enum(bulkActionValues),
    confirmation: z.boolean().optional(),
    leadIds: z.array(z.string().uuid()).min(1).max(500),
    payload: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .superRefine((input, context) => {
    if (input.actionType === "update_status") {
      const status = input.payload.status;

      if (typeof status !== "string" || !leadStatusValues.includes(status)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Trang thai chua hop le.",
          path: ["payload", "status"],
        });
      }
    }

    if (input.actionType === "set_priority") {
      const priority = input.payload.priority;

      if (typeof priority !== "string" || !leadPriorityValues.includes(priority)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Muc uu tien chua hop le.",
          path: ["payload", "priority"],
        });
      }
    }

    if (input.actionType === "add_tags" || input.actionType === "remove_tags") {
      const tagIds = Array.isArray(input.payload.tagIds) ? input.payload.tagIds : [];
      const tagNames = Array.isArray(input.payload.tagNames) ? input.payload.tagNames : [];

      if (tagIds.length === 0 && tagNames.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Can chon hoac nhap tag.",
          path: ["payload", "tagIds"],
        });
      }
    }

    if (
      (input.actionType === "archive" ||
        input.actionType === "soft_delete" ||
        input.actionType === "restore") &&
      input.confirmation !== true
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Can xac nhan truoc khi thuc hien.",
        path: ["confirmation"],
      });
    }
  });

export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type MergeLeadsInput = z.infer<typeof mergeLeadsSchema>;
