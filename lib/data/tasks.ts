import { ACTIVE_LEAD_STATUSES_FOR_TASKS, ACTIVE_TASK_STATUSES, COMPLETED_TASK_STATUSES, getTaskTypeOption } from "@/lib/constants/tasks";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { trackUserActivity } from "@/lib/data/activity-tracking";
import {
  attachCadenceMetadataToTasks,
  syncCadenceProgressForTask,
} from "@/lib/data/cadences";
import { safeMarkActivationStepForUser } from "@/lib/data/onboarding";
import type { QueryLike } from "@/lib/leads/lead-filters";
import type { TaskCadenceMetadata } from "@/lib/types/cadences";
import type {
  CancelTaskInput,
  CompleteTaskInput,
  CreateTaskInput,
  GetTasksQueryInput,
  SnoozeTaskInput,
} from "@/lib/validators/tasks";

export type TaskLeadSummary = {
  category?: string | null;
  created_at?: string | null;
  google_maps_url?: string | null;
  id: string;
  name: string;
  phone?: string | null;
  source?: string | null;
  status?: string | null;
};

export type TaskRecord = {
  cadence?: TaskCadenceMetadata | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  completed_note_id?: string | null;
  created_at?: string | null;
  description?: string | null;
  id: string;
  last_note_summary?: string | null;
  lead_id: string | null;
  leads?: TaskLeadSummary | TaskLeadSummary[] | null;
  priority?: string | null;
  remind_at: string;
  snooze_count?: number | null;
  snoozed_from?: string | null;
  status?: string | null;
  task_type?: string | null;
  title: string;
};

export type LeadWithoutTask = TaskLeadSummary & {
  address?: string | null;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
};

export type TaskCounts = {
  completedToday: number;
  leadsWithoutTasks: number;
  overdue: number;
  today: number;
  upcoming: number;
};

type SupabaseClient = Awaited<ReturnType<typeof createAuthedSupabaseServerClient>>["supabase"];

const TASK_SELECT =
  "id,lead_id,title,description,remind_at,status,completed_at,created_at,task_type,priority,completed_note_id,snoozed_from,snooze_count,cancelled_at,leads(id,name,phone,status,source,category,google_maps_url,created_at)";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfTomorrow() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

function toIsoDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Ngày giờ task chưa hợp lệ.");
  }

  return date.toISOString();
}

function normalizeTaskLead(lead?: TaskLeadSummary | TaskLeadSummary[] | null) {
  return Array.isArray(lead) ? lead[0] : lead;
}

function normalizeTask(raw: TaskRecord): TaskRecord {
  return {
    ...raw,
    leads: normalizeTaskLead(raw.leads),
    priority: raw.priority || "medium",
    status: raw.status === "done" ? "completed" : raw.status || "pending",
    task_type: raw.task_type || "follow_up",
  };
}

function getDefaultTaskTitle(taskType: string, leadName?: string | null) {
  const action = getTaskTypeOption(taskType).label;
  return leadName ? `${action} ${leadName}` : action;
}

function isContactTask(taskType?: string | null) {
  return ["call", "zalo_message", "email", "meeting", "follow_up"].includes(
    taskType || "",
  );
}

async function getOwnActiveLead(
  supabase: SupabaseClient,
  userId: string,
  leadId: string,
) {
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,status,is_archived,deleted_at")
    .eq("id", leadId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .eq("is_archived", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Lead này không còn hoạt động.");
  }

  return data as {
    id: string;
    is_archived?: boolean | null;
    name: string;
    status?: string | null;
  };
}

async function getOwnTask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
) {
  const { data, error } = await supabase
    .from("reminders")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Task đã bị xóa hoặc không thuộc user hiện tại.");
  }

  return normalizeTask(data as unknown as TaskRecord);
}

async function insertTaskEvent(
  supabase: SupabaseClient,
  input: {
    eventType: string;
    fromStatus?: string | null;
    leadId?: string | null;
    metadata?: Record<string, unknown>;
    reminderId?: string | null;
    toStatus?: string | null;
    userId: string;
  },
) {
  try {
    await supabase.from("task_events").insert({
      event_type: input.eventType,
      from_status: input.fromStatus || null,
      lead_id: input.leadId || null,
      metadata: input.metadata || null,
      reminder_id: input.reminderId || null,
      to_status: input.toStatus || null,
      user_id: input.userId,
    });
  } catch {
    // Task events are useful audit data, but missing migration should not hide
    // the primary task mutation result from the user.
  }
}

