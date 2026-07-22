import { ACTIVE_TASK_STATUSES, COMPLETED_TASK_STATUSES } from "@/lib/constants/tasks";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { TaskLeadSummary, TaskRecord } from "@/lib/data/tasks";
import type {
  CadenceStep,
  CadenceTemplate,
  LeadCadence,
  LeadCadenceStepProgress,
  TaskCadenceMetadata,
} from "@/lib/types/cadences";
import type {
  ApplyCadenceToLeadInput,
  ApplyCadenceToLeadsInput,
  CreateCadenceTemplateInput,
  LeadCadenceMutationInput,
  UpdateCadenceTemplateInput,
} from "@/lib/validators/cadences";

type SupabaseClient = Awaited<ReturnType<typeof createAuthedSupabaseServerClient>>["supabase"];

type RawCadenceTemplate = {
  active_leads_count?: number | null;
  category?: string | null;
  created_at?: string | null;
  description?: string | null;
  id: string;
  is_active?: boolean | null;
  is_archived?: boolean | null;
  is_system?: boolean | null;
  steps_count?: number | null;
  updated_at?: string | null;
  user_id?: string | null;
  name: string;
};

type RawCadenceStep = {
  cadence_template_id: string;
  day_offset?: number | null;
  id: string;
  is_required?: boolean | null;
  priority?: string | null;
  step_order?: number | null;
  suggested_lead_status?: string | null;
  suggested_message?: string | null;
  suggested_note?: string | null;
  task_type?: string | null;
  title: string;
};

type RawLeadCadence = {
  cadence_template_id: string;
  cancelled_at?: string | null;
  completed_at?: string | null;
  completed_steps?: number | null;
  created_at?: string | null;
  current_step_order?: number | null;
  id: string;
  lead_id: string;
  paused_at?: string | null;
  started_at?: string | null;
  status?: string | null;
  total_steps?: number | null;
  updated_at?: string | null;
  user_id: string;
};

type RawLeadSummary = TaskLeadSummary & {
  address?: string | null;
};

export class CadenceError extends Error {
  code: string;

  constructor(message: string, code = "CADENCE_ERROR") {
    super(message);
    this.code = code;
  }
}

function isMissingCadenceSchema(error?: { code?: string; message?: string } | null) {
  const message = error?.message ?? "";

  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    /cadence_templates|cadence_steps|lead_cadences|cadence_task_links/i.test(message)
  );
}

function toTemplate(row: RawCadenceTemplate): CadenceTemplate {
  return {
    activeLeadsCount: Number(row.active_leads_count ?? 0),
    category: row.category || "general",
    createdAt: row.created_at || new Date().toISOString(),
    description: row.description ?? null,
    id: row.id,
    isActive: row.is_active !== false,
    isArchived: Boolean(row.is_archived),
    isSystem: Boolean(row.is_system),
    name: row.name,
    stepsCount: Number(row.steps_count ?? 0),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    userId: row.user_id ?? null,
  };
}

function toStep(row: RawCadenceStep): CadenceStep {
  return {
    cadenceTemplateId: row.cadence_template_id,
    dayOffset: Number(row.day_offset ?? 0),
    id: row.id,
    isRequired: row.is_required !== false,
    priority: row.priority || "medium",
    stepOrder: Number(row.step_order ?? 1),
    suggestedLeadStatus: row.suggested_lead_status ?? null,
    suggestedMessage: row.suggested_message ?? null,
    suggestedNote: row.suggested_note ?? null,
    taskType: row.task_type || "follow_up",
    title: row.title,
  };
}

