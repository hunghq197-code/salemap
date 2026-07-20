import type { LeadFiltersInput } from "@/lib/validators/lead-views";

export type LeadFilters = {
  archived?: boolean;
  category?: string[];
  createdFrom?: string;
  createdTo?: string;
  deleted?: boolean;
  followUp?: "future" | "overdue" | "this_week" | "today" | "today_or_overdue";
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  noFollowUp?: boolean;
  priority?: string[];
  q?: string;
  source?: string[];
  staleDays?: number;
  status?: string[];
  tagIds?: string[];
  tagNames?: string[];
};

type QueryLike = {
  eq: (column: string, value: unknown) => QueryLike;
  gte: (column: string, value: unknown) => QueryLike;
  ilike: (column: string, value: unknown) => QueryLike;
  in: (column: string, values: unknown[]) => QueryLike;
  is: (column: string, value: unknown) => QueryLike;
  lt: (column: string, value: unknown) => QueryLike;
  lte: (column: string, value: unknown) => QueryLike;
  not: (column: string, operator: string, value: unknown) => QueryLike;
  or: (filters: string) => QueryLike;
};

function cleanString(value?: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanArray(value?: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.map((item) => cleanString(item)).filter(Boolean)),
  );
}

function boolFromParam(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value;

  if (text === "1" || text === "true") return true;
  if (text === "0" || text === "false") return false;
  return undefined;
}

function arrayFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
  }

  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  date.setMilliseconds(date.getMilliseconds() - 1);
  return date;
}

function endOfWeek() {
  const date = startOfToday();
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday + 1);
  date.setMilliseconds(date.getMilliseconds() - 1);
  return date;
}

export function normalizeLeadFilters(input: LeadFiltersInput | LeadFilters = {}): LeadFilters {
  return {
    archived: input.archived ?? false,
    category: cleanArray(input.category),
    createdFrom: cleanString(input.createdFrom) || undefined,
    createdTo: cleanString(input.createdTo) || undefined,
    deleted: input.deleted ?? false,
    followUp: input.followUp,
    hasEmail: input.hasEmail,
    hasPhone: input.hasPhone,
    hasWebsite: input.hasWebsite,
    noFollowUp: input.noFollowUp,
    priority: cleanArray(input.priority),
    q: cleanString(input.q) || undefined,
    source: cleanArray(input.source),
    staleDays: input.staleDays ? Math.min(365, Math.max(1, Number(input.staleDays))) : undefined,
    status: cleanArray(input.status),
    tagIds: cleanArray(input.tagIds),
    tagNames: cleanArray(input.tagNames),
  };
}

export function deserializeLeadFilters(
  searchParams?: Record<string, string | string[] | undefined>,
): LeadFilters {
  return normalizeLeadFilters({
    archived: boolFromParam(searchParams?.archived),
    category: arrayFromParam(searchParams?.category),
    createdFrom: cleanString(Array.isArray(searchParams?.createdFrom) ? searchParams?.createdFrom[0] : searchParams?.createdFrom) || undefined,
    createdTo: cleanString(Array.isArray(searchParams?.createdTo) ? searchParams?.createdTo[0] : searchParams?.createdTo) || undefined,
    deleted: boolFromParam(searchParams?.deleted),
    followUp: cleanString(Array.isArray(searchParams?.followUp) ? searchParams?.followUp[0] : searchParams?.followUp) as LeadFilters["followUp"],
    hasEmail: boolFromParam(searchParams?.hasEmail),
    hasPhone: boolFromParam(searchParams?.hasPhone),
    hasWebsite: boolFromParam(searchParams?.hasWebsite),
    noFollowUp: boolFromParam(searchParams?.noFollowUp),
    priority: arrayFromParam(searchParams?.priority),
    q: cleanString(Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q) || undefined,
    source: arrayFromParam(searchParams?.source),
    staleDays: Number(Array.isArray(searchParams?.staleDays) ? searchParams?.staleDays[0] : searchParams?.staleDays) || undefined,
    status: arrayFromParam(searchParams?.status),
    tagIds: arrayFromParam(searchParams?.tagIds ?? searchParams?.tagId),
  });
}

