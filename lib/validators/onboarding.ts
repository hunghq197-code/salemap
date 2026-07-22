import { z } from "zod";
import {
  ACTIVATION_STEP_VALUES,
  ONBOARDING_DIFFICULTY_VALUES,
  ONBOARDING_INDUSTRY_VALUES,
  ONBOARDING_PRIMARY_GOAL_VALUES,
  ONBOARDING_ROLE_VALUES,
  ONBOARDING_SALES_MODEL_VALUES,
} from "@/lib/constants/onboarding";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (maxLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength, "Nội dung quá dài.").optional(),
  );

export const onboardingProfileInputSchema = z.object({
  industry: z.enum(ONBOARDING_INDUSTRY_VALUES),
  mainRegion: z.string().trim().min(2).max(180),
  primaryCity: optionalText(100),
  primaryDistrict: optionalText(120),
  primaryGoal: z.enum(ONBOARDING_PRIMARY_GOAL_VALUES),
  role: z.enum(ONBOARDING_ROLE_VALUES),
  salesModel: z.enum(ONBOARDING_SALES_MODEL_VALUES),
});

export const activationMarkInputSchema = z.object({
  step: z.enum(ACTIVATION_STEP_VALUES),
});

export const onboardingFeedbackInputSchema = z.object({
  difficulty: z.enum(ONBOARDING_DIFFICULTY_VALUES),
  message: optionalText(500),
  rating: z.number().int().min(1).max(5),
});

export type ActivationMarkInput = z.infer<typeof activationMarkInputSchema>;
export type OnboardingFeedbackInput = z.infer<typeof onboardingFeedbackInputSchema>;
export type OnboardingProfileInput = z.infer<typeof onboardingProfileInputSchema>;
