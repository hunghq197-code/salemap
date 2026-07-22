import {
  ACTIVATION_CHECKLIST_COPY,
  ACTIVATION_STEP_VALUES,
  ACTIVATION_STEP_WEIGHTS,
  CORE_ACTIVATION_STEP_VALUES,
  type ActivationStep,
  type CoreActivationStep,
} from "@/lib/constants/onboarding";
import { SafeError } from "@/lib/security/safe-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  OnboardingFeedbackInput,
  OnboardingProfileInput,
} from "@/lib/validators/onboarding";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type OnboardingProfile = {
  completed_at?: string | null;
  created_at?: string | null;
  has_completed_onboarding: boolean;
  id: string;
  industry?: string | null;
  main_region?: string | null;
  primary_goal?: string | null;
  role?: string | null;
  sales_model?: string | null;
  skipped_at?: string | null;
  updated_at?: string | null;
  user_id: string;
};

export type ActivationProgress = {
  activation_score: number;
  applied_first_cadence: boolean;
  applied_first_cadence_at?: string | null;
  completed_first_task: boolean;
  completed_first_task_at?: string | null;
  created_at?: string | null;
  created_first_task: boolean;
  created_first_task_at?: string | null;
  id: string;
  imported_leads: boolean;
  imported_leads_at?: string | null;
  saved_first_lead: boolean;
  saved_first_lead_at?: string | null;
  searched_map: boolean;
  searched_map_at?: string | null;
  updated_at?: string | null;
  user_id: string;
  viewed_dashboard: boolean;
  viewed_dashboard_at?: string | null;
};

export type ActivationChecklistItem = {
  completed: boolean;
  cta: string;
  description: string;
  href: string;
  key: CoreActivationStep;
  title: string;
};

type DemoDataResult = {
  createdLeads: number;
  createdNotes: number;
  createdTasks: number;
  createdCadences: number;
  status: "created" | "skipped";
};

type DeleteDemoDataResult = {
  deletedCadences: number;
  deletedLeads: number;
  deletedNotes: number;
  deletedTasks: number;
};

const defaultTags = [
  { color: "#ef4444", name: "Khách nóng" },
  { color: "#f59e0b", name: "Hẹn lại" },
  { color: "#0ea5e9", name: "Đã báo giá" },
  { color: "#22c55e", name: "Tiềm năng cao" },
] as const;

const demoLeads = [
  {
    address: "Quận 1, TP.HCM",
    category: "Nhà thuốc",
    name: "Nhà thuốc Minh An",
    note_summary: "Demo: khách quan tâm lịch chăm sóc định kỳ.",
    phone: "0900000001",
    priority: "high",
    status: "interested",
  },
  {
    address: "Quận Tân Phú, TP.HCM",
    category: "Vật liệu xây dựng",
    name: "Đại lý Vật Liệu Hòa Phát",
    note_summary: "Demo: cần gọi lại để hỏi nhu cầu nhập hàng.",
    phone: "0900000002",
    priority: "medium",
    status: "follow_up",
  },
  {
    address: "Quận 3, TP.HCM",
    category: "Spa",
    name: "Spa An Nhiên",
    note_summary: "Demo: muốn xem báo giá gói chăm sóc khách.",
    phone: "0900000003",
    priority: "high",
    status: "contacted",
  },
  {
    address: "Quận Bình Thạnh, TP.HCM",
    category: "Quán ăn",
    name: "Quán Cơm Gia Đình",
    note_summary: "Demo: hẹn trao đổi lại vào giờ thấp điểm.",
    phone: "0900000004",
    priority: "medium",
    status: "new",
  },
  {
    address: "TP. Thủ Đức, TP.HCM",
    category: "Thiết bị",
    name: "Công ty Thiết Bị Nam Long",
    note_summary: "Demo: có nhu cầu theo dõi pipeline bán hàng.",
    phone: "0900000005",
    priority: "medium",
    status: "interested",
  },
] as const;

const activationTimestampColumnByStep: Record<ActivationStep, keyof ActivationProgress> = {
  applied_first_cadence: "applied_first_cadence_at",
  completed_first_task: "completed_first_task_at",
  created_first_task: "created_first_task_at",
  imported_leads: "imported_leads_at",
  saved_first_lead: "saved_first_lead_at",
  searched_map: "searched_map_at",
  viewed_dashboard: "viewed_dashboard_at",
};

function daysFromNow(days: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);

  return date.toISOString();
}

