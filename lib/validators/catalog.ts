import { z } from "zod";

export const productTypeValues = [
  "base_plan",
  "recurring_addon",
  "quota_pack",
  "service_package",
] as const;

export const featureCategoryValues = [
  "map",
  "leads",
  "tasks",
  "cadence",
  "import",
  "analytics",
  "ai",
  "support",
  "account",
] as const;

export const createCatalogProductSchema = z.object({
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  name: z.string().trim().min(1).max(120),
  productType: z.enum(productTypeValues),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});
