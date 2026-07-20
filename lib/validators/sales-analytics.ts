import { z } from "zod";
import {
  ANALYTICS_PERIODS,
  GOAL_PERIODS,
  GOAL_TEMPLATES,
  SALES_METRICS,
} from "@/lib/constants/sales-analytics";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional();

export const analyticsPeriodSchema = z.object({
  customFrom: dateStringSchema,
  customTo: dateStringSchema,
  period: z
    .enum(Object.keys(ANALYTICS_PERIODS) as [keyof typeof ANALYTICS_PERIODS, ...Array<keyof typeof ANALYTICS_PERIODS>])
    .default("last_7_days"),
});

const salesGoalBaseSchema = z.object({
  isPinned: z.boolean().optional(),
  metricKey: z.enum(Object.keys(SALES_METRICS) as [keyof typeof SALES_METRICS, ...Array<keyof typeof SALES_METRICS>]),
  name: z.string().trim().min(1).max(100),
  periodEnd: dateStringSchema,
  periodStart: dateStringSchema,
  periodType: z.enum(Object.keys(GOAL_PERIODS) as [keyof typeof GOAL_PERIODS, ...Array<keyof typeof GOAL_PERIODS>]),
  targetValue: z.coerce.number().int().min(1).max(100000),
});

function validateCustomPeriod(
  value: { periodEnd?: string; periodStart?: string; periodType?: string },
  ctx: z.RefinementCtx,
) {
  if (value.periodType !== "custom") {
    return;
  }

  if (!value.periodStart || !value.periodEnd) {
    ctx.addIssue({
      code: "custom",
      message: "Custom period requires start and end dates.",
      path: ["periodStart"],
    });
    return;
  }

  if (value.periodEnd < value.periodStart) {
    ctx.addIssue({
      code: "custom",
      message: "Period end must be after start.",
      path: ["periodEnd"],
    });
  }
}

export const createSalesGoalSchema = salesGoalBaseSchema.superRefine(validateCustomPeriod);

export const updateSalesGoalSchema = salesGoalBaseSchema.partial().extend({
  status: z.enum(["active", "completed", "paused", "archived"]).optional(),
}).superRefine(validateCustomPeriod);

export const goalTemplateSchema = z.object({
  templateKey: z.enum(Object.keys(GOAL_TEMPLATES) as [keyof typeof GOAL_TEMPLATES, ...Array<keyof typeof GOAL_TEMPLATES>]),
});

export type AnalyticsPeriodInput = z.infer<typeof analyticsPeriodSchema>;
export type CreateSalesGoalInput = z.infer<typeof createSalesGoalSchema>;
export type UpdateSalesGoalInput = z.infer<typeof updateSalesGoalSchema>;
