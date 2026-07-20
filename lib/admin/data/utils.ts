import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export type AdminSearchParams = Record<string, string | string[] | undefined>;

export type AdminListResult<T> = {
  items: T[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export function getParam(params: AdminSearchParams | undefined, key: string) {
  const value = params?.[key];

  return Array.isArray(value) ? value[0] : value;
}

export function getPaging(params?: AdminSearchParams) {
  const page = Math.max(1, Number(getParam(params, "page")) || 1);
  const limit = Math.min(50, Math.max(5, Number(getParam(params, "limit")) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { from, limit, page, to };
}

export function toListResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): AdminListResult<T> {
  return {
    items,
    limit,
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function createAdminDataClient() {
  await requireAdmin();

  return createSupabaseAdminClient();
}

export async function safeCount(table: string) {
  const supabase = await createAdminDataClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  const result = new Map<string, number>();

  rows.forEach((row) => {
    const value = row[key];

    if (typeof value === "string" && value) {
      result.set(value, (result.get(value) ?? 0) + 1);
    }
  });

  return result;
}

export function distinctUserCount(rows: Array<{ user_id?: string | null }>) {
  return new Set(rows.map((row) => row.user_id).filter(Boolean)).size;
}

export function formatPercent(part: number, base: number) {
  if (base <= 0) {
    return 0;
  }

  return Math.round((part / base) * 100);
}
