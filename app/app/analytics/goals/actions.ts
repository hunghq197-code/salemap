"use server";

import { redirect } from "next/navigation";
import {
  archiveSalesGoal,
  createGoalFromTemplate,
  createSalesGoal,
  pauseSalesGoal,
  pinSalesGoal,
  unpinSalesGoal,
  updateSalesGoal,
} from "@/lib/data/sales-goals";
import {
  createSalesGoalSchema,
  goalTemplateSchema,
  updateSalesGoalSchema,
} from "@/lib/validators/sales-analytics";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function createSalesGoalAction(formData: FormData) {
  const parsed = createSalesGoalSchema.safeParse({
    isPinned: formData.get("isPinned") === "on",
    metricKey: stringValue(formData, "metricKey"),
    name: stringValue(formData, "name"),
    periodEnd: stringValue(formData, "periodEnd"),
    periodStart: stringValue(formData, "periodStart"),
    periodType: stringValue(formData, "periodType"),
    targetValue: stringValue(formData, "targetValue"),
  });

  if (!parsed.success) {
    redirect("/app/analytics/goals/new?toast=invalid_goal");
  }

  await createSalesGoal(parsed.data);
  redirect("/app/analytics/goals?toast=sales_goal_created");
}

export async function updateSalesGoalAction(formData: FormData) {
  const goalId = stringValue(formData, "goalId");

  if (!goalId) {
    redirect("/app/analytics/goals?toast=invalid_goal");
  }

  const parsed = updateSalesGoalSchema.safeParse({
    isPinned: formData.get("isPinned") === "on",
    metricKey: stringValue(formData, "metricKey"),
    name: stringValue(formData, "name"),
    periodEnd: stringValue(formData, "periodEnd"),
    periodStart: stringValue(formData, "periodStart"),
    periodType: stringValue(formData, "periodType"),
    targetValue: stringValue(formData, "targetValue"),
  });

  if (!parsed.success) {
    redirect("/app/analytics/goals?toast=invalid_goal");
  }

  await updateSalesGoal(goalId, parsed.data);
  redirect("/app/analytics/goals?toast=sales_goal_updated");
}

export async function createGoalFromTemplateAction(formData: FormData) {
  const parsed = goalTemplateSchema.safeParse({
    templateKey: stringValue(formData, "templateKey"),
  });

  if (!parsed.success) {
    redirect("/app/analytics/goals?toast=invalid_goal");
  }

  await createGoalFromTemplate(parsed.data.templateKey);
  redirect("/app/analytics/goals?toast=sales_goal_created");
}

export async function pinSalesGoalAction(formData: FormData) {
  const goalId = stringValue(formData, "goalId");
  const pinned = formData.get("pinned") === "true";

  if (!goalId) {
    redirect("/app/analytics/goals?toast=invalid_goal");
  }

  if (pinned) {
    await pinSalesGoal(goalId);
  } else {
    await unpinSalesGoal(goalId);
  }

  redirect("/app/analytics/goals?toast=sales_goal_updated");
}

export async function pauseSalesGoalAction(formData: FormData) {
  const goalId = stringValue(formData, "goalId");

  if (!goalId) {
    redirect("/app/analytics/goals?toast=invalid_goal");
  }

  await pauseSalesGoal(goalId);
  redirect("/app/analytics/goals?toast=sales_goal_updated");
}

export async function archiveSalesGoalAction(formData: FormData) {
  const goalId = stringValue(formData, "goalId");

  if (!goalId) {
    redirect("/app/analytics/goals?toast=invalid_goal");
  }

  await archiveSalesGoal(goalId);
  redirect("/app/analytics/goals?toast=sales_goal_archived");
}