function normalizeText(value?: string | null) {
  return value?.trim() || "";
}

function splitMainRegion(input: OnboardingProfileInput) {
  const city = normalizeText(input.primaryCity);
  const district = normalizeText(input.primaryDistrict);

  if (city || district) {
    return {
      mainRegion: [city, district].filter(Boolean).join(", "),
      primaryCity: city,
      primaryDistrict: district,
    };
  }

  const parts = input.mainRegion
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    mainRegion: input.mainRegion.trim(),
    primaryCity: parts[0] || input.mainRegion.trim(),
    primaryDistrict: parts.slice(1).join(", "),
  };
}

async function getAuthedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new SafeError("UNAUTHORIZED", 401);
  }

  return { supabase, userId: user.id };
}

function toOnboardingProfile(row: unknown): OnboardingProfile {
  const value = row as OnboardingProfile;

  return {
    ...value,
    has_completed_onboarding: Boolean(value.has_completed_onboarding),
  };
}

function toActivationProgress(row: unknown): ActivationProgress {
  const value = row as ActivationProgress;

  return {
    ...value,
    activation_score: Number(value.activation_score ?? 0),
    applied_first_cadence: Boolean(value.applied_first_cadence),
    completed_first_task: Boolean(value.completed_first_task),
    created_first_task: Boolean(value.created_first_task),
    imported_leads: Boolean(value.imported_leads),
    saved_first_lead: Boolean(value.saved_first_lead),
    searched_map: Boolean(value.searched_map),
    viewed_dashboard: Boolean(value.viewed_dashboard),
  };
}