export function serializeLeadFilters(filters: LeadFilters) {
  const normalized = normalizeLeadFilters(filters);
  const params = new URLSearchParams();

  Object.entries(normalized).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(","));
    } else if (typeof value === "boolean") {
      if (value) params.set(key, "1");
    } else if (value !== undefined && value !== null && String(value) !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export function validateLeadFilters(filters: LeadFilters) {
  return normalizeLeadFilters(filters);
}

export function buildLeadFilterQuery<T extends QueryLike>(
  baseQuery: T,
  filters: LeadFilters,
  userId: string,
): T {
  const normalized = normalizeLeadFilters(filters);
  let query: QueryLike = baseQuery.eq("user_id", userId);

  if (normalized.deleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);

    if (normalized.archived) {
      query = query.eq("is_archived", true);
    } else {
      query = query.eq("is_archived", false);
    }
  }

  if (normalized.q) {
    const q = normalized.q.replace(/[%_,]/g, " ");
    query = query.or(
      `name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,website.ilike.%${q}%,address.ilike.%${q}%,category.ilike.%${q}%`,
    );
  }

  if (normalized.status && normalized.status.length > 0) {
    query = query.in("status", normalized.status);
  }

  if (normalized.priority && normalized.priority.length > 0) {
    query = query.in("priority", normalized.priority);
  }

  if (normalized.source && normalized.source.length > 0) {
    query = query.in("source", normalized.source);
  }

  if (normalized.category && normalized.category.length > 0) {
    query = query.in("category", normalized.category);
  }

  if (normalized.createdFrom) {
    query = query.gte("created_at", `${normalized.createdFrom}T00:00:00.000Z`);
  }

  if (normalized.createdTo) {
    query = query.lte("created_at", `${normalized.createdTo}T23:59:59.999Z`);
  }

  if (normalized.followUp) {
    const todayStart = startOfToday().toISOString();
    const todayEnd = endOfToday().toISOString();

    if (normalized.followUp === "today") {
      query = query.gte("next_follow_up_at", todayStart).lte("next_follow_up_at", todayEnd);
    } else if (normalized.followUp === "overdue") {
      query = query.lt("next_follow_up_at", todayStart);
    } else if (normalized.followUp === "today_or_overdue") {
      query = query.lte("next_follow_up_at", todayEnd);
    } else if (normalized.followUp === "this_week") {
      query = query.gte("next_follow_up_at", todayStart).lte("next_follow_up_at", endOfWeek().toISOString());
    } else if (normalized.followUp === "future") {
      query = query.gte("next_follow_up_at", todayEnd);
    }
  }

  if (normalized.noFollowUp) {
    query = query.is("next_follow_up_at", null);
  }

  if (normalized.staleDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - normalized.staleDays);
    query = query.lte("updated_at", cutoff.toISOString()).not("status", "in", "(won,lost,not_fit)");
  }

  if (normalized.hasPhone === true) {
    query = query.not("phone", "is", null);
  } else if (normalized.hasPhone === false) {
    query = query.is("phone", null);
  }

  if (normalized.hasEmail === true) {
    query = query.not("email", "is", null);
  } else if (normalized.hasEmail === false) {
    query = query.is("email", null);
  }

  if (normalized.hasWebsite === true) {
    query = query.not("website", "is", null);
  } else if (normalized.hasWebsite === false) {
    query = query.is("website", null);
  }

  return query as T;
}

export function getLeadFilterSummary(filters: LeadFilters) {
  const normalized = normalizeLeadFilters(filters);
  const chips: string[] = [];

  if (normalized.status?.length) chips.push(`Status: ${normalized.status.join(", ")}`);
  if (normalized.priority?.length) chips.push(`Uu tien: ${normalized.priority.join(", ")}`);
  if (normalized.tagIds?.length) chips.push(`Tag: ${normalized.tagIds.length} tag`);
  if (normalized.source?.length) chips.push(`Nguon: ${normalized.source.join(", ")}`);
  if (normalized.category?.length) chips.push(`Nganh: ${normalized.category.join(", ")}`);
  if (normalized.followUp) chips.push(`Follow-up: ${normalized.followUp}`);
  if (normalized.noFollowUp) chips.push("Chua co follow-up");
  if (normalized.staleDays) chips.push(`Lau chua cham soc: ${normalized.staleDays} ngay`);
  if (normalized.hasPhone === true) chips.push("Co so dien thoai");
  if (normalized.hasEmail === true) chips.push("Co email");
  if (normalized.archived) chips.push("Da luu tru");
  if (normalized.deleted) chips.push("Da xoa mem");

  return chips.length > 0 ? chips : ["Tat ca lead dang hoat dong"];
}