function toLeadCadence(row: RawLeadCadence): LeadCadence {
  return {
    cadenceTemplateId: row.cadence_template_id,
    cancelledAt: row.cancelled_at ?? null,
    completedAt: row.completed_at ?? null,
    completedSteps: Number(row.completed_steps ?? 0),
    createdAt: row.created_at || new Date().toISOString(),
    currentStepOrder: Number(row.current_step_order ?? 1),
    id: row.id,
    leadId: row.lead_id,
    pausedAt: row.paused_at ?? null,
    startedAt: row.started_at || row.created_at || new Date().toISOString(),
    status: (row.status || "active") as LeadCadence["status"],
    totalSteps: Number(row.total_steps ?? 0),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    userId: row.user_id,
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

function resolveStartDate(value?: string | null) {
  if (value) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      date.setHours(9, 0, 0, 0);
      return date;
    }
  }

  const now = new Date();

  if (now.getHours() >= 18) {
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
  } else {
    now.setHours(Math.max(now.getHours() + 1, 9), 0, 0, 0);
  }

  return now;
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function buildStepPayload(
  cadenceTemplateId: string,
  step: CreateCadenceTemplateInput["steps"][number],
) {
  return {
    cadence_template_id: cadenceTemplateId,
    day_offset: step.dayOffset,
    is_required: step.isRequired,
    priority: step.priority,
    step_order: step.stepOrder,
    suggested_lead_status: step.suggestedLeadStatus || null,
    suggested_message: step.suggestedMessage || null,
    suggested_note: step.suggestedNote || null,
    task_type: step.taskType,
    title: step.title,
  };
}

async function getOwnLead(
  supabase: SupabaseClient,
  userId: string,
  leadId: string,
) {
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,phone,status,source,category,google_maps_url,created_at")
    .eq("id", leadId)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new CadenceError("Không tìm thấy lead hoặc lead đã bị archive.", "LEAD_NOT_FOUND");
  }

  return data as RawLeadSummary;
}

async function getVisibleTemplateWithSteps(
  supabase: SupabaseClient,
  userId: string,
  templateId: string,
) {
  const { data: template, error } = await supabase
    .from("cadence_templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_archived", false)
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!template) {
    throw new CadenceError("Không tìm thấy quy trình chăm sóc.", "CADENCE_NOT_FOUND");
  }

  const { data: steps, error: stepsError } = await supabase
    .from("cadence_steps")
    .select("*")
    .eq("cadence_template_id", templateId)
    .order("step_order", { ascending: true });

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  const normalizedSteps = ((steps ?? []) as RawCadenceStep[]).map(toStep);

  if (normalizedSteps.length === 0) {
    throw new CadenceError("Quy trình này chưa có bước chăm sóc.", "CADENCE_EMPTY");
  }

  return {
    steps: normalizedSteps,
    template: toTemplate(template as RawCadenceTemplate),
  };
}

export async function getCadenceTemplates(params: {
  includeArchived?: boolean;
  limit?: number;
  q?: string;
} = {}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));

  let query = supabase
    .from("cadence_templates")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!params.includeArchived) {
    query = query.eq("is_archived", false);
  }

  if (params.q?.trim()) {
    const safeQuery = params.q.trim().replace(/[%_,]/g, " ");
    query = query.or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingCadenceSchema(error)) {
      return { items: [], schemaReady: false };
    }

    throw new Error(error.message);
  }

  const templates = ((data ?? []) as RawCadenceTemplate[]).map(toTemplate);
  const templateIds = templates.map((template) => template.id);

  if (templateIds.length === 0) {
    return { items: templates, schemaReady: true };
  }

  const [{ data: steps }, { data: activeLeadCounts }] = await Promise.all([
    supabase
      .from("cadence_steps")
      .select("*")
      .in("cadence_template_id", templateIds)
      .order("step_order", { ascending: true }),
    supabase
      .from("lead_cadences")
      .select("cadence_template_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("cadence_template_id", templateIds),
  ]);

  const stepsByTemplate = new Map<string, CadenceStep[]>();

  ((steps ?? []) as RawCadenceStep[]).forEach((step) => {
    const normalized = toStep(step);
    const current = stepsByTemplate.get(normalized.cadenceTemplateId) ?? [];
    current.push(normalized);
    stepsByTemplate.set(normalized.cadenceTemplateId, current);
  });

  const activeCountByTemplate = new Map<string, number>();

  (activeLeadCounts ?? []).forEach((item) => {
    const templateId = String(item.cadence_template_id || "");

    if (templateId) {
      activeCountByTemplate.set(templateId, (activeCountByTemplate.get(templateId) ?? 0) + 1);
    }
  });

  return {
    items: templates.map((template) => {
      const templateSteps = stepsByTemplate.get(template.id) ?? [];

      return {
        ...template,
        activeLeadsCount: activeCountByTemplate.get(template.id) ?? 0,
        steps: templateSteps,
        stepsCount: templateSteps.length,
      };
    }),
    schemaReady: true,
  };
}

export async function getCadenceTemplateById(templateId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const result = await getVisibleTemplateWithSteps(supabase, userId, templateId);

  return {
    ...result.template,
    steps: result.steps,
    stepsCount: result.steps.length,
  };
}

