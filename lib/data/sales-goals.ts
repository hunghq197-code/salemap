import { revalidatePath } from "next/cache";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { createNotification } from "@/lib/data/notifications";
import {
  calculateGoalProgressForRecord,
  type GoalProgress,
  type GoalProgressInput,
} from "@/lib/analytics/sales-analytics";
import {
  GOAL_TEMPLATES,
  type GoalTemplateKey,
  type SalesGoalStatus,
} from "@/lib/constants/sales-analytics";
import type { QueryLike } from "@/lib/leads/lead-filters";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";
import type {
  CreateSalesGoalInput,
  UpdateSalesGoalInput,
} from "@/lib/validators/sales-analytics";

export type SalesGoalRecord = {
  completed_at: string | null;
  created_at: string | null;
  goal_key: string;
  id: string;
  is_pinned: boolean | null;
  metric_key: string;
  name: string;
  period_end: string | null;
  period_start: string | null;
  period_type: string;
  status: SalesGoalStatus;
  target_value: number;
  updated_at: string | null;
  user_id: string;
};

export type SalesGoalWithProgress = SalesGoalRecord & {
  progress: GoalProgress;
};

function isMissingSchemaError(error: { code?: string; message?: string } | null | undefined) {
  return isMissingSupabaseSchema(error, ["sales_goals", "sales_goal_events"]);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const next = new Date(date.getTime());
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - (day === 0 ? 6 : day - 1));
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function periodDates(periodType: string, input?: { periodEnd?: string; periodStart?: string }) {
  const today = startOfDay(new Date());

  if (periodType === "custom") {
    return {
      end: input?.periodEnd ?? null,
      start: input?.periodStart ?? null,
    };
  }

  if (periodType === "daily") {
    const date = toDateOnly(today);
    return { end: date, start: date };
  }

  if (periodType === "monthly") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { end: toDateOnly(end), start: toDateOnly(start) };
  }

  const start = startOfWeek(today);
  return { end: toDateOnly(addDays(start, 6)), start: toDateOnly(start) };
}

function goalKeyFor(input: Pick<CreateSalesGoalInput, "metricKey" | "periodType">) {
  return `${input.periodType}_${input.metricKey}`;
}

async function insertGoalEvent(
  userId: string,
  goalId: string | null,
  eventType: string,
  values?: {
    metricKey?: string | null;
    newValue?: number | null;
    previousValue?: number | null;
  },
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("sales_goal_events").insert({
      event_type: eventType,
      goal_id: goalId,
      metric_key: values?.metricKey ?? null,
      new_value: values?.newValue ?? null,
      previous_value: values?.previousValue ?? null,
      user_id: userId,
    });

    if (error && !isMissingSchemaError(error)) {
      throw new Error(error.message);
    }
  } catch {
    // Goal event logging should not break the user workflow.
  }
}

async function markCompletedIfNeeded(
  userId: string,
  goal: SalesGoalRecord,
  progress: GoalProgress,
) {
  if (goal.status !== "active" || progress.status !== "completed") {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("sales_goals")
    .update({
      completed_at: now,
      status: "completed",
      updated_at: now,
    })
    .eq("id", goal.id)
    .eq("user_id", userId)
    .eq("status", "active");

  if (!error) {
    await insertGoalEvent(userId, goal.id, "goal_completed", {
      metricKey: goal.metric_key,
      newValue: progress.currentValue,
    });
    await createNotification({
      actionUrl: "/app/analytics/goals",
      content: `Ban da dat muc tieu ${goal.name}.`,
      metadata: { goalId: goal.id, metricKey: goal.metric_key },
      title: "Ban da hoan thanh muc tieu",
      type: "sales_goal_completed",
      userId,
    });
  }
}

async function withProgress(userId: string, goal: SalesGoalRecord): Promise<SalesGoalWithProgress> {
  const progress = await calculateGoalProgressForRecord(userId, goal as GoalProgressInput);
  await markCompletedIfNeeded(userId, goal, progress);

  return {
    ...goal,
    status: progress.status as SalesGoalStatus,
    progress,
  };
}

export async function getSalesGoals(params: {
  includeArchived?: boolean;
  pinnedOnly?: boolean;
  status?: string;
} = {}) {
  const { userId } = await createAuthedSupabaseServerClient();
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("sales_goals")
    .select("*")
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false }) as unknown as QueryLike<SalesGoalRecord[]>;

  if (params.pinnedOnly) {
    query = query.eq("is_pinned", true);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  } else if (!params.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingSchemaError(error)) {
      return { items: [] as SalesGoalWithProgress[], schemaReady: false };
    }

    throw new Error(error.message);
  }

  const items = await Promise.all(
    ((data ?? []) as SalesGoalRecord[]).map((goal) => withProgress(userId, goal)),
  );

  return { items, schemaReady: true };
}

