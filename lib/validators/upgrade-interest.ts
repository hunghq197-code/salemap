import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const upgradeInterestSchema = z.object({
  expectedPrice: optionalText(100),
  mainFeatureInterest: optionalText(200),
  planKey: z.string().trim().min(1).max(80),
  planName: z.string().trim().min(1).max(120),
  reason: optionalText(1000),
  sourcePage: optionalText(100),
});

export type UpgradeInterestInput = z.infer<typeof upgradeInterestSchema>;
