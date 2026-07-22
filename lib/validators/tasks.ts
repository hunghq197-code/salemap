import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (maxLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength, "Nội dung quá dài.").optional(),
  );

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
const taskPrioritySchema = z.enum(["low", "medium", "high"]);
const taskOutcomeSchema = z.enum([
  "call_success",
  "no_answer",
  "zalo_sent",
  "quote_sent",
  "interested",
  "callback",
  "not_fit",
  "won",
  "other",
]);
const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "interested",
  "follow_up",
  "not_fit",
  "won",
  "lost",
]);

const dueAtSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng chọn ngày giờ cần làm.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Ngày giờ chưa hợp lệ.",
  });

export const taskTabSchema = z
  .enum(["today", "overdue", "upcoming", "no_schedule", "completed"])
  .default("today");

export const createTaskSchema = z.object({
  dueAt: dueAtSchema,
  leadId: z.string().uuid("Lead không hợp lệ."),
  note: optionalText(2000),
  priority: taskPrioritySchema.default("medium"),
  taskType: taskTypeSchema.default("follow_up"),
  title: optionalText(120),
});

const nextTaskSchema = z.object({
  dueAt: dueAtSchema,
  priority: taskPrioritySchema.default("medium"),
  taskType: taskTypeSchema.default("follow_up"),
  title: optionalText(120),
});

export const completeTaskSchema = z.object({
  createNextTask: nextTaskSchema.optional(),
  nextStatus: leadStatusSchema.optional(),
  note: optionalText(5000),
  outcome: taskOutcomeSchema.optional(),
  taskId: z.string().uuid("Task không hợp lệ."),
});

export const snoozeTaskSchema = z.object({
  newDueAt: dueAtSchema,
  reason: optionalText(500),
  taskId: z.string().uuid("Task không hợp lệ."),
});

export const cancelTaskSchema = z.object({
  reason: optionalText(500),
  taskId: z.string().uuid("Task không hợp lệ."),
});

export const getTasksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
  page: z.coerce.number().int().min(1).default(1),
  priority: taskPrioritySchema.optional(),
  status: z.string().trim().max(40).optional(),
  tab: taskTabSchema,
  taskType: taskTypeSchema.optional(),
});

export type CancelTaskInput = z.infer<typeof cancelTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type GetTasksQueryInput = z.infer<typeof getTasksQuerySchema>;
export type SnoozeTaskInput = z.infer<typeof snoozeTaskSchema>;
export type TaskTabInput = z.infer<typeof taskTabSchema>;
