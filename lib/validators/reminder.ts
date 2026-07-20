import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (maxLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength, "Nội dung quá dài.").optional(),
  );

export const reminderFormSchema = z.object({
  leadId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  title: z
    .string()
    .trim()
    .min(2, "Tiêu đề nhắc việc cần ít nhất 2 ký tự.")
    .max(160, "Tiêu đề nhắc việc quá dài."),
  description: optionalText(500),
  remindAt: z
    .string()
    .trim()
    .min(1, "Vui lòng chọn thời gian nhắc việc.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Thời gian nhắc việc chưa hợp lệ.",
    }),
});

export const reminderTabSchema = z
  .enum(["today", "overdue", "upcoming", "done"])
  .default("today");

export type ReminderFormInput = z.infer<typeof reminderFormSchema>;
export type ReminderTab = z.infer<typeof reminderTabSchema>;

export function parseReminderFormData(formData: FormData) {
  return reminderFormSchema.safeParse({
    leadId: formData.get("leadId"),
    title: formData.get("title"),
    description: formData.get("description"),
    remindAt: formData.get("remindAt"),
  });
}
