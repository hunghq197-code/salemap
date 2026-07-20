import { z } from "zod";
import { CANCELLATION_REASON_OPTIONS } from "@/lib/constants/subscription-lifecycle";

const cancellationReasonValues = CANCELLATION_REASON_OPTIONS.map(
  (option) => option.value,
) as [string, ...string[]];

export const cancellationRequestSchema = z.object({
  reasonDetail: z.string().trim().max(1000).optional().or(z.literal("")),
  reasonType: z.enum(cancellationReasonValues),
  wouldReturnIf: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const adminCancellationReviewSchema = z.object({
  adminNote: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["new", "reviewing", "resolved", "cancelled", "retained", "closed"]),
});
