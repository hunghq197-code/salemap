import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import {
  LEAD_DUPLICATE_REASONS,
  type DuplicateReason,
} from "@/lib/constants/lead-cleanup";

export type DuplicateLeadSummary = {
  address: string | null;
  created_at: string | null;
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  status: string | null;
  updated_at: string | null;
  website: string | null;
};

export type LeadDuplicateGroup = {
  confidence_score: number | null;
  created_at: string | null;
  duplicate_reason: DuplicateReason | null;
  id: string;
  lead_ids: string[];
  leads: DuplicateLeadSummary[];
  primary_lead_id: string | null;
  status: string;
};

type LeadForDetection = DuplicateLeadSummary & {
  merged_at?: string | null;
};

type DuplicateCandidate = {
  confidence_score: number;
  duplicate_reason: DuplicateReason;
  lead_ids: string[];
};

export type DuplicateScanSummary = {
  groupsCreated: number;
  groupsExisting: number;
  totalPotentialDuplicates: number;
};

const REASON_CONFIDENCE: Record<DuplicateReason, number> = {
  email: 85,
  multiple_signals: 95,
  name_address: 65,
  phone: 90,
  website: 80,
};

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePhoneForDuplicate(phone?: string | null): string | null {
  const clean = (phone || "").trim();

  if (!clean) {
    return null;
  }

  let normalized = clean.replace(/[^\d+]/g, "");

  if (normalized.startsWith("+84")) {
    normalized = `0${normalized.slice(3)}`;
  } else if (normalized.startsWith("84") && normalized.length >= 10) {
    normalized = `0${normalized.slice(2)}`;
  }

  normalized = normalized.replace(/\D/g, "");

  return normalized.length >= 7 ? normalized : null;
}

export function normalizeEmailForDuplicate(email?: string | null): string | null {
  const normalized = (email || "").trim().toLowerCase();

  return normalized ? normalized : null;
}

export function normalizeWebsiteForDuplicate(website?: string | null): string | null {
  let normalized = (website || "").trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  normalized = normalized.replace(/^https?:\/\//, "").replace(/^www\./, "");
  normalized = normalized.replace(/\/+$/, "");

  return normalized || null;
}

export function normalizeNameAddressForDuplicate(
  name?: string | null,
  address?: string | null,
): string | null {
  const cleanName = normalizeText(name);
  const cleanAddress = normalizeText(address);

  if (!cleanName || !cleanAddress) {
    return null;
  }

  return `${cleanName}|${cleanAddress}`;
}

function addToMap(
  map: Map<string, DuplicateLeadSummary[]>,
  key: string | null,
  lead: DuplicateLeadSummary,
) {
  if (!key) {
    return;
  }

  const current = map.get(key) ?? [];
  current.push(lead);
  map.set(key, current);
}

function sortedIds(ids: string[]) {
  return Array.from(new Set(ids)).sort();
}

function keyForIds(ids: string[]) {
  return sortedIds(ids).join("|");
}

function buildCandidates(leads: LeadForDetection[]) {
  const buckets: Record<Exclude<DuplicateReason, "multiple_signals">, Map<string, DuplicateLeadSummary[]>> = {
    email: new Map(),
    name_address: new Map(),
    phone: new Map(),
    website: new Map(),
  };

  leads.forEach((lead) => {
    addToMap(buckets.phone, normalizePhoneForDuplicate(lead.phone), lead);
    addToMap(buckets.email, normalizeEmailForDuplicate(lead.email), lead);
    addToMap(buckets.website, normalizeWebsiteForDuplicate(lead.website), lead);
    addToMap(
      buckets.name_address,
      normalizeNameAddressForDuplicate(lead.name, lead.address),
      lead,
    );
  });

  const byLeadSet = new Map<
    string,
    {
      lead_ids: string[];
      reasons: DuplicateReason[];
    }
  >();

  (Object.entries(buckets) as Array<[Exclude<DuplicateReason, "multiple_signals">, Map<string, DuplicateLeadSummary[]>]>).forEach(
    ([reason, bucket]) => {
      bucket.forEach((bucketLeads) => {
        if (bucketLeads.length < 2) {
          return;
        }

        const ids = sortedIds(bucketLeads.map((lead) => lead.id));
        const key = keyForIds(ids);
        const current = byLeadSet.get(key) ?? { lead_ids: ids, reasons: [] };
        current.reasons.push(reason);
        byLeadSet.set(key, current);
      });
    },
  );

  return Array.from(byLeadSet.values()).map((item): DuplicateCandidate => {
    const duplicate_reason =
      item.reasons.length > 1 ? "multiple_signals" : item.reasons[0] ?? "phone";

    return {
      confidence_score: REASON_CONFIDENCE[duplicate_reason],
      duplicate_reason,
      lead_ids: item.lead_ids,
    };
  });
}

function isMissingCleanupSchema(error: { code?: string; message?: string }) {
  return (
    error.code === "42P01" ||
    (error.code === "42703" &&
      /(merged_at|archived_at|merged_into_lead_id)/i.test(error.message ?? ""))
  );
}

async function fetchOpenMergeGroups(userId: string) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_merge_groups")
    .select("id,lead_ids")
    .eq("user_id", userId)
    .in("status", ["suggested", "reviewed"]);

  if (error) {
    if (isMissingCleanupSchema(error)) {
      throw new Error("Chua chay SQL lead-cleanup-bulk-actions-schema.sql.");
    }

    throw new Error(error.message);
  }

  return (data ?? []) as Array<{ id: string; lead_ids: string[] | null }>;
}

