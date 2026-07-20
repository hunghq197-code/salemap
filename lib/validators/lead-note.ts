import { z } from "zod";
import { DEFAULT_INTERACTION_TYPE } from "@/lib/constants/interaction-types";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (maxLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength, "Nội dung quá dài.").optional(),
  );

export const leadNoteFormSchema = z
  .object({
    leadId: z.string().uuid(),
    interactionType: z
      .enum(["call", "message", "visit", "email", "quote_sent", "follow_up", "other"])
      .default(DEFAULT_INTERACTION_TYPE),
    outcome: optionalText(120).default("other"),
    content: z
      .string()
      .trim()
      .min(2, "Nội dung ghi chú cần ít nhất 2 ký tự.")
      .max(2000, "Nội dung ghi chú quá dài."),
    statusAfter: z
      .enum(["new", "contacted", "interested", "follow_up", "not_fit", "won", "lost"])
      .optional(),
    createReminder: z.boolean().default(false),
    reminderTitle: optionalText(160),
    reminderDescription: optionalText(500),
    remindAt: optionalText(80),
  })
  .superRefine((value, context) => {
    if (!value.createReminder) {
      return;
    }

    if (!value.reminderTitle) {
      context.addIssue({
        code: "custom",
        message: "Vui lòng nhập tiêu đề follow-up.",
        path: ["reminderTitle"],
      });
    }

    if (!value.remindAt) {
      context.addIssue({
        code: "custom",
        message: "Vui lòng chọn thời gian nhắc lại.",
        path: ["remindAt"],
      });
    } else if (Number.isNaN(new Date(value.remindAt).getTime())) {
      context.addIssue({
        code: "custom",
        message: "Thời gian nhắc lại chưa hợp lệ.",
        path: ["remindAt"],
      });
    }
  });

export type LeadNoteFormInput = z.infer<typeof leadNoteFormSchema>;

export function parseLeadNoteFormData(formData: FormData) {
  return leadNoteFormSchema.safeParse({
    leadId: formData.get("leadId"),
    interactionType: formData.get("interactionType") || DEFAULT_INTERACTION_TYPE,
    outcome: formData.get("outcome"),
    content: formData.get("content"),
    statusAfter: formData.get("statusAfter") || undefined,
    createReminder: formData.get("createReminder") === "on",
    reminderTitle: formData.get("reminderTitle"),
    reminderDescription: formData.get("reminderDescription"),
    remindAt: formData.get("remindAt"),
  });
}
