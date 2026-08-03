import { z } from "zod";

export const customerLifecycleValues = [
  "registered",
  "activated",
  "trial",
  "paying",
  "at_risk",
  "churned",
  "suspended",
] as const;

export const customerColorTokenValues = [
  "slate",
  "blue",
  "green",
  "yellow",
  "red",
  "purple",
] as const;

export const customerLifecycleLabels: Record<CustomerLifecycle, string> = {
  activated: "Da kich hoat",
  at_risk: "Co nguy co roi bo",
  churned: "Da roi bo",
  paying: "Dang tra phi",
  registered: "Da dang ky",
  suspended: "Bi tam ngung",
  trial: "Dang dung thu",
};

export type CustomerLifecycle = (typeof customerLifecycleValues)[number];
export type CustomerColorToken = (typeof customerColorTokenValues)[number];

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .or(z.literal(""));

export const updateCustomerLifecycleSchema = z.object({
  lifecycle: z.enum(customerLifecycleValues),
  reason: optionalText(500),
});

export const createCustomerNoteSchema = z.object({
  content: z.string().trim().min(1).max(3000),
});

export const createCustomerTagSchema = z.object({
  colorToken: z.enum(customerColorTokenValues).default("slate"),
  description: optionalText(500),
  name: z.string().trim().min(1).max(80),
});

export const assignCustomerTagSchema = z.object({
  tagId: z.string().uuid(),
});

export type UpdateCustomerLifecycleInput = z.infer<
  typeof updateCustomerLifecycleSchema
>;
export type CreateCustomerNoteInput = z.infer<typeof createCustomerNoteSchema>;
export type CreateCustomerTagInput = z.infer<typeof createCustomerTagSchema>;