export async function detectDuplicateLeadsForUser(
  userId: string,
): Promise<DuplicateCandidate[]> {
  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,phone,email,website,address,status,created_at,updated_at,merged_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .is("merged_at", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    if (isMissingCleanupSchema(error)) {
      throw new Error("Chua chay SQL lead-cleanup-bulk-actions-schema.sql.");
    }

    throw new Error(error.message);
  }

  return buildCandidates((data ?? []) as LeadForDetection[]);
}

export async function createDuplicateSuggestionsForUser(
  userId: string,
): Promise<DuplicateScanSummary> {
  const { supabase } = await createAuthedSupabaseServerClient();
  const candidates = await detectDuplicateLeadsForUser(userId);
  const existingGroups = await fetchOpenMergeGroups(userId);
  const existingKeys = new Set(existingGroups.map((group) => keyForIds(group.lead_ids ?? [])));
  const rowsToInsert = candidates.filter((candidate) => !existingKeys.has(keyForIds(candidate.lead_ids)));

  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("lead_merge_groups").insert(
      rowsToInsert.map((candidate) => ({
        confidence_score: candidate.confidence_score,
        duplicate_reason: candidate.duplicate_reason,
        lead_ids: candidate.lead_ids,
        status: "suggested",
        user_id: userId,
      })),
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    groupsCreated: rowsToInsert.length,
    groupsExisting: candidates.length - rowsToInsert.length,
    totalPotentialDuplicates: candidates.reduce(
      (total, candidate) => total + candidate.lead_ids.length,
      0,
    ),
  };
}

async function fetchLeadSummaries(leadIds: string[]) {
  if (leadIds.length === 0) {
    return new Map<string, DuplicateLeadSummary>();
  }

  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,phone,email,website,address,status,created_at,updated_at")
    .eq("user_id", userId)
    .in("id", leadIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as DuplicateLeadSummary[]).map((lead) => [lead.id, lead]),
  );
}

function toReason(value?: string | null): DuplicateReason | null {
  return value && value in LEAD_DUPLICATE_REASONS ? (value as DuplicateReason) : null;
}

export async function getMergeGroups(params: {
  page?: number;
  status?: string;
} = {}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabase
    .from("lead_merge_groups")
    .select(
      "id,status,duplicate_reason,confidence_score,lead_ids,primary_lead_id,created_at",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { count, data, error } = await query.range(from, to);

  if (error) {
    if (isMissingCleanupSchema(error)) {
      return { items: [] as LeadDuplicateGroup[], limit, page, total: 0, totalPages: 1 };
    }

    throw new Error(error.message);
  }

  const allLeadIds = Array.from(
    new Set((data ?? []).flatMap((group) => ((group.lead_ids ?? []) as string[]))),
  );
  const leadMap = await fetchLeadSummaries(allLeadIds);
  const items = ((data ?? []) as Array<Omit<LeadDuplicateGroup, "leads" | "duplicate_reason"> & { duplicate_reason: string | null }>).map(
    (group) => ({
      ...group,
      duplicate_reason: toReason(group.duplicate_reason),
      lead_ids: group.lead_ids ?? [],
      leads: (group.lead_ids ?? [])
        .map((leadId) => leadMap.get(leadId))
        .filter((lead): lead is DuplicateLeadSummary => Boolean(lead)),
    }),
  );

  return {
    items,
    limit,
    page,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
