import { EXPORT_FIELD_LABELS, type ExportFieldKey, getSourceLabel } from "@/lib/constants/export";
import { getLeadPriorityOption } from "@/lib/constants/lead-priority";
import { getLeadStatusOption } from "@/lib/constants/lead-status";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";

export type ExportLeadFilters = {
  fromDate?: string;
  source?: string;
  status?: string;
  tagId?: string;
  toDate?: string;
};

type ExportLeadRow = {
  address: string | null;
  category: string | null;
  created_at: string | null;
  email: string | null;
  id: string;
  name: string;
  next_follow_up_at: string | null;
  note_summary: string | null;
  phone: string | null;
  priority: string | null;
  source: string | null;
  status: string | null;
  website: string | null;
};

function cleanText(value?: string | null) {
  const clean = value?.trim();
  return clean || undefined;
}

function endOfDayIso(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function startOfDayIso(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function isMissingExportJobsTable(error: { code?: string; message?: string }) {
  return error.code === "42P01" || Boolean(error.message?.includes("export_jobs"));
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsvValue(row: ExportLeadRow, field: ExportFieldKey) {
  if (field === "status") {
    return getLeadStatusOption(row.status).label;
  }

  if (field === "priority") {
    return getLeadPriorityOption(row.priority).label;
  }

  if (field === "source") {
    return getSourceLabel(row.source);
  }

  if (field === "next_follow_up_at" || field === "created_at") {
    return formatDateTime(row[field]);
  }

  return row[field] ?? "";
}

export function generateLeadsCsv(rows: ExportLeadRow[], selectedFields: ExportFieldKey[]) {
  const header = selectedFields.map((field) => EXPORT_FIELD_LABELS[field]);
  const lines = [
    header.map(csvEscape).join(","),
    ...rows.map((row) =>
      selectedFields.map((field) => csvEscape(toCsvValue(row, field))).join(","),
    ),
  ];

  return lines.join("\r\n");
}

async function getLeadIdsForTag(tagId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("lead_tags")
    .select("lead_id,tags!inner(user_id)")
    .eq("tag_id", tagId)
    .eq("tags.user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => item.lead_id as string);
}

async function buildLeadQuery(filters: ExportLeadFilters, countOnly = false) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const tagId = cleanText(filters.tagId);
  const leadIdsForTag = tagId ? await getLeadIdsForTag(tagId) : null;

  if (leadIdsForTag && leadIdsForTag.length === 0) {
    return { emptyByTag: true as const, query: null };
  }

  let query = supabase
    .from("leads")
    .select(
      countOnly
        ? "id"
        : "id,name,phone,email,website,address,category,status,priority,source,note_summary,next_follow_up_at,created_at",
      countOnly ? { count: "exact", head: true } : undefined,
    )
    .eq("user_id", userId)
    .eq("is_archived", false)
    .is("deleted_at", null);

  const status = cleanText(filters.status);
  const source = cleanText(filters.source);
  const fromDate = cleanText(filters.fromDate);
  const toDate = cleanText(filters.toDate);

  if (status) {
    query = query.eq("status", status);
  }

  if (source) {
    query = query.eq("source", source);
  }

  if (leadIdsForTag) {
    query = query.in("id", leadIdsForTag);
  }

  if (fromDate) {
    const iso = startOfDayIso(fromDate);

    if (iso) {
      query = query.gte("created_at", iso);
    }
  }

  if (toDate) {
    const iso = endOfDayIso(toDate);

    if (iso) {
      query = query.lte("created_at", iso);
    }
  }

  if (!countOnly) {
    query = query.order("created_at", { ascending: false }).limit(5000);
  }

  return { emptyByTag: false as const, query };
}

export async function countExportLeads(filters: ExportLeadFilters) {
  const built = await buildLeadQuery(filters, true);

  if (built.emptyByTag || !built.query) {
    return 0;
  }

  const { count, error } = await built.query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getExportLeads(filters: ExportLeadFilters) {
  const built = await buildLeadQuery(filters);

  if (built.emptyByTag || !built.query) {
    return [];
  }

  const { data, error } = await built.query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as ExportLeadRow[];
}

export async function insertExportJob(input: {
  filters: ExportLeadFilters;
  rowCount: number;
  selectedFields: ExportFieldKey[];
}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { error } = await supabase.from("export_jobs").insert({
    export_type: "leads_csv",
    filters: input.filters,
    row_count: input.rowCount,
    selected_fields: input.selectedFields,
    status: "completed",
    user_id: userId,
  });

  if (error) {
    if (isMissingExportJobsTable(error)) {
      return false;
    }

    throw new Error(error.message);
  }

  return true;
}