async function upsertDefaultTagsForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { error } = await supabase.from("tags").upsert(
    defaultTags.map((tag) => ({
      ...tag,
      user_id: userId,
    })),
    {
      ignoreDuplicates: true,
      onConflict: "user_id,name",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export function calculateActivationScore(progress: Partial<ActivationProgress> | null) {
  if (!progress) {
    return 0;
  }

  return CORE_ACTIVATION_STEP_VALUES.reduce((score, step) => {
    return progress[step] ? score + ACTIVATION_STEP_WEIGHTS[step] : score;
  }, 0);
}

export function getActivationChecklistItems(
  progress: ActivationProgress,
): ActivationChecklistItem[] {
  return CORE_ACTIVATION_STEP_VALUES.map((step) => ({
    ...ACTIVATION_CHECKLIST_COPY[step],
    completed: Boolean(progress[step]),
    key: step,
  }));
}

export async function getOnboardingProfileForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_onboarding_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toOnboardingProfile(data) : null;
}

export async function getOnboardingProfile() {
  const { supabase, userId } = await getAuthedContext();

  return getOnboardingProfileForUser(supabase, userId);
}

export async function upsertOnboardingProfileForUser(
  supabase: SupabaseServerClient,
  userId: string,
  input: OnboardingProfileInput,
) {
  const now = new Date().toISOString();
  const { mainRegion, primaryCity, primaryDistrict } = splitMainRegion(input);
  const { data, error } = await supabase
    .from("user_onboarding_profiles")
    .upsert(
      {
        industry: input.industry,
        main_region: mainRegion,
        primary_goal: input.primaryGoal,
        role: input.role,
        sales_model: input.salesModel,
        updated_at: now,
        user_id: userId,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      goals: [input.primaryGoal],
      industry: input.industry,
      primary_city: primaryCity,
      primary_district: primaryDistrict,
      role_type: input.role,
      updated_at: now,
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  await upsertDefaultTagsForUser(supabase, userId);

  return toOnboardingProfile(data);
}

export async function upsertOnboardingProfile(input: OnboardingProfileInput) {
  const { supabase, userId } = await getAuthedContext();

  return upsertOnboardingProfileForUser(supabase, userId, input);
}

export async function completeOnboardingForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const now = new Date().toISOString();
  const current = await getOnboardingProfileForUser(supabase, userId);
  const { data, error } = await supabase
    .from("user_onboarding_profiles")
    .upsert(
      {
        completed_at: current?.completed_at || now,
        has_completed_onboarding: true,
        skipped_at: null,
        updated_at: now,
        user_id: userId,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      onboarding_completed: true,
      updated_at: now,
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  await ensureActivationProgressForUser(supabase, userId);

  return toOnboardingProfile(data);
}

export async function completeOnboarding() {
  const { supabase, userId } = await getAuthedContext();

  return completeOnboardingForUser(supabase, userId);
}

export async function skipOnboardingForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const now = new Date().toISOString();
  const current = await getOnboardingProfileForUser(supabase, userId);
  const { data, error } = await supabase
    .from("user_onboarding_profiles")
    .upsert(
      {
        completed_at: current?.completed_at ?? null,
        has_completed_onboarding: Boolean(current?.has_completed_onboarding),
        skipped_at: current?.skipped_at || now,
        updated_at: now,
        user_id: userId,
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      onboarding_completed: true,
      updated_at: now,
      user_id: userId,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  await ensureActivationProgressForUser(supabase, userId);

  return toOnboardingProfile(data);
}

export async function skipOnboarding() {
  const { supabase, userId } = await getAuthedContext();

  return skipOnboardingForUser(supabase, userId);
}

export async function ensureActivationProgressForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_activation_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return toActivationProgress(data);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("user_activation_progress")
    .insert({
      activation_score: 0,
      user_id: userId,
    })
    .select("*")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return ensureActivationProgressForUser(supabase, userId);
    }

    throw new Error(insertError.message);
  }

  return toActivationProgress(inserted);
}

export async function ensureActivationProgress() {
  const { supabase, userId } = await getAuthedContext();

  return ensureActivationProgressForUser(supabase, userId);
}

export async function getActivationProgress() {
  return ensureActivationProgress();
}

export async function markActivationStepForUser(
  supabase: SupabaseServerClient,
  userId: string,
  step: ActivationStep,
) {
  if (!ACTIVATION_STEP_VALUES.includes(step)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const progress = await ensureActivationProgressForUser(supabase, userId);

  if (progress[step]) {
    return progress;
  }

  const now = new Date().toISOString();
  const timestampColumn = activationTimestampColumnByStep[step];
  const nextProgress = {
    ...progress,
    [step]: true,
    [timestampColumn]: progress[timestampColumn] || now,
  };
  const activationScore = calculateActivationScore(nextProgress);
  const patch: Record<string, boolean | number | string> = {
    activation_score: activationScore,
    [step]: true,
    updated_at: now,
  };

  if (!progress[timestampColumn]) {
    patch[timestampColumn] = now;
  }

  const { data, error } = await supabase
    .from("user_activation_progress")
    .update(patch)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toActivationProgress(data);
}

export async function markActivationStep(step: ActivationStep) {
  const { supabase, userId } = await getAuthedContext();

  return markActivationStepForUser(supabase, userId, step);
}

export async function safeMarkActivationStep(step: ActivationStep) {
  try {
    return await markActivationStep(step);
  } catch {
    return null;
  }
}

export async function safeMarkActivationStepForUser(
  supabase: SupabaseServerClient,
  userId: string,
  step: ActivationStep,
) {
  try {
    return await markActivationStepForUser(supabase, userId, step);
  } catch {
    return null;
  }
}

export async function getActivationProgressWithChecklist() {
  const progress = await getActivationProgress();
  const checklist = getActivationChecklistItems(progress);

  return {
    checklist,
    completedCount: checklist.filter((item) => item.completed).length,
    progress,
    score: calculateActivationScore(progress),
    totalCount: checklist.length,
  };
}

export async function submitOnboardingFeedback(input: OnboardingFeedbackInput) {
  const { supabase, userId } = await getAuthedContext();
  const { data, error } = await supabase
    .from("onboarding_feedback")
    .insert({
      difficulty: input.difficulty,
      message: input.message || null,
      rating: input.rating,
      source: "onboarding",
      user_id: userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { id: data.id as string };
}

export async function hasDemoDataForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .or("is_demo.eq.true,source.eq.demo_onboarding,source.eq.sample_beta")
    .is("deleted_at", null);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

export async function hasDemoData() {
  const { supabase, userId } = await getAuthedContext();

  return hasDemoDataForUser(supabase, userId);
}

async function upsertDemoTags(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("tags")
    .upsert(
      defaultTags.map((tag) => ({
        ...tag,
        user_id: userId,
      })),
      { onConflict: "user_id,name" },
    )
    .select("id,name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function findDemoCadenceSeed(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data: templates, error } = await supabase
    .from("cadence_templates")
    .select("id,name")
    .eq("is_active", true)
    .eq("is_archived", false)
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !templates?.[0]?.id) {
    return null;
  }

  const template = templates[0] as { id: string; name?: string | null };
  const { data: steps, error: stepsError } = await supabase
    .from("cadence_steps")
    .select("id,day_offset,priority,suggested_message,suggested_note,step_order,task_type,title")
    .eq("cadence_template_id", template.id)
    .order("step_order", { ascending: true })
    .limit(3);

  if (stepsError || !steps || steps.length === 0) {
    return null;
  }

  return {
    steps: steps as Array<{
      day_offset?: number | null;
      id: string;
      priority?: string | null;
      suggested_message?: string | null;
      suggested_note?: string | null;
      step_order?: number | null;
      task_type?: string | null;
      title?: string | null;
    }>,
    template,
  };
}

function buildFallbackReminderRows(
  leadRows: Array<{ id: string; name?: string | null }>,
  userId: string,
) {
  return leadRows.slice(0, 3).map((lead, index) => ({
    description: "Dữ liệu mẫu: mở task này để thử luồng chăm sóc khách.",
    is_demo: true,
    lead_id: lead.id,
    priority: index === 0 ? "high" : "medium",
    remind_at: daysFromNow(index, index === 0 ? 10 : 9),
    status: "pending",
    task_type: index === 1 ? "zalo_message" : "call",
    title:
      index === 0
        ? `Gọi giới thiệu ${lead.name || "lead mẫu"}`
        : index === 1
          ? `Nhắn Zalo nhắc lịch ${lead.name || "lead mẫu"}`
          : `Gửi báo giá cho ${lead.name || "lead mẫu"}`,
    user_id: userId,
  }));
}

export async function createDemoDataForUser(): Promise<DemoDataResult> {
  const { supabase, userId } = await getAuthedContext();
  const alreadyHasDemoData = await hasDemoDataForUser(supabase, userId);

  if (alreadyHasDemoData) {
    return {
      createdCadences: 0,
      createdLeads: 0,
      createdNotes: 0,
      createdTasks: 0,
      status: "skipped",
    };
  }

  const tags = await upsertDemoTags(supabase, userId);
  const { data: leads, error: leadError } = await supabase
    .from("leads")
    .insert(
      demoLeads.map((lead, index) => ({
        ...lead,
        is_demo: true,
        next_follow_up_at: index < 3 ? daysFromNow(index) : null,
        source: "demo_onboarding",
        user_id: userId,
      })),
    )
    .select("id,name");

  if (leadError) {
    throw new Error(leadError.message);
  }

  const leadRows = (leads ?? []) as Array<{ id: string; name?: string | null }>;
  const tagByName = new Map(tags.map((tag) => [String(tag.name), String(tag.id)]));
  const leadTagRows = [
    { leadId: leadRows[0]?.id, tagId: tagByName.get("Khách nóng") },
    { leadId: leadRows[0]?.id, tagId: tagByName.get("Tiềm năng cao") },
    { leadId: leadRows[1]?.id, tagId: tagByName.get("Hẹn lại") },
    { leadId: leadRows[2]?.id, tagId: tagByName.get("Đã báo giá") },
  ]
    .filter((item): item is { leadId: string; tagId: string } =>
      Boolean(item.leadId && item.tagId),
    )
    .map((item) => ({
      lead_id: item.leadId,
      tag_id: item.tagId,
    }));

  if (leadTagRows.length > 0) {
    const { error } = await supabase.from("lead_tags").insert(leadTagRows);

    if (error) {
      throw new Error(error.message);
    }
  }

  const noteRows = leadRows.slice(0, 3).map((lead, index) => ({
    content:
      index === 0
        ? "Demo: khách muốn được gọi lại trong hôm nay."
        : index === 1
          ? "Demo: khách cần thêm thông tin sản phẩm trước khi quyết định."
          : "Demo: khách đã nhận báo giá mẫu và cần follow-up sau 2 ngày.",
    interaction_type: index === 1 ? "zalo_message" : "call",
    is_demo: true,
    lead_id: lead.id,
    outcome: index === 0 ? "interested" : "follow_up",
    status_after: index === 0 ? "interested" : "follow_up",
    status_before: "new",
    user_id: userId,
  }));

  const { data: notes, error: noteError } =
    noteRows.length > 0
      ? await supabase.from("lead_notes").insert(noteRows).select("id")
      : { data: [], error: null };

  if (noteError) {
    throw new Error(noteError.message);
  }

  const cadenceSeed = await findDemoCadenceSeed(supabase, userId).catch(() => null);
  const cadenceReminderRows =
    cadenceSeed && leadRows[0]
      ? cadenceSeed.steps.map((step, index) => ({
          description: step.suggested_note || step.suggested_message || "Dữ liệu mẫu từ quy trình chăm sóc.",
          is_demo: true,
          lead_id: leadRows[0].id,
          priority: step.priority || "medium",
          remind_at: daysFromNow(Number(step.day_offset ?? index)),
          status: "pending",
          task_type: step.task_type || "follow_up",
          title: step.title || `Bước chăm sóc ${index + 1}`,
          user_id: userId,
        }))
      : [];
  const reminderRows = [
    ...cadenceReminderRows,
    ...buildFallbackReminderRows(leadRows.slice(cadenceReminderRows.length), userId),
  ].slice(0, 3);

  const { data: reminders, error: reminderError } =
    reminderRows.length > 0
      ? await supabase.from("reminders").insert(reminderRows).select("id")
      : { data: [], error: null };

  if (reminderError) {
    throw new Error(reminderError.message);
  }

  let createdCadences = 0;
  const reminderRowsWithIds = (reminders ?? []) as Array<{ id: string }>;

  if (cadenceSeed && leadRows[0] && reminderRowsWithIds.length > 0) {
    const { data: leadCadence, error } = await supabase
      .from("lead_cadences")
      .insert({
        cadence_template_id: cadenceSeed.template.id,
        completed_steps: 0,
        current_step_order: 1,
        is_demo: true,
        lead_id: leadRows[0].id,
        started_at: new Date().toISOString(),
        status: "active",
        total_steps: Math.min(cadenceSeed.steps.length, reminderRowsWithIds.length),
        updated_at: new Date().toISOString(),
        user_id: userId,
      })
      .select("id")
      .single();

    if (!error && leadCadence?.id) {
      const linkRows = cadenceSeed.steps
        .slice(0, reminderRowsWithIds.length)
        .map((step, index) => ({
          cadence_step_id: step.id,
          lead_cadence_id: leadCadence.id as string,
          reminder_id: reminderRowsWithIds[index]?.id,
          step_order: Number(step.step_order ?? index + 1),
          user_id: userId,
        }))
        .filter((row) => Boolean(row.reminder_id));

      if (linkRows.length > 0) {
        await supabase.from("cadence_task_links").insert(linkRows);
      }

      createdCadences = 1;
    }
  }

  if (leadRows.length > 0) {
    void safeMarkActivationStepForUser(supabase, userId, "saved_first_lead");
  }

  if (reminderRowsWithIds.length > 0) {
    void safeMarkActivationStepForUser(supabase, userId, "created_first_task");
  }

  if (createdCadences > 0) {
    void safeMarkActivationStepForUser(supabase, userId, "applied_first_cadence");
  }

  return {
    createdCadences,
    createdLeads: leadRows.length,
    createdNotes: (notes ?? []).length,
    createdTasks: reminderRowsWithIds.length,
    status: "created",
  };
}

export async function deleteDemoDataForUser(): Promise<DeleteDemoDataResult> {
  const { supabase, userId } = await getAuthedContext();
  const { data: demoLeadRows } = await supabase
    .from("leads")
    .select("id")
    .eq("user_id", userId)
    .eq("is_demo", true);
  const demoLeadIds = (demoLeadRows ?? []).map((row) => String(row.id)).filter(Boolean);
  const { data: demoCadenceRows } = await supabase
    .from("lead_cadences")
    .select("id")
    .eq("user_id", userId)
    .eq("is_demo", true);
  const demoCadenceIds = (demoCadenceRows ?? [])
    .map((row) => String(row.id))
    .filter(Boolean);

  if (demoCadenceIds.length > 0) {
    await supabase
      .from("cadence_task_links")
      .delete()
      .eq("user_id", userId)
      .in("lead_cadence_id", demoCadenceIds);
  }

  if (demoLeadIds.length > 0) {
    await supabase.from("lead_tags").delete().in("lead_id", demoLeadIds);
  }

  const { data: deletedCadences } = await supabase
    .from("lead_cadences")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true)
    .select("id");
  const { data: deletedTasks } = await supabase
    .from("reminders")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true)
    .select("id");
  const { data: deletedNotes } = await supabase
    .from("lead_notes")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true)
    .select("id");
  const { data: deletedLeads } = await supabase
    .from("leads")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true)
    .select("id");

  return {
    deletedCadences: (deletedCadences ?? []).length,
    deletedLeads: (deletedLeads ?? []).length,
    deletedNotes: (deletedNotes ?? []).length,
    deletedTasks: (deletedTasks ?? []).length,
  };
}