export async function createCadenceTemplate(input: CreateCadenceTemplateInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("cadence_templates")
    .insert({
      category: input.category,
      description: input.description || null,
      is_active: input.isActive,
      is_archived: false,
      is_system: false,
      name: input.name,
      updated_at: now,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const template = toTemplate(data as RawCadenceTemplate);
  const orderedSteps = [...input.steps].sort((a, b) => a.stepOrder - b.stepOrder);
  const { error: stepsError } = await supabase
    .from("cadence_steps")
    .insert(orderedSteps.map((step) => buildStepPayload(template.id, step)));

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  return getCadenceTemplateById(template.id);
}

export async function updateCadenceTemplate(
  templateId: string,
  input: UpdateCadenceTemplateInput,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const now = new Date().toISOString();
  const { data: template, error: templateError } = await supabase
    .from("cadence_templates")
    .select("*")
    .eq("id", templateId)
    .eq("user_id", userId)
    .eq("is_system", false)
    .maybeSingle();

  if (templateError) {
    throw new Error(templateError.message);
  }

  if (!template) {
    throw new CadenceError("Chỉ có thể sửa quy trình tự tạo.", "CADENCE_NOT_EDITABLE");
  }

  const { count: usedCount, error: usedError } = await supabase
    .from("lead_cadences")
    .select("id", { count: "exact", head: true })
    .eq("cadence_template_id", templateId)
    .eq("user_id", userId);

  if (usedError) {
    throw new Error(usedError.message);
  }

  if ((usedCount ?? 0) > 0) {
    throw new CadenceError(
      "Quy trình đã được áp dụng cho lead. Hãy nhân bản rồi chỉnh bản mới để giữ lịch sử chăm sóc.",
      "CADENCE_TEMPLATE_IN_USE",
    );
  }

  const { error } = await supabase
    .from("cadence_templates")
    .update({
      category: input.category,
      description: input.description || null,
      is_active: input.isActive,
      name: input.name,
      updated_at: now,
    })
    .eq("id", templateId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const { error: deleteStepsError } = await supabase
    .from("cadence_steps")
    .delete()
    .eq("cadence_template_id", templateId);

  if (deleteStepsError) {
    throw new Error(deleteStepsError.message);
  }

  const orderedSteps = [...input.steps].sort((a, b) => a.stepOrder - b.stepOrder);
  const { error: stepsError } = await supabase
    .from("cadence_steps")
    .insert(orderedSteps.map((step) => buildStepPayload(templateId, step)));

  if (stepsError) {
    throw new Error(stepsError.message);
  }

  return getCadenceTemplateById(templateId);
}

export async function archiveCadenceTemplate(templateId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("cadence_templates")
    .update({
      is_active: false,
      is_archived: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId)
    .eq("user_id", userId)
    .eq("is_system", false)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toTemplate(data as RawCadenceTemplate);
}

export async function duplicateCadenceTemplate(templateId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const source = await getVisibleTemplateWithSteps(supabase, userId, templateId);

  return createCadenceTemplate({
    category: source.template.category as CreateCadenceTemplateInput["category"],
    description: source.template.description || undefined,
    isActive: true,
    name: `${source.template.name} - bản sao`,
    steps: source.steps.map((step) => ({
      dayOffset: step.dayOffset,
      isRequired: step.isRequired,
      priority: step.priority as CreateCadenceTemplateInput["steps"][number]["priority"],
      stepOrder: step.stepOrder,
      suggestedLeadStatus:
        step.suggestedLeadStatus as CreateCadenceTemplateInput["steps"][number]["suggestedLeadStatus"],
      suggestedMessage: step.suggestedMessage || undefined,
      suggestedNote: step.suggestedNote || undefined,
      taskType: step.taskType as CreateCadenceTemplateInput["steps"][number]["taskType"],
      title: step.title,
    })),
  });
}

async function cancelActiveCadenceForLead(
  supabase: SupabaseClient,
  userId: string,
  leadId: string,
  cancelPendingTasks: boolean,
) {
  const { data: activeCadence } = await supabase
    .from("lead_cadences")
    .select("id")
    .eq("user_id", userId)
    .eq("lead_id", leadId)
    .in("status", ["active", "paused"])
    .maybeSingle();

  if (!activeCadence?.id) {
    return;
  }

  await mutateLeadCadenceStatus(
    supabase,
    userId,
    String(activeCadence.id),
    "cancelled",
    { cancelPendingTasks },
  );
}

async function syncLeadNextFollowUpFromReminders(
  supabase: SupabaseClient,
  userId: string,
  leadId: string,
) {
  const { data, error } = await supabase
    .from("reminders")
    .select("remind_at")
    .eq("lead_id", leadId)
    .eq("user_id", userId)
    .in("status", [...ACTIVE_TASK_STATUSES])
    .is("deleted_at", null)
    .order("remind_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      next_follow_up_at: data?.[0]?.remind_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function insertCadenceEvent(
  supabase: SupabaseClient,
  input: {
    eventType: string;
    leadId?: string | null;
    metadata?: Record<string, unknown>;
    reminderId?: string | null;
    userId: string;
  },
) {
  try {
    await supabase.from("task_events").insert({
      event_type: input.eventType,
      lead_id: input.leadId || null,
      metadata: input.metadata || null,
      reminder_id: input.reminderId || null,
      user_id: input.userId,
    });
  } catch {
    // Task events are optional audit data and should not block cadence actions.
  }
}

export async function applyCadenceToLead(input: ApplyCadenceToLeadInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const lead = await getOwnLead(supabase, userId, input.leadId);
  const { steps, template } = await getVisibleTemplateWithSteps(
    supabase,
    userId,
    input.cadenceTemplateId,
  );

  if (!template.isActive) {
    throw new CadenceError("Quy trình này đang tắt, chưa thể áp dụng cho lead.", "CADENCE_INACTIVE");
  }

  const { data: existingActive, error: existingError } = await supabase
    .from("lead_cadences")
    .select("id")
    .eq("user_id", userId)
    .eq("lead_id", lead.id)
    .in("status", ["active", "paused"])
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingActive && !input.replaceExistingActive) {
    throw new CadenceError(
      "Lead này đang có quy trình chăm sóc. Chọn thay thế nếu muốn áp dụng quy trình mới.",
      "ACTIVE_CADENCE_EXISTS",
    );
  }

  if (existingActive && input.replaceExistingActive) {
    await cancelActiveCadenceForLead(supabase, userId, lead.id, true);
  }

  const startDate = resolveStartDate(input.startDate);
  const now = new Date().toISOString();
  const { data: leadCadence, error: cadenceError } = await supabase
    .from("lead_cadences")
    .insert({
      cadence_template_id: template.id,
      completed_steps: 0,
      current_step_order: 1,
      lead_id: lead.id,
      started_at: startDate.toISOString(),
      status: "active",
      total_steps: steps.length,
      updated_at: now,
      user_id: userId,
    })
    .select("*")
    .single();

  if (cadenceError) {
    throw new Error(cadenceError.message);
  }

  const normalizedLeadCadence = toLeadCadence(leadCadence as RawLeadCadence);
  const reminderPayloads = steps.map((step) => ({
    description: step.suggestedNote || step.suggestedMessage || null,
    lead_id: lead.id,
    priority: step.priority || "medium",
    remind_at: addDays(startDate, step.dayOffset).toISOString(),
    status: "pending",
    task_type: step.taskType || "follow_up",
    title: step.title,
    user_id: userId,
  }));

  const { data: reminders, error: remindersError } = await supabase
    .from("reminders")
    .insert(reminderPayloads)
    .select("id");

  if (remindersError) {
    throw new Error(remindersError.message);
  }

  const reminderRows = (reminders ?? []) as Array<{ id: string }>;
  const { error: linksError } = await supabase.from("cadence_task_links").insert(
    steps.map((step, index) => ({
      cadence_step_id: step.id,
      lead_cadence_id: normalizedLeadCadence.id,
      reminder_id: reminderRows[index]?.id,
      step_order: step.stepOrder,
      user_id: userId,
    })),
  );

  if (linksError) {
    throw new Error(linksError.message);
  }

  await syncLeadNextFollowUpFromReminders(supabase, userId, lead.id);
  await insertCadenceEvent(supabase, {
    eventType: "cadence_applied",
    leadId: lead.id,
    metadata: {
      cadenceTemplateId: template.id,
      cadenceTemplateName: template.name,
      createdTasksCount: steps.length,
    },
    userId,
  });

  return {
    createdTasksCount: steps.length,
    lead,
    leadCadence: {
      ...normalizedLeadCadence,
      lead,
      steps: steps.map((step, index) => ({
        ...step,
        completedAt: null,
        reminderId: reminderRows[index]?.id ?? null,
        reminderStatus: "pending",
      })),
      template,
    },
    template,
  };
}

export async function applyCadenceToLeads(input: ApplyCadenceToLeadsInput) {
  const results = [];
  const errors: Array<{ leadId: string; message: string }> = [];

  for (const leadId of input.leadIds) {
    try {
      const result = await applyCadenceToLead({
        cadenceTemplateId: input.cadenceTemplateId,
        leadId,
        replaceExistingActive: input.replaceExistingActive,
        startDate: input.startDate,
      });
      results.push(result);
    } catch (error) {
      errors.push({
        leadId,
        message: error instanceof Error ? error.message : "Không thể áp dụng quy trình.",
      });
    }
  }

  return {
    appliedCount: results.length,
    errors,
    results,
  };
}

async function getLeadCadenceById(
  supabase: SupabaseClient,
  userId: string,
  leadCadenceId: string,
) {
  const { data, error } = await supabase
    .from("lead_cadences")
    .select("*")
    .eq("id", leadCadenceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new CadenceError("Không tìm thấy quy trình trên lead.", "LEAD_CADENCE_NOT_FOUND");
  }

  return toLeadCadence(data as RawLeadCadence);
}

async function mutateLeadCadenceStatus(
  supabase: SupabaseClient,
  userId: string,
  leadCadenceId: string,
  status: LeadCadence["status"],
  input: Partial<LeadCadenceMutationInput> = {},
) {
  const cadence = await getLeadCadenceById(supabase, userId, leadCadenceId);
  const now = new Date().toISOString();
  const patch: Record<string, string | null> = {
    cancelled_at: cadence.cancelledAt ?? null,
    completed_at: cadence.completedAt ?? null,
    paused_at: cadence.pausedAt ?? null,
    status,
    updated_at: now,
  };

  if (status === "paused") {
    patch.paused_at = now;
  } else if (status === "active") {
    patch.paused_at = null;
  } else if (status === "cancelled") {
    patch.cancelled_at = now;
  } else if (status === "completed") {
    patch.completed_at = now;
  }

  const { data, error } = await supabase
    .from("lead_cadences")
    .update(patch)
    .eq("id", leadCadenceId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if ((status === "cancelled" || status === "completed") && input.cancelPendingTasks !== false) {
    const { data: links } = await supabase
      .from("cadence_task_links")
      .select("reminder_id")
      .eq("lead_cadence_id", leadCadenceId)
      .eq("user_id", userId);
    const reminderIds = (links ?? [])
      .map((link) => String(link.reminder_id || ""))
      .filter(Boolean);

    if (reminderIds.length > 0) {
      await supabase
        .from("reminders")
        .update({
          cancelled_at: status === "cancelled" ? now : null,
          completed_at: status === "completed" ? now : null,
          status: status === "completed" ? "completed" : "cancelled",
          updated_at: now,
        })
        .eq("user_id", userId)
        .in("id", reminderIds)
        .in("status", [...ACTIVE_TASK_STATUSES]);
    }
  }

  await syncLeadNextFollowUpFromReminders(supabase, userId, cadence.leadId);
  await insertCadenceEvent(supabase, {
    eventType: `cadence_${status}`,
    leadId: cadence.leadId,
    metadata: {
      leadCadenceId,
    },
    userId,
  });

  return toLeadCadence(data as RawLeadCadence);
}

export async function pauseLeadCadence(
  leadCadenceId: string,
  input: LeadCadenceMutationInput,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  return mutateLeadCadenceStatus(supabase, userId, leadCadenceId, "paused", input);
}

export async function resumeLeadCadence(
  leadCadenceId: string,
  input: LeadCadenceMutationInput,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  return mutateLeadCadenceStatus(supabase, userId, leadCadenceId, "active", input);
}

export async function cancelLeadCadence(
  leadCadenceId: string,
  input: LeadCadenceMutationInput,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  return mutateLeadCadenceStatus(supabase, userId, leadCadenceId, "cancelled", input);
}

export async function completeLeadCadence(
  leadCadenceId: string,
  input: LeadCadenceMutationInput,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  return mutateLeadCadenceStatus(supabase, userId, leadCadenceId, "completed", input);
}

export async function getLeadActiveCadence(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_cadences")
    .select("*,cadence_templates(*)")
    .eq("user_id", userId)
    .eq("lead_id", leadId)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingCadenceSchema(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as RawLeadCadence & {
    cadence_templates?: RawCadenceTemplate | RawCadenceTemplate[] | null;
  };
  const leadCadence = toLeadCadence(row);
  const template = normalizeRelation(row.cadence_templates);
  const { data: links, error: linksError } = await supabase
    .from("cadence_task_links")
    .select("reminder_id,step_order,cadence_steps(*),reminders(id,status,completed_at,remind_at)")
    .eq("user_id", userId)
    .eq("lead_cadence_id", leadCadence.id)
    .order("step_order", { ascending: true });

  if (linksError) {
    throw new Error(linksError.message);
  }

  const steps = ((links ?? []) as Array<{
    cadence_steps?: RawCadenceStep | RawCadenceStep[] | null;
    reminders?: { completed_at?: string | null; id?: string; status?: string | null } | Array<{
      completed_at?: string | null;
      id?: string;
      status?: string | null;
    }> | null;
    reminder_id?: string | null;
  }>).reduce<LeadCadenceStepProgress[]>((items, link) => {
      const step = normalizeRelation(link.cadence_steps);
      const reminder = normalizeRelation(link.reminders);

      if (!step) {
        return items;
      }

      items.push({
        ...toStep(step),
        completedAt: reminder?.completed_at ?? null,
        reminderId: reminder?.id ?? link.reminder_id ?? null,
        reminderStatus: reminder?.status ?? null,
      });

      return items;
    }, []);

  return {
    ...leadCadence,
    steps,
    template: template ? toTemplate(template) : undefined,
  };
}

export async function syncCadenceProgressFromTasks(
  supabase: SupabaseClient,
  userId: string,
  leadCadenceId: string,
) {
  const [{ data: links, error }, { data: currentCadence, error: cadenceError }] =
    await Promise.all([
      supabase
        .from("cadence_task_links")
        .select("step_order,reminders(status,completed_at)")
        .eq("lead_cadence_id", leadCadenceId)
        .eq("user_id", userId),
      supabase
        .from("lead_cadences")
        .select("status")
        .eq("id", leadCadenceId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (error) {
    if (isMissingCadenceSchema(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (cadenceError) {
    if (isMissingCadenceSchema(cadenceError)) {
      return null;
    }

    throw new Error(cadenceError.message);
  }

  const rows = (links ?? []) as Array<{
    reminders?: { completed_at?: string | null; status?: string | null } | Array<{
      completed_at?: string | null;
      status?: string | null;
    }> | null;
    step_order?: number | null;
  }>;
  const completedStepOrders = rows
    .filter((row) => {
      const reminder = normalizeRelation(row.reminders);
      return COMPLETED_TASK_STATUSES.includes(
        (reminder?.status || "") as (typeof COMPLETED_TASK_STATUSES)[number],
      );
    })
    .map((row) => Number(row.step_order ?? 0))
    .filter(Boolean);
  const completedSteps = completedStepOrders.length;
  const totalSteps = rows.length;
  const currentStepOrder =
    completedSteps >= totalSteps
      ? Math.max(totalSteps, 1)
      : Math.min(
          ...rows
            .map((row) => Number(row.step_order ?? 0))
            .filter((stepOrder) => stepOrder && !completedStepOrders.includes(stepOrder)),
        );
  const now = new Date().toISOString();
  const currentStatus = String(currentCadence?.status || "active");
  const nextStatus =
    totalSteps > 0 && completedSteps >= totalSteps
      ? "completed"
      : currentStatus === "paused"
        ? "paused"
        : "active";
  const { data, error: updateError } = await supabase
    .from("lead_cadences")
    .update({
      completed_at: nextStatus === "completed" ? now : null,
      completed_steps: completedSteps,
      current_step_order: currentStepOrder || 1,
      status: nextStatus,
      total_steps: totalSteps,
      updated_at: now,
    })
    .eq("id", leadCadenceId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return data ? toLeadCadence(data as RawLeadCadence) : null;
}

export async function syncCadenceProgressForTask(taskId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("cadence_task_links")
    .select("lead_cadence_id")
    .eq("user_id", userId)
    .eq("reminder_id", taskId)
    .maybeSingle();

  if (error) {
    if (isMissingCadenceSchema(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data?.lead_cadence_id) {
    return null;
  }

  return syncCadenceProgressFromTasks(supabase, userId, String(data.lead_cadence_id));
}

export async function attachCadenceMetadataToTasks(tasks: TaskRecord[]) {
  if (tasks.length === 0) {
    return tasks;
  }

  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const taskIds = tasks.map((task) => task.id);
  const { data, error } = await supabase
    .from("cadence_task_links")
    .select("reminder_id,step_order,lead_cadence_id,cadence_steps(suggested_message,suggested_note,suggested_lead_status),lead_cadences(status,total_steps,cadence_templates(name))")
    .eq("user_id", userId)
    .in("reminder_id", taskIds);

  if (error) {
    if (isMissingCadenceSchema(error)) {
      return tasks;
    }

    throw new Error(error.message);
  }

  const metadataByTask = new Map<string, TaskCadenceMetadata>();

  (data ?? []).forEach((row) => {
    const item = row as {
      cadence_steps?: {
        suggested_lead_status?: string | null;
        suggested_message?: string | null;
        suggested_note?: string | null;
      } | Array<{
        suggested_lead_status?: string | null;
        suggested_message?: string | null;
        suggested_note?: string | null;
      }> | null;
      lead_cadence_id?: string | null;
      lead_cadences?: {
        cadence_templates?: { name?: string | null } | Array<{ name?: string | null }> | null;
        status?: string | null;
        total_steps?: number | null;
      } | Array<{
        cadence_templates?: { name?: string | null } | Array<{ name?: string | null }> | null;
        status?: string | null;
        total_steps?: number | null;
      }> | null;
      reminder_id?: string | null;
      step_order?: number | null;
    };
    const step = normalizeRelation(item.cadence_steps);
    const leadCadence = normalizeRelation(item.lead_cadences);
    const template = normalizeRelation(leadCadence?.cadence_templates);
    const reminderId = item.reminder_id ? String(item.reminder_id) : "";

    if (!reminderId) {
      return;
    }

    metadataByTask.set(reminderId, {
      leadCadenceId: String(item.lead_cadence_id || ""),
      status: leadCadence?.status || "active",
      stepOrder: Number(item.step_order ?? 1),
      suggestedLeadStatus: step?.suggested_lead_status ?? null,
      suggestedMessage: step?.suggested_message ?? null,
      suggestedNote: step?.suggested_note ?? null,
      templateName: template?.name || "Quy trình chăm sóc",
      totalSteps: Number(leadCadence?.total_steps ?? 0),
    });
  });

  return tasks.map((task) => ({
    ...task,
    cadence: metadataByTask.get(task.id) ?? null,
  }));
}

export async function getCadenceDashboardSummary() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [activeResult, pausedResult, completedResult, recentResult] = await Promise.all([
    supabase
      .from("lead_cadences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("lead_cadences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "paused"),
    supabase
      .from("lead_cadences")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", monthStart.toISOString()),
    supabase
      .from("lead_cadences")
      .select("id,status,completed_steps,total_steps,cadence_templates(name,category)")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const results = [activeResult, pausedResult, completedResult, recentResult];
  const schemaError = results.find((result) => result.error && isMissingCadenceSchema(result.error));

  if (schemaError) {
    return {
      activeCount: 0,
      completedThisMonth: 0,
      pausedCount: 0,
      recent: [],
      schemaReady: false,
    };
  }

  const otherError = results.find((result) => result.error);

  if (otherError?.error) {
    throw new Error(otherError.error.message);
  }

  return {
    activeCount: activeResult.count ?? 0,
    completedThisMonth: completedResult.count ?? 0,
    pausedCount: pausedResult.count ?? 0,
    recent: ((recentResult.data ?? []) as Array<{
      cadence_templates?: { category?: string | null; name?: string | null } | Array<{
        category?: string | null;
        name?: string | null;
      }> | null;
      completed_steps?: number | null;
      id: string;
      status?: string | null;
      total_steps?: number | null;
    }>).map((item) => {
      const template = normalizeRelation(item.cadence_templates);

      return {
        completedSteps: Number(item.completed_steps ?? 0),
        id: item.id,
        status: item.status || "active",
        templateCategory: template?.category || "general",
        templateName: template?.name || "Quy trình chăm sóc",
        totalSteps: Number(item.total_steps ?? 0),
      };
    }),
    schemaReady: true,
  };
}
