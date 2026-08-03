import "server-only";

import { writeAdminAuditLog, writeSupportAccessLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import {
  getPaging,
  getParam,
  normalizeText,
  toListResult,
  type AdminListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";
import { getSubscriptionPlan } from "@/lib/constants/subscription-plans";
import type { DailyQuotaAction } from "@/lib/constants/quota";
import { BILLING_QUOTA_ACTIONS, DAILY_QUOTA_LABELS } from "@/lib/constants/quota";
import type { SubscriptionRecord } from "@/lib/data/subscriptions";
import { SafeError } from "@/lib/security/safe-error";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  assignCustomerTagSchema,
  createCustomerNoteSchema,
  createCustomerTagSchema,
  customerLifecycleLabels,
  customerLifecycleValues,
  updateCustomerLifecycleSchema,
  type CustomerColorToken,
  type CustomerLifecycle,
} from "@/lib/validators/customer-admin";

type CustomerProfileRow = {
  account_status?: string | null;
  created_at?: string | null;
  full_name?: string | null;
  id?: string | null;
  industry?: string | null;
  onboarding_completed?: boolean | null;
  primary_city?: string | null;
  primary_district?: string | null;
  role_type?: string | null;
  user_id: string;
};

type AuthUserSummary = {
  createdAt?: string | null;
  email?: string | null;
  userId: string;
};

type CustomerAdminProfileRow = {
  assigned_owner_admin_id?: string | null;
  customer_code?: string | null;
  email_cache?: string | null;
  full_name_cache?: string | null;
  lifecycle?: CustomerLifecycle | null;
  lifecycle_override_reason?: string | null;
  lifecycle_overridden_at?: string | null;
  lifecycle_overridden_by?: string | null;
  user_id: string;
};

export type AdminCustomerTag = {
  colorToken: CustomerColorToken;
  id: string;
  name: string;
  slug: string;
};

export type AdminCustomerNote = {
  authorAdminId?: string | null;
  content: string;
  createdAt?: string | null;
  id: string;
};

export type AdminCustomerLifecycleEvent = {
  actorAdminId?: string | null;
  createdAt?: string | null;
  fromLifecycle?: string | null;
  id: string;
  reason?: string | null;
  toLifecycle: CustomerLifecycle;
};

export type AdminCustomerRow = {
  accountStatus: string;
  area: string;
  createdAt?: string | null;
  currentPlan: string;
  customerCode: string;
  email: string;
  fullName: string;
  lastActivityAt?: string | null;
  leadCount: number;
  lifecycle: CustomerLifecycle;
  lifecycleLabel: string;
  mapSearchCount: number;
  openTicketCount: number;
  subscriptionEndAt?: string | null;
  subscriptionStatus: string;
  tags: AdminCustomerTag[];
  taskCount: number;
  totalPaid: number;
  userId: string;
};

export type AdminCustomersResult = {
  filters: {
    accountStatuses: string[];
    lifecycleValues: CustomerLifecycle[];
    planKeys: string[];
    subscriptionStatuses: string[];
  };
  kpis: {
    activePaidCustomers: number;
    newCustomers30d: number;
    paidRevenue: number;
    pendingPayments: number;
    totalCustomers: number;
  };
  result: AdminListResult<AdminCustomerRow>;
  schemaReady: boolean;
};

export type AdminCustomerDetail = AdminCustomerRow & {
  activationScore: number;
  aiRequestCount: number;
  billingPaymentCount: number;
  customerAdminProfile: CustomerAdminProfileRow | null;
  importJobCount: number;
  lifecycleEvents: AdminCustomerLifecycleEvent[];
  notes: AdminCustomerNote[];
  notificationCount: number;
  recentPayments: Array<{
    amount: number;
    createdAt?: string | null;
    id: string;
    orderCode?: number | null;
    provider?: string | null;
    status?: string | null;
  }>;
  recentSubscriptionEvents: Array<{
    createdAt?: string | null;
    eventType: string;
    id: string;
    toPlanKey?: string | null;
    toStatus?: string | null;
  }>;
  schemaReady: boolean;
  securityEventCount: number;
  subscription: (SubscriptionRecord & { planDisplayName: string }) | null;
  supportAccessCount: number;
  usageSummary: Array<{
    actionType: DailyQuotaAction | string;
    label: string;
    limitCount: number;
    usedCount: number;
    usageDate: string;
  }>;
};

function isCustomerLifecycle(value?: string | null): value is CustomerLifecycle {
  return customerLifecycleValues.includes(value as CustomerLifecycle);
}

function defaultLifecycle(accountStatus?: string | null, subscriptionStatus?: string | null) {
  if (accountStatus === "suspended") return "suspended" satisfies CustomerLifecycle;
  if (subscriptionStatus === "active") return "paying" satisfies CustomerLifecycle;
  if (subscriptionStatus === "trialing") return "trial" satisfies CustomerLifecycle;

  return "registered" satisfies CustomerLifecycle;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatCustomerCode(userId: string) {
  return `CUS-${userId.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function slugifyTagName(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `tag-${Date.now()}`;
}

function emptyCustomerKpis() {
  return {
    activePaidCustomers: 0,
    newCustomers30d: 0,
    paidRevenue: 0,
    pendingPayments: 0,
    totalCustomers: 0,
  };
}

async function getAuthUserById(userId: string): Promise<AuthUserSummary | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return null;
  }

  return {
    createdAt: data.user.created_at ?? null,
    email: data.user.email ?? null,
    userId: data.user.id,
  };
}

async function getAuthUserMap(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const rows = await Promise.all(uniqueIds.map((userId) => getAuthUserById(userId)));

  return new Map(
    rows
      .filter((row): row is AuthUserSummary => Boolean(row))
      .map((row) => [row.userId, row]),
  );
}

async function getCustomerAdminProfiles(userIds: string[]) {
  if (userIds.length === 0) {
    return {
      rows: new Map<string, CustomerAdminProfileRow>(),
      schemaReady: true,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_admin_profiles")
    .select(
      "user_id,customer_code,email_cache,full_name_cache,lifecycle,lifecycle_override_reason,lifecycle_overridden_by,lifecycle_overridden_at,assigned_owner_admin_id",
    )
    .in("user_id", userIds);

  if (error) {
    return {
      rows: new Map<string, CustomerAdminProfileRow>(),
      schemaReady: false,
    };
  }

  return {
    rows: new Map(
      ((data ?? []) as CustomerAdminProfileRow[]).map((row) => [row.user_id, row]),
    ),
    schemaReady: true,
  };
}

async function ensureCustomerAdminProfiles(input: {
  authMap: Map<string, AuthUserSummary>;
  crmRows: Map<string, CustomerAdminProfileRow>;
  profiles: CustomerProfileRow[];
  schemaReady: boolean;
}) {
  if (!input.schemaReady || input.profiles.length === 0) {
    return input.crmRows;
  }

  const payload = input.profiles
    .map((profile) => {
      const auth = input.authMap.get(profile.user_id);
      const existing = input.crmRows.get(profile.user_id);
      const email = auth?.email ?? existing?.email_cache ?? "";
      const fullName = profile.full_name ?? existing?.full_name_cache ?? "";
      const needsUpsert =
        !existing ||
        existing.email_cache !== email ||
        existing.full_name_cache !== fullName;

      return needsUpsert
        ? {
            email_cache: email || null,
            full_name_cache: fullName || null,
            user_id: profile.user_id,
          }
        : null;
    })
    .filter((row): row is { email_cache: string | null; full_name_cache: string | null; user_id: string } =>
      Boolean(row),
    );

  if (payload.length === 0) {
    return input.crmRows;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_admin_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select(
      "user_id,customer_code,email_cache,full_name_cache,lifecycle,lifecycle_override_reason,lifecycle_overridden_by,lifecycle_overridden_at,assigned_owner_admin_id",
    );

  if (error) {
    return input.crmRows;
  }

  const nextRows = new Map(input.crmRows);
  ((data ?? []) as CustomerAdminProfileRow[]).forEach((row) => {
    nextRows.set(row.user_id, row);
  });

  return nextRows;
}

async function getLatestSubscriptions(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, SubscriptionRecord>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .in("user_id", userIds)
    .order("updated_at", { ascending: false });

  if (error) return new Map<string, SubscriptionRecord>();

  const rows = new Map<string, SubscriptionRecord>();
  ((data ?? []) as SubscriptionRecord[]).forEach((row) => {
    if (!rows.has(row.user_id)) {
      rows.set(row.user_id, row);
    }
  });

  return rows;
}

async function getLatestSubscription(userId: string) {
  return (await getLatestSubscriptions([userId])).get(userId) ?? null;
}

async function getPaidTotals(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, number>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("user_id,amount,status")
    .in("user_id", userIds)
    .eq("status", "paid");

  if (error) return new Map<string, number>();

  const totals = new Map<string, number>();
  ((data ?? []) as Array<{ amount?: number | null; user_id?: string | null }>).forEach(
    (row) => {
      if (!row.user_id) return;
      totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + Number(row.amount ?? 0));
    },
  );

  return totals;
}

async function getCountsByUser(table: string, userIds: string[], userColumn = "user_id") {
  if (userIds.length === 0) return new Map<string, number>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(table)
    .select(`${userColumn}`)
    .in(userColumn, userIds)
    .limit(10000);

  if (error) return new Map<string, number>();

  const counts = new Map<string, number>();
  ((data ?? []) as unknown as Array<Record<string, unknown>>).forEach((row) => {
    const userId = String(row[userColumn] || "");
    if (!userId) return;
    counts.set(userId, (counts.get(userId) ?? 0) + 1);
  });

  return counts;
}

async function getOpenTicketCountsByUser(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, number>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("user_id,status")
    .in("user_id", userIds)
    .limit(10000);

  if (error) return new Map<string, number>();

  const counts = new Map<string, number>();
  ((data ?? []) as Array<{ status?: string | null; user_id?: string | null }>).forEach(
    (row) => {
      if (!row.user_id || ["cancelled", "closed", "resolved"].includes(row.status || "")) {
        return;
      }

      counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
    },
  );

  return counts;
}

async function getLatestActivityMap(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string>();

  const tables = [
    "leads",
    "reminders",
    "map_searches",
    "routes",
    "payments",
    "subscription_events",
    "notifications",
  ];
  const results = await Promise.all(
    tables.map(async (table) => {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from(table)
        .select("user_id,created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .limit(10000);

      return error
        ? []
        : ((data ?? []) as Array<{ created_at?: string | null; user_id?: string | null }>);
    }),
  );

  const latest = new Map<string, string>();
  results.flat().forEach((row) => {
    if (!row.user_id || !row.created_at) return;
    const current = latest.get(row.user_id);
    if (!current || row.created_at > current) {
      latest.set(row.user_id, row.created_at);
    }
  });

  return latest;
}

async function getTagsForUsers(userIds: string[]) {
  if (userIds.length === 0) {
    return {
      rows: new Map<string, AdminCustomerTag[]>(),
      schemaReady: true,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("customer_tag_assignments")
    .select("user_id,tag_id")
    .in("user_id", userIds);

  if (assignmentsError) {
    return {
      rows: new Map<string, AdminCustomerTag[]>(),
      schemaReady: false,
    };
  }

  const tagIds = Array.from(
    new Set(
      ((assignments ?? []) as Array<{ tag_id?: string | null }>).map((row) => row.tag_id).filter(Boolean),
    ),
  ) as string[];

  if (tagIds.length === 0) {
    return {
      rows: new Map<string, AdminCustomerTag[]>(),
      schemaReady: true,
    };
  }

  const { data: tags, error: tagsError } = await supabase
    .from("customer_tags")
    .select("id,name,slug,color_token")
    .in("id", tagIds);

  if (tagsError) {
    return {
      rows: new Map<string, AdminCustomerTag[]>(),
      schemaReady: false,
    };
  }

  const tagMap = new Map(
    ((tags ?? []) as Array<{
      color_token?: CustomerColorToken | null;
      id: string;
      name?: string | null;
      slug?: string | null;
    }>).map((tag) => [
      tag.id,
      {
        colorToken: tag.color_token || "slate",
        id: tag.id,
        name: tag.name || "",
        slug: tag.slug || "",
      } satisfies AdminCustomerTag,
    ]),
  );
  const rows = new Map<string, AdminCustomerTag[]>();

  ((assignments ?? []) as Array<{ tag_id?: string | null; user_id?: string | null }>).forEach(
    (assignment) => {
      if (!assignment.user_id || !assignment.tag_id) return;
      const tag = tagMap.get(assignment.tag_id);
      if (!tag) return;
      rows.set(assignment.user_id, [...(rows.get(assignment.user_id) ?? []), tag]);
    },
  );

  return {
    rows,
    schemaReady: true,
  };
}

async function getCustomerKpis() {
  const supabase = createSupabaseAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    totalResult,
    newResult,
    activeSubscriptionsResult,
    pendingPaymentsResult,
    paidPaymentsResult,
  ] = await Promise.all([
    supabase.from("user_profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("subscriptions")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "active")
      .in("plan_key", ["pro", "pro_plus"]),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing", "waiting_confirmation"]),
    supabase.from("payments").select("amount,status").eq("status", "paid").limit(10000),
  ]);

  if (totalResult.error) return emptyCustomerKpis();

  return {
    activePaidCustomers: activeSubscriptionsResult.count ?? 0,
    newCustomers30d: newResult.count ?? 0,
    paidRevenue: ((paidPaymentsResult.data ?? []) as Array<{ amount?: number | null }>).reduce(
      (total, row) => total + Number(row.amount ?? 0),
      0,
    ),
    pendingPayments: pendingPaymentsResult.count ?? 0,
    totalCustomers: totalResult.count ?? 0,
  };
}

function intersectCandidateIds(current: Set<string> | null, next: string[]) {
  const nextSet = new Set(next);

  if (current === null) {
    return nextSet;
  }

  return new Set(Array.from(current).filter((userId) => nextSet.has(userId)));
}

async function getCandidateIdsFromSubscriptions(input: {
  plan?: string;
  status?: string;
}) {
  if (!input.plan && !input.status) return null;

  const supabase = createSupabaseAdminClient();
  let query = supabase.from("subscriptions").select("user_id");

  if (input.plan) query = query.eq("plan_key", input.plan);
  if (input.status) query = query.eq("status", input.status);

  const { data, error } = await query.limit(10000);

  if (error) return new Set<string>();

  return new Set(
    ((data ?? []) as Array<{ user_id?: string | null }>).map((row) => row.user_id).filter(Boolean) as string[],
  );
}

async function getCandidateIdsFromPaidStatus(value?: string) {
  if (!value) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("user_id")
    .eq("status", "paid")
    .limit(10000);

  if (error) return new Set<string>();

  const paidIds = new Set(
    ((data ?? []) as Array<{ user_id?: string | null }>).map((row) => row.user_id).filter(Boolean) as string[],
  );

  if (value === "has_paid") return paidIds;

  const { data: profiles } = await supabase.from("user_profiles").select("user_id").limit(10000);

  return new Set(
    ((profiles ?? []) as Array<{ user_id?: string | null }>)
      .map((row) => row.user_id)
      .filter(
        (userId): userId is string =>
          typeof userId === "string" && Boolean(userId) && !paidIds.has(userId),
      ),
  );
}

async function getCandidateIdsFromLifecycle(value?: string) {
  if (!value || !isCustomerLifecycle(value)) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_admin_profiles")
    .select("user_id")
    .eq("lifecycle", value)
    .limit(10000);

  if (error) return new Set<string>();

  return new Set(
    ((data ?? []) as Array<{ user_id?: string | null }>).map((row) => row.user_id).filter(Boolean) as string[],
  );
}

async function getCandidateIdsFromEmailCache(queryText?: string) {
  if (!queryText || !queryText.includes("@")) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_admin_profiles")
    .select("user_id")
    .ilike("email_cache", `%${queryText}%`)
    .limit(10000);

  if (error) return new Set<string>();

  return new Set(
    ((data ?? []) as Array<{ user_id?: string | null }>).map((row) => row.user_id).filter(Boolean) as string[],
  );
}

function buildCustomerRow(input: {
  auth?: AuthUserSummary | null;
  crm?: CustomerAdminProfileRow | null;
  lastActivityAt?: string | null;
  leadCount: number;
  mapSearchCount: number;
  openTicketCount: number;
  paidTotal: number;
  profile: CustomerProfileRow;
  subscription?: SubscriptionRecord | null;
  tags: AdminCustomerTag[];
  taskCount: number;
}): AdminCustomerRow {
  const plan = getSubscriptionPlan(input.subscription?.plan_key);
  const lifecycle =
    input.crm?.lifecycle ||
    defaultLifecycle(input.profile.account_status, input.subscription?.status);
  const createdAt = input.auth?.createdAt || input.profile.created_at || null;

  return {
    accountStatus: input.profile.account_status || "active",
    area: [input.profile.primary_city, input.profile.primary_district]
      .filter(Boolean)
      .join(" - "),
    createdAt,
    currentPlan: plan.name,
    customerCode: input.crm?.customer_code || formatCustomerCode(input.profile.user_id),
    email: input.auth?.email || input.crm?.email_cache || "",
    fullName: input.profile.full_name || input.crm?.full_name_cache || "",
    lastActivityAt: input.lastActivityAt || null,
    leadCount: input.leadCount,
    lifecycle,
    lifecycleLabel: customerLifecycleLabels[lifecycle],
    mapSearchCount: input.mapSearchCount,
    openTicketCount: input.openTicketCount,
    subscriptionEndAt: input.subscription?.current_period_end ?? null,
    subscriptionStatus: input.subscription?.status || "free",
    tags: input.tags,
    taskCount: input.taskCount,
    totalPaid: input.paidTotal,
    userId: input.profile.user_id,
  };
}

export async function getAdminCustomers(
  params?: AdminSearchParams,
): Promise<AdminCustomersResult> {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CUSTOMERS);

  const supabase = createSupabaseAdminClient();
  const { from, limit, page, to } = getPaging(params);
  const q = normalizeText(getParam(params, "q"));
  const accountStatus = getParam(params, "accountStatus") || "";
  const lifecycle = getParam(params, "lifecycle") || "";
  const plan = getParam(params, "plan") || "";
  const subscriptionStatus = getParam(params, "subscriptionStatus") || "";
  const paidStatus = getParam(params, "paidStatus") || "";
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";

  let candidateIds: Set<string> | null = null;
  const [subscriptionIds, paidIds, lifecycleIds, emailIds] = await Promise.all([
    getCandidateIdsFromSubscriptions({ plan, status: subscriptionStatus }),
    getCandidateIdsFromPaidStatus(paidStatus),
    getCandidateIdsFromLifecycle(lifecycle),
    getCandidateIdsFromEmailCache(q),
  ]);

  const candidateGroups = [subscriptionIds, paidIds, lifecycleIds, emailIds];

  for (const ids of candidateGroups) {
    if (ids !== null) {
      candidateIds = intersectCandidateIds(candidateIds, Array.from(ids));
    }
  }

  if (candidateIds !== null && candidateIds.size === 0) {
    return {
      filters: {
        accountStatuses: ["active", "suspended", "deleted"],
        lifecycleValues: [...customerLifecycleValues],
        planKeys: ["free_beta", "pro", "pro_plus"],
        subscriptionStatuses: ["active", "cancelled", "expired", "free", "grace", "past_due", "trialing"],
      },
      kpis: await getCustomerKpis(),
      result: toListResult([], 0, page, limit),
      schemaReady: lifecycleIds !== null || emailIds !== null ? false : true,
    };
  }

  let query = supabase
    .from("user_profiles")
    .select(
      "id,user_id,full_name,role_type,industry,primary_city,primary_district,onboarding_completed,account_status,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (accountStatus) query = query.eq("account_status", accountStatus);
  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate);
  if (q && !q.includes("@")) {
    if (isUuid(q)) {
      query = query.eq("user_id", q);
    } else {
      query = query.ilike("full_name", `%${q}%`);
    }
  }
  if (candidateIds) {
    query = query.in("user_id", Array.from(candidateIds));
  }

  const [profilesResult, kpis] = await Promise.all([query, getCustomerKpis()]);

  if (profilesResult.error) {
    return {
      filters: {
        accountStatuses: ["active", "suspended", "deleted"],
        lifecycleValues: [...customerLifecycleValues],
        planKeys: ["free_beta", "pro", "pro_plus"],
        subscriptionStatuses: ["active", "cancelled", "expired", "free", "grace", "past_due", "trialing"],
      },
      kpis,
      result: toListResult([], 0, page, limit),
      schemaReady: false,
    };
  }

  const profiles = (profilesResult.data ?? []) as CustomerProfileRow[];
  const userIds = profiles.map((profile) => profile.user_id);
  const [
    authMap,
    crmResult,
    subscriptionMap,
    paidTotals,
    leadCounts,
    taskCounts,
    mapCounts,
    openTicketCounts,
    latestActivity,
    tagsResult,
  ] = await Promise.all([
    getAuthUserMap(userIds),
    getCustomerAdminProfiles(userIds),
    getLatestSubscriptions(userIds),
    getPaidTotals(userIds),
    getCountsByUser("leads", userIds),
    getCountsByUser("reminders", userIds),
    getCountsByUser("map_searches", userIds),
    getOpenTicketCountsByUser(userIds),
    getLatestActivityMap(userIds),
    getTagsForUsers(userIds),
  ]);
  const crmRows = await ensureCustomerAdminProfiles({
    authMap,
    crmRows: crmResult.rows,
    profiles,
    schemaReady: crmResult.schemaReady,
  });
  const schemaReady = crmResult.schemaReady && tagsResult.schemaReady;
  const rows = profiles.map((profile) =>
    buildCustomerRow({
      auth: authMap.get(profile.user_id),
      crm: crmRows.get(profile.user_id),
      lastActivityAt: latestActivity.get(profile.user_id),
      leadCount: leadCounts.get(profile.user_id) ?? 0,
      mapSearchCount: mapCounts.get(profile.user_id) ?? 0,
      openTicketCount: openTicketCounts.get(profile.user_id) ?? 0,
      paidTotal: paidTotals.get(profile.user_id) ?? 0,
      profile,
      subscription: subscriptionMap.get(profile.user_id),
      tags: tagsResult.rows.get(profile.user_id) ?? [],
      taskCount: taskCounts.get(profile.user_id) ?? 0,
    }),
  );

  return {
    filters: {
      accountStatuses: ["active", "suspended", "deleted"],
      lifecycleValues: [...customerLifecycleValues],
      planKeys: ["free_beta", "pro", "pro_plus"],
      subscriptionStatuses: ["active", "cancelled", "expired", "free", "grace", "past_due", "trialing"],
    },
    kpis,
    result: toListResult(rows, profilesResult.count ?? rows.length, page, limit),
    schemaReady,
  };
}

async function getProfileByUserId(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id,user_id,full_name,role_type,industry,primary_city,primary_district,onboarding_completed,account_status,created_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return data as CustomerProfileRow;
}

async function getUsageSummary(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("daily_usage_limits")
    .select("action_type,usage_date,used_count,limit_count")
    .eq("user_id", userId)
    .order("usage_date", { ascending: false })
    .limit(50);

  if (error) return [];

  return ((data ?? []) as Array<{
    action_type?: string | null;
    limit_count?: number | null;
    usage_date?: string | null;
    used_count?: number | null;
  }>)
    .filter((row) => BILLING_QUOTA_ACTIONS.includes(row.action_type as DailyQuotaAction))
    .map((row) => {
      const actionType = row.action_type || "";

      return {
        actionType,
        label:
          DAILY_QUOTA_LABELS[actionType as DailyQuotaAction]?.label ||
          actionType ||
          "Unknown",
        limitCount: Number(row.limit_count ?? 0),
        usedCount: Number(row.used_count ?? 0),
        usageDate: row.usage_date || "",
      };
    });
}

async function getRecentPayments(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id,created_at,status,amount,provider,order_code")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return [];

  return ((data ?? []) as Array<{
    amount?: number | null;
    created_at?: string | null;
    id: string;
    order_code?: number | null;
    provider?: string | null;
    status?: string | null;
  }>).map((row) => ({
    amount: Number(row.amount ?? 0),
    createdAt: row.created_at ?? null,
    id: row.id,
    orderCode: row.order_code ?? null,
    provider: row.provider ?? null,
    status: row.status ?? null,
  }));
}

async function getRecentSubscriptionEvents(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscription_events")
    .select("id,created_at,event_type,to_plan_key,to_status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) return [];

  return ((data ?? []) as Array<{
    created_at?: string | null;
    event_type?: string | null;
    id: string;
    to_plan_key?: string | null;
    to_status?: string | null;
  }>).map((row) => ({
    createdAt: row.created_at ?? null,
    eventType: row.event_type || "",
    id: row.id,
    toPlanKey: row.to_plan_key ?? null,
    toStatus: row.to_status ?? null,
  }));
}

async function getCustomerNotes(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_notes")
    .select("id,user_id,author_admin_id,content,created_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return {
      rows: [] as AdminCustomerNote[],
      schemaReady: false,
    };
  }

  return {
    rows: ((data ?? []) as Array<{
      author_admin_id?: string | null;
      content?: string | null;
      created_at?: string | null;
      id: string;
    }>).map((row) => ({
      authorAdminId: row.author_admin_id ?? null,
      content: row.content || "",
      createdAt: row.created_at ?? null,
      id: row.id,
    })),
    schemaReady: true,
  };
}

async function getLifecycleEvents(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_lifecycle_events")
    .select("id,user_id,actor_admin_id,from_lifecycle,to_lifecycle,reason,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return {
      rows: [] as AdminCustomerLifecycleEvent[],
      schemaReady: false,
    };
  }

  return {
    rows: ((data ?? []) as Array<{
      actor_admin_id?: string | null;
      created_at?: string | null;
      from_lifecycle?: string | null;
      id: string;
      reason?: string | null;
      to_lifecycle?: CustomerLifecycle | null;
    }>).map((row) => ({
      actorAdminId: row.actor_admin_id ?? null,
      createdAt: row.created_at ?? null,
      fromLifecycle: row.from_lifecycle ?? null,
      id: row.id,
      reason: row.reason ?? null,
      toLifecycle: row.to_lifecycle || "registered",
    })),
    schemaReady: true,
  };
}

async function getAllCustomerTags() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_tags")
    .select("id,name,slug,color_token")
    .order("name", { ascending: true })
    .limit(100);

  if (error) {
    return {
      rows: [] as AdminCustomerTag[],
      schemaReady: false,
    };
  }

  return {
    rows: ((data ?? []) as Array<{
      color_token?: CustomerColorToken | null;
      id: string;
      name?: string | null;
      slug?: string | null;
    }>).map((row) => ({
      colorToken: row.color_token || "slate",
      id: row.id,
      name: row.name || "",
      slug: row.slug || "",
    })),
    schemaReady: true,
  };
}

export async function getAdminCustomerDetail(
  userId: string,
): Promise<(AdminCustomerDetail & { availableTags: AdminCustomerTag[] }) | null> {
  const admin = await requirePermission(ADMIN_PERMISSIONS.VIEW_CUSTOMER_DETAIL);

  if (!isUuid(userId)) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const profile = await getProfileByUserId(userId);
  const auth = await getAuthUserById(userId);

  if (!profile && !auth) return null;

  const syntheticProfile: CustomerProfileRow =
    profile ?? {
      account_status: "active",
      created_at: auth?.createdAt ?? null,
      full_name: "",
      user_id: userId,
    };
  const [
    crmResult,
    subscription,
    paidTotals,
    leadCounts,
    taskCounts,
    mapCounts,
    importCounts,
    aiCounts,
    billingCounts,
    notificationCounts,
    securityCounts,
    supportCounts,
    openTicketCounts,
    latestActivity,
    tagsResult,
    notesResult,
    lifecycleResult,
    allTagsResult,
    usageSummary,
    recentPayments,
    recentSubscriptionEvents,
  ] = await Promise.all([
    getCustomerAdminProfiles([userId]),
    getLatestSubscription(userId),
    getPaidTotals([userId]),
    getCountsByUser("leads", [userId]),
    getCountsByUser("reminders", [userId]),
    getCountsByUser("map_searches", [userId]),
    getCountsByUser("import_jobs", [userId]),
    getCountsByUser("ai_requests", [userId]),
    getCountsByUser("payments", [userId]),
    getCountsByUser("notifications", [userId]),
    getCountsByUser("security_events", [userId]),
    getCountsByUser("support_access_logs", [userId], "target_user_id"),
    getOpenTicketCountsByUser([userId]),
    getLatestActivityMap([userId]),
    getTagsForUsers([userId]),
    getCustomerNotes(userId),
    getLifecycleEvents(userId),
    getAllCustomerTags(),
    getUsageSummary(userId),
    getRecentPayments(userId),
    getRecentSubscriptionEvents(userId),
  ]);
  const authMap = new Map(auth ? [[userId, auth]] : []);
  const crmRows = await ensureCustomerAdminProfiles({
    authMap,
    crmRows: crmResult.rows,
    profiles: [syntheticProfile],
    schemaReady: crmResult.schemaReady,
  });
  const customerRow = buildCustomerRow({
    auth,
    crm: crmRows.get(userId),
    lastActivityAt: latestActivity.get(userId),
    leadCount: leadCounts.get(userId) ?? 0,
    mapSearchCount: mapCounts.get(userId) ?? 0,
    openTicketCount: openTicketCounts.get(userId) ?? 0,
    paidTotal: paidTotals.get(userId) ?? 0,
    profile: syntheticProfile,
    subscription,
    tags: tagsResult.rows.get(userId) ?? [],
    taskCount: taskCounts.get(userId) ?? 0,
  });

  await writeSupportAccessLog({
    accessType: "view_customer_360",
    actorUserId: admin.userId,
    metadata: {
      viewerRole: admin.role,
    },
    reason: "admin_customer_360",
    targetUserId: userId,
  });

  return {
    ...customerRow,
    activationScore: 0,
    aiRequestCount: aiCounts.get(userId) ?? 0,
    availableTags: allTagsResult.rows,
    billingPaymentCount: billingCounts.get(userId) ?? 0,
    customerAdminProfile: crmRows.get(userId) ?? null,
    importJobCount: importCounts.get(userId) ?? 0,
    lifecycleEvents: lifecycleResult.rows,
    notes: notesResult.rows,
    notificationCount: notificationCounts.get(userId) ?? 0,
    recentPayments,
    recentSubscriptionEvents,
    schemaReady:
      crmResult.schemaReady &&
      tagsResult.schemaReady &&
      notesResult.schemaReady &&
      lifecycleResult.schemaReady &&
      allTagsResult.schemaReady,
    securityEventCount: securityCounts.get(userId) ?? 0,
    subscription: subscription
      ? {
          ...subscription,
          planDisplayName: getSubscriptionPlan(subscription.plan_key).name,
        }
      : null,
    supportAccessCount: supportCounts.get(userId) ?? 0,
    usageSummary,
  };
}

async function ensureCustomerProfileForMutation(userId: string) {
  const auth = await getAuthUserById(userId);

  if (!auth) {
    throw new SafeError("NOT_FOUND", 404);
  }

  const profile = await getProfileByUserId(userId);
  const crmRows = await ensureCustomerAdminProfiles({
    authMap: new Map([[userId, auth]]),
    crmRows: new Map(),
    profiles: [
      profile ?? {
        account_status: "active",
        created_at: auth.createdAt ?? null,
        full_name: "",
        user_id: userId,
      },
    ],
    schemaReady: true,
  });

  return {
    auth,
    current: crmRows.get(userId) ?? null,
  };
}

export async function updateCustomerLifecycle(input: {
  formData: FormData;
  request?: Request;
  userId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CUSTOMER_LIFECYCLE);
  const parsed = updateCustomerLifecycleSchema.parse({
    lifecycle: input.formData.get("lifecycle"),
    reason: input.formData.get("reason") || "",
  });
  const { auth, current } = await ensureCustomerProfileForMutation(input.userId);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("customer_admin_profiles").upsert(
    {
      email_cache: auth.email || null,
      lifecycle: parsed.lifecycle,
      lifecycle_override_reason: parsed.reason || null,
      lifecycle_overridden_at: new Date().toISOString(),
      lifecycle_overridden_by: admin.userId,
      user_id: input.userId,
    },
    { onConflict: "user_id" },
  );

  if (error) throw new SafeError("UNKNOWN_ERROR", 500);

  const { error: eventError } = await supabase.from("customer_lifecycle_events").insert({
    actor_admin_id: admin.userId,
    event_type: "lifecycle_changed",
    from_lifecycle: current?.lifecycle || null,
    reason: parsed.reason || null,
    safe_metadata: {
      source: "admin_customer_360",
    },
    to_lifecycle: parsed.lifecycle,
    user_id: input.userId,
  });

  if (eventError) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeAdminAuditLog({
    action: "customer_lifecycle_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      fromLifecycle: current?.lifecycle || null,
      toLifecycle: parsed.lifecycle,
    },
    request: input.request,
    severity: "info",
    targetId: input.userId,
    targetType: "customer",
  });
}

export async function createCustomerNote(input: {
  formData: FormData;
  request?: Request;
  userId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CUSTOMER_NOTES);
  const parsed = createCustomerNoteSchema.parse({
    content: input.formData.get("content"),
  });
  await ensureCustomerProfileForMutation(input.userId);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_notes")
    .insert({
      author_admin_id: admin.userId,
      content: parsed.content,
      user_id: input.userId,
      visibility: "internal",
    })
    .select("id")
    .single();

  if (error) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeAdminAuditLog({
    action: "customer_note_created",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      contentLength: parsed.content.length,
      noteId: String(data.id),
    },
    request: input.request,
    severity: "info",
    targetId: input.userId,
    targetType: "customer",
  });
}

export async function deleteCustomerNote(input: {
  noteId: string;
  request?: Request;
  userId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CUSTOMER_NOTES);

  if (!isUuid(input.noteId)) throw new SafeError("VALIDATION_ERROR", 400);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("customer_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.noteId)
    .eq("user_id", input.userId);

  if (error) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeAdminAuditLog({
    action: "customer_note_deleted",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      noteId: input.noteId,
    },
    request: input.request,
    severity: "warning",
    targetId: input.userId,
    targetType: "customer",
  });
}

export async function createAndAssignCustomerTag(input: {
  formData: FormData;
  request?: Request;
  userId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CUSTOMER_TAGS);
  const parsed = createCustomerTagSchema.parse({
    colorToken: input.formData.get("colorToken") || "slate",
    description: input.formData.get("description") || "",
    name: input.formData.get("name"),
  });
  await ensureCustomerProfileForMutation(input.userId);

  const slug = slugifyTagName(parsed.name);
  const supabase = createSupabaseAdminClient();
  const { data: tag, error } = await supabase
    .from("customer_tags")
    .upsert(
      {
        color_token: parsed.colorToken,
        created_by: admin.userId,
        description: parsed.description || null,
        name: parsed.name,
        slug,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (error || !tag?.id) throw new SafeError("UNKNOWN_ERROR", 500);

  const { error: assignmentError } = await supabase
    .from("customer_tag_assignments")
    .upsert(
      {
        assigned_by: admin.userId,
        tag_id: String(tag.id),
        user_id: input.userId,
      },
      { onConflict: "tag_id,user_id" },
    );

  if (assignmentError) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeAdminAuditLog({
    action: "customer_tag_assigned",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      colorToken: parsed.colorToken,
      tagId: String(tag.id),
      tagSlug: slug,
    },
    request: input.request,
    severity: "info",
    targetId: input.userId,
    targetType: "customer",
  });
}

export async function assignCustomerTag(input: {
  formData: FormData;
  request?: Request;
  userId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CUSTOMER_TAGS);
  const parsed = assignCustomerTagSchema.parse({
    tagId: input.formData.get("tagId"),
  });
  await ensureCustomerProfileForMutation(input.userId);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("customer_tag_assignments").upsert(
    {
      assigned_by: admin.userId,
      tag_id: parsed.tagId,
      user_id: input.userId,
    },
    { onConflict: "tag_id,user_id" },
  );

  if (error) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeAdminAuditLog({
    action: "customer_tag_assigned",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      tagId: parsed.tagId,
    },
    request: input.request,
    severity: "info",
    targetId: input.userId,
    targetType: "customer",
  });
}

export async function removeCustomerTag(input: {
  request?: Request;
  tagId: string;
  userId: string;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CUSTOMER_TAGS);

  if (!isUuid(input.tagId)) throw new SafeError("VALIDATION_ERROR", 400);

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("customer_tag_assignments")
    .delete()
    .eq("tag_id", input.tagId)
    .eq("user_id", input.userId);

  if (error) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeAdminAuditLog({
    action: "customer_tag_removed",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      tagId: input.tagId,
    },
    request: input.request,
    severity: "info",
    targetId: input.userId,
    targetType: "customer",
  });
}