export async function getActiveSalesGoals() {
  return getSalesGoals();
}

export async function getPinnedSalesGoals() {
  return getSalesGoals({ pinnedOnly: true });
}

export async function getSalesGoalById(goalId: string) {
  const { userId } = await createAuthedSupabaseServerClient();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sales_goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data ? withProgress(userId, data as SalesGoalRecord) : null;
}

export async function createSalesGoal(input: CreateSalesGoalInput) {
  const { userId } = await createAuthedSupabaseServerClient();
  const supabase = createSupabaseAdminClient();
  const period = periodDates(input.periodType, input);
  const { data, error } = await supabase
    .from("sales_goals")
    .insert({
      goal_key: goalKeyFor(input),
      is_pinned: input.isPinned ?? false,
      metric_key: input.metricKey,
      name: input.name,
      period_end: period.end,
      period_start: period.start,
      period_type: input.periodType,
      status: "active",
      target_value: input.targetValue,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await insertGoalEvent(userId, String(data.id), "goal_created", {
    metricKey: input.metricKey,
    newValue: input.targetValue,
  });
  revalidatePath("/app/analytics");
  revalidatePath("/app/analytics/goals");
  revalidatePath("/app/dashboard");

  return withProgress(userId, data as SalesGoalRecord);
}

export async function updateSalesGoal(goalId: string, input: UpdateSalesGoalInput) {
  const current = await getSalesGoalById(goalId);

  if (!current) {
    throw new Error("Khong tim thay muc tieu.");
  }

  const { userId } = await createAuthedSupabaseServerClient();
  const supabase = createSupabaseAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) payload.name = input.name;
  if (input.metricKey !== undefined) payload.metric_key = input.metricKey;
  if (input.targetValue !== undefined) payload.target_value = input.targetValue;
  if (input.periodType !== undefined) {
    payload.period_type = input.periodType;
    const period = periodDates(input.periodType, input);
    payload.period_start = period.start;
    payload.period_end = period.end;
  }
  if (input.isPinned !== undefined) payload.is_pinned = input.isPinned;
  if (input.status !== undefined) {
    payload.status = input.status;
    if (input.status !== "completed") {
      payload.completed_at = null;
    }
  }

  const { data, error } = await supabase
    .from("sales_goals")
    .update(payload)
    .eq("id", goalId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await insertGoalEvent(userId, goalId, "goal_updated", {
    metricKey: String(payload.metric_key ?? current.metric_key),
    newValue: Number(payload.target_value ?? current.target_value),
    previousValue: current.target_value,
  });
  revalidatePath("/app/analytics");
  revalidatePath("/app/analytics/goals");
  revalidatePath("/app/dashboard");

  return withProgress(userId, data as SalesGoalRecord);
}

export async function pauseSalesGoal(goalId: string) {
  const goal = await updateSalesGoal(goalId, { status: "paused" });
  await insertGoalEvent(goal.user_id, goalId, "goal_paused", { metricKey: goal.metric_key });
  return goal;
}

export async function archiveSalesGoal(goalId: string) {
  const goal = await updateSalesGoal(goalId, { status: "archived", isPinned: false });
  await insertGoalEvent(goal.user_id, goalId, "goal_archived", { metricKey: goal.metric_key });
  return goal;
}

export async function pinSalesGoal(goalId: string) {
  const goal = await updateSalesGoal(goalId, { isPinned: true });
  await insertGoalEvent(goal.user_id, goalId, "goal_pinned", { metricKey: goal.metric_key });
  return goal;
}

export async function unpinSalesGoal(goalId: string) {
  const goal = await updateSalesGoal(goalId, { isPinned: false });
  await insertGoalEvent(goal.user_id, goalId, "goal_unpinned", { metricKey: goal.metric_key });
  return goal;
}

export async function calculateGoalProgress(goal: SalesGoalRecord) {
  return calculateGoalProgressForRecord(goal.user_id, goal as GoalProgressInput);
}

export async function createGoalFromTemplate(templateKey: GoalTemplateKey) {
  const template = GOAL_TEMPLATES[templateKey];

  return createSalesGoal({
    isPinned: true,
    metricKey: template.metricKey,
    name: template.name,
    periodType: template.periodType,
    targetValue: template.targetValue,
  });
}

export function getGoalTemplates() {
  return Object.entries(GOAL_TEMPLATES).map(([key, template]) => ({
    key,
    ...template,
  }));
}