async function syncLeadNextFollowUp(
  supabase: SupabaseClient,
  userId: string,
  leadId?: string | null,
) {
  if (!leadId) {
    return;
  }

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

async function enrichTasksWithLastNotes(
  supabase: SupabaseClient,
  userId: string,
  tasks: TaskRecord[],
) {
  const leadIds = Array.from(
    new Set(tasks.map((task) => task.lead_id).filter((id): id is string => Boolean(id))),
  );

  if (leadIds.length === 0) {
    return tasks;
  }

  const { data } = await supabase
    .from("lead_notes")
    .select("lead_id,content,created_at")
    .eq("user_id", userId)
    .in("lead_id", leadIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const noteByLead = new Map<string, string>();

  (data ?? []).forEach((note) => {
    const leadId = String(note.lead_id || "");

    if (leadId && !noteByLead.has(leadId)) {
      noteByLead.set(leadId, String(note.content || "").slice(0, 180));
    }
  });

  return tasks.map((task) => ({
    ...task,
    last_note_summary: task.lead_id ? noteByLead.get(task.lead_id) || null : null,
  }));
}

async function createTaskForUser(
  supabase: SupabaseClient,
  userId: string,
  input: CreateTaskInput,
) {
  const lead = await getOwnActiveLead(supabase, userId, input.leadId);
  const dueAt = toIsoDate(input.dueAt);
  const title =
    input.title?.trim() || getDefaultTaskTitle(input.taskType || "follow_up", lead.name);
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      description: input.note || null,
      lead_id: input.leadId,
      priority: input.priority || "medium",
      remind_at: dueAt,
      status: "pending",
      task_type: input.taskType || "follow_up",
      title,
      user_id: userId,
    })
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(supabase, userId, input.leadId);
  await insertTaskEvent(supabase, {
    eventType: "created",
    leadId: input.leadId,
    metadata: {
      priority: input.priority || "medium",
      taskType: input.taskType || "follow_up",
    },
    reminderId: data.id as string,
    toStatus: "pending",
    userId,
  });

  return normalizeTask(data as unknown as TaskRecord);
}

