import { z } from "zod";

export const createPaymentRequestSchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional(),
  planKey: z.enum(["pro", "pro_plus"]),
  requestType: z.enum(["new_subscription", "renewal", "plan_change"]).optional(),
  userNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updatePaymentRequestSchema = z.object({
  proofUrl: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(["waiting_confirmation", "cancelled"]).optional(),
  transactionReference: z.string().trim().max(200).optional().or(z.literal("")),
  userNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const adminReviewPaymentRequestSchema = z.object({
  adminNote: z.string().trim().max(1000).optional().or(z.literal("")),
});