export async function getTasksForUser(params: Partial<GetTasksQueryInput> = {}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const from = (page - 1) * limit;
  const todayStart = startOfToday().toISOString();
  const tomorrowStart = startOfTomorrow().toISOString();
  const tab = params.tab || "today";

  let query = supabase
    .from("reminders")
    .select(TASK_SELECT, { count: "exact" })
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (params.priority) {
    query = query.eq("priority", params.priority);
  }

  if (params.taskType) {
    query = query.eq("task_type", params.taskType);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  } else if (tab === "completed") {
    query = query.in("status", [...COMPLETED_TASK_STATUSES]);
  } else {
    query = query.in("status", [...ACTIVE_TASK_STATUSES]);
  }

  if (tab === "overdue") {
    query = query.lt("remind_at", todayStart).order("remind_at", { ascending: true });
  } else if (tab === "upcoming") {
    query = query.gte("remind_at", tomorrowStart).order("remind_at", { ascending: true });
  } else if (tab === "completed") {
    query = query.order("completed_at", { ascending: false, nullsFirst: false });
  } else {
    query = query
      .gte("remind_at", todayStart)
      .lt("remind_at", tomorrowStart)
      .order("remind_at", { ascending: true });
  }

  const { count, data, error } = await query.range(from, from + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  const withLastNotes = await enrichTasksWithLastNotes(
    supabase,
    userId,
    ((data ?? []) as unknown as TaskRecord[]).map(normalizeTask),
  );
  const items = await attachCadenceMetadataToTasks(withLastNotes);

  return {
    items,
    limit,
    page,
    total: count ?? 0,
  };
}

export async function getTaskById(taskId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const task = await getOwnTask(supabase, userId, taskId);
  const [withNote] = await enrichTasksWithLastNotes(supabase, userId, [task]);
  const [withCadence] = await attachCadenceMetadataToTasks([withNote]);
  return withCadence;
}

export async function createTask(input: CreateTaskInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const task = await createTaskForUser(supabase, userId, input);
  await trackUserActivity("reminder_created");
  void safeMarkActivationStepForUser(supabase, userId, "created_first_task");
  return task;
}

export async function completeTask(input: CompleteTaskInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const task = await getOwnTask(supabase, userId, input.taskId);
  const lead = task.lead_id
    ? await getOwnActiveLead(supabase, userId, task.lead_id)
    : null;
  const now = new Date().toISOString();
  let completedNoteId: string | null = null;

  if (task.lead_id && input.note?.trim()) {
    const nextStatus = input.nextStatus || lead?.status || "new";
    const { data: note, error: noteError } = await supabase
      .from("lead_notes")
      .insert({
        content: input.note.trim(),
        contacted_at: now,
        interaction_type: task.task_type || "follow_up",
        lead_id: task.lead_id,
        outcome: input.outcome || "other",
        status_after: nextStatus,
        status_before: lead?.status || null,
        user_id: userId,
      })
      .select("id")
      .single();

    if (noteError) {
      throw new Error(noteError.message);
    }

    completedNoteId = note.id as string;
  }

  const { data, error } = await supabase
    .from("reminders")
    .update({
      completed_at: now,
      completed_note_id: completedNoteId,
      status: "completed",
      updated_at: now,
    })
    .eq("id", input.taskId)
    .eq("user_id", userId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (task.lead_id && lead) {
    const leadPatch: Record<string, string | null> = {
      updated_at: now,
    };

    if (input.nextStatus) {
      leadPatch.status = input.nextStatus;
    }

    if (isContactTask(task.task_type)) {
      leadPatch.last_contacted_at = now;
    }

    if (input.note?.trim()) {
      leadPatch.note_summary = input.note.trim().slice(0, 200);
    }

    const { error: leadError } = await supabase
      .from("leads")
      .update(leadPatch)
      .eq("id", task.lead_id)
      .eq("user_id", userId);

    if (leadError) {
      throw new Error(leadError.message);
    }
  }

  let nextTask: TaskRecord | null = null;

  if (input.createNextTask && task.lead_id) {
    nextTask = await createTaskForUser(supabase, userId, {
      dueAt: input.createNextTask.dueAt,
      leadId: task.lead_id,
      note: undefined,
      priority: input.createNextTask.priority || "medium",
      taskType: input.createNextTask.taskType || "follow_up",
      title: input.createNextTask.title,
    });
  }

  await syncLeadNextFollowUp(supabase, userId, task.lead_id);
  await insertTaskEvent(supabase, {
    eventType: "completed",
    fromStatus: task.status,
    leadId: task.lead_id,
    metadata: {
      hasNextTask: Boolean(nextTask),
      leadStatusAfter: input.nextStatus || lead?.status || null,
      leadStatusBefore: lead?.status || null,
      outcomeType: input.outcome || "other",
      priority: task.priority || "medium",
      taskType: task.task_type || "follow_up",
    },
    reminderId: task.id,
    toStatus: "completed",
    userId,
  });
  await syncCadenceProgressForTask(task.id).catch(() => null);
  await trackUserActivity("reminder_completed");
  void safeMarkActivationStepForUser(supabase, userId, "completed_first_task");

  return {
    nextTask,
    task: normalizeTask(data as unknown as TaskRecord),
  };
}

export async function snoozeTask(input: SnoozeTaskInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const task = await getOwnTask(supabase, userId, input.taskId);
  const newDueAt = toIsoDate(input.newDueAt);
  const { data, error } = await supabase
    .from("reminders")
    .update({
      description: input.reason || task.description || null,
      remind_at: newDueAt,
      snooze_count: Number(task.snooze_count || 0) + 1,
      snoozed_from: task.remind_at,
      status: "snoozed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.taskId)
    .eq("user_id", userId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(supabase, userId, task.lead_id);
  await insertTaskEvent(supabase, {
    eventType: "snoozed",
    fromStatus: task.status,
    leadId: task.lead_id,
    metadata: {
      priority: task.priority || "medium",
      taskType: task.task_type || "follow_up",
    },
    reminderId: task.id,
    toStatus: "snoozed",
    userId,
  });

  return normalizeTask(data as unknown as TaskRecord);
}

export async function cancelTask(input: CancelTaskInput) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const task = await getOwnTask(supabase, userId, input.taskId);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .update({
      cancelled_at: now,
      description: input.reason || task.description || null,
      status: "cancelled",
      updated_at: now,
    })
    .eq("id", input.taskId)
    .eq("user_id", userId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(supabase, userId, task.lead_id);
  await insertTaskEvent(supabase, {
    eventType: "cancelled",
    fromStatus: task.status,
    leadId: task.lead_id,
    reminderId: task.id,
    toStatus: "cancelled",
    userId,
  });
  await syncCadenceProgressForTask(task.id).catch(() => null);

  return normalizeTask(data as unknown as TaskRecord);
}

export async function reopenTask(taskId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const task = await getOwnTask(supabase, userId, taskId);
  const { data, error } = await supabase
    .from("reminders")
    .update({
      cancelled_at: null,
      completed_at: null,
      completed_note_id: null,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .select(TASK_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncLeadNextFollowUp(supabase, userId, task.lead_id);
  await insertTaskEvent(supabase, {
    eventType: "reopened",
    fromStatus: task.status,
    leadId: task.lead_id,
    reminderId: task.id,
    toStatus: "pending",
    userId,
  });
  await syncCadenceProgressForTask(task.id).catch(() => null);

  return normalizeTask(data as unknown as TaskRecord);
}

async function countTasks(
  supabase: SupabaseClient,
  userId: string,
  build: (query: QueryLike) => QueryLike,
) {
  const baseQuery = supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null) as unknown as QueryLike;
  const { count, error } = await build(baseQuery);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getLeadsWithoutTasks(limit = 50): Promise<LeadWithoutTask[]> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const [{ data: leads, error: leadsError }, { data: activeTasks, error: tasksError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id,name,phone,status,source,category,address,google_maps_url,last_contacted_at,next_follow_up_at,created_at")
        .eq("user_id", userId)
        .in("status", [...ACTIVE_LEAD_STATUSES_FOR_TASKS])
        .eq("is_archived", false)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("reminders")
        .select("lead_id")
        .eq("user_id", userId)
        .in("status", [...ACTIVE_TASK_STATUSES])
        .is("deleted_at", null)
        .not("lead_id", "is", null)
        .limit(5000),
    ]);

  if (leadsError) {
    throw new Error(leadsError.message);
  }

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const scheduledLeadIds = new Set(
    (activeTasks ?? []).map((task) => task.lead_id).filter(Boolean),
  );

  return ((leads ?? []) as LeadWithoutTask[])
    .filter((lead) => !scheduledLeadIds.has(lead.id))
    .slice(0, limit);
}

export async function getTaskCounts(): Promise<TaskCounts> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const todayStart = startOfToday().toISOString();
  const tomorrowStart = startOfTomorrow().toISOString();
  const [today, overdue, upcoming, completedToday, leadsWithoutTasks] =
    await Promise.all([
      countTasks(supabase, userId, (query) =>
        query
          .in("status", [...ACTIVE_TASK_STATUSES])
          .gte("remind_at", todayStart)
          .lt("remind_at", tomorrowStart),
      ),
      countTasks(supabase, userId, (query) =>
        query.in("status", [...ACTIVE_TASK_STATUSES]).lt("remind_at", todayStart),
      ),
      countTasks(supabase, userId, (query) =>
        query
          .in("status", [...ACTIVE_TASK_STATUSES])
          .gte("remind_at", tomorrowStart),
      ),
      countTasks(supabase, userId, (query) =>
        query
          .in("status", [...COMPLETED_TASK_STATUSES])
          .gte("completed_at", todayStart)
          .lt("completed_at", tomorrowStart),
      ),
      getLeadsWithoutTasks(500),
    ]);

  return {
    completedToday,
    leadsWithoutTasks: leadsWithoutTasks.length,
    overdue,
    today,
    upcoming,
  };
}

export function getTodayTasks() {
  return getTasksForUser({ tab: "today", limit: 10 });
}

export function getOverdueTasks() {
  return getTasksForUser({ tab: "overdue", limit: 10 });
}

export function getUpcomingTasks() {
  return getTasksForUser({ tab: "upcoming", limit: 10 });
}

export async function getLeadTasks(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await getOwnActiveLead(supabase, userId, leadId);
  const { data, error } = await supabase
    .from("reminders")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .eq("lead_id", leadId)
    .is("deleted_at", null)
    .order("remind_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return attachCadenceMetadataToTasks(
    ((data ?? []) as unknown as TaskRecord[]).map(normalizeTask),
  );
}

export async function getLeadTaskTimeline(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  await getOwnActiveLead(supabase, userId, leadId);
  const [{ data: notes }, { data: events }] = await Promise.all([
    supabase
      .from("lead_notes")
      .select("id,content,interaction_type,outcome,status_before,status_after,contacted_at,created_at")
      .eq("user_id", userId)
      .eq("lead_id", leadId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("task_events")
      .select("id,event_type,from_status,to_status,metadata,created_at,reminder_id")
      .eq("user_id", userId)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return {
    events: events ?? [],
    notes: notes ?? [],
  };
}

export async function listTaskLeadOptions(limit = 80): Promise<TaskLeadSummary[]> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,phone,status,source,category,google_maps_url,created_at")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TaskLeadSummary[];
}

export async function createFirstFollowUpSuggestionForLead(leadId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const lead = await getOwnActiveLead(supabase, userId, leadId);
  const dueAt = new Date();

  if (dueAt.getHours() < 16) {
    dueAt.setHours(dueAt.getHours() + 2, 0, 0, 0);
  } else {
    dueAt.setDate(dueAt.getDate() + 1);
    dueAt.setHours(9, 0, 0, 0);
  }

  return {
    dueAt: dueAt.toISOString(),
    leadId,
    priority: "medium",
    taskType: "call",
    title: `Gọi lần đầu ${lead.name}`,
  } satisfies CreateTaskInput;
}
