import type {
  DuplicateStrategy,
  ImportJobStatus,
} from "@/lib/constants/import";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { FieldMapping } from "@/lib/import/field-mapping";

export type ImportJobRecord = {
  completed_at: string | null;
  created_at: string | null;
  duplicate_rows: number;
  duplicate_strategy: DuplicateStrategy | null;
  error_summary: Record<string, unknown> | null;
  failed_at: string | null;
  failed_rows: number;
  field_mapping: FieldMapping | null;
  file_name: string;
  file_size_bytes: number | null;
  file_type: "csv" | "xlsx" | string;
  id: string;
  imported_rows: number;
  invalid_rows: number;
  sample_rows: Array<Record<string, string>> | null;
  skipped_rows: number;
  started_at: string | null;
  status: ImportJobStatus;
  total_rows: number;
  updated_at: string | null;
  updated_rows: number;
  user_id: string;
  valid_rows: number;
};

export type ImportJobsResult = {
  items: ImportJobRecord[];
  limit: number;
  page: number;
  total: number;
};

function paging(page?: number, limit?: number) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(5, Number(limit) || 10));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return { from, limit: safeLimit, page: safePage, to };
}

export async function createImportJob(input: {
  fieldMapping?: FieldMapping;
  fileName: string;
  fileSizeBytes?: number;
  fileType: "csv" | "xlsx";
  sampleRows?: Array<Record<string, string>>;
  status?: ImportJobStatus;
  totalRows: number;
}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_jobs")
    .insert({
      field_mapping: input.fieldMapping ?? null,
      file_name: input.fileName,
      file_size_bytes: input.fileSizeBytes ?? null,
      file_type: input.fileType,
      sample_rows: input.sampleRows ?? [],
      status: input.status ?? "previewed",
      total_rows: input.totalRows,
      user_id: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ImportJobRecord;
}

export async function getImportJobs(params: { limit?: number; page?: number } = {}) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { from, limit, page, to } = paging(params.page, params.limit);
  const { count, data, error } = await supabase
    .from("import_jobs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (data ?? []) as ImportJobRecord[],
    limit,
    page,
    total: count ?? 0,
  } satisfies ImportJobsResult;
}

export async function getImportJobById(importJobId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_jobs")
    .select("*")
    .eq("id", importJobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? (data as ImportJobRecord) : null;
}

export async function updateImportJob(
  importJobId: string,
  patch: Partial<
    Pick<
      ImportJobRecord,
      | "duplicate_rows"
      | "duplicate_strategy"
      | "error_summary"
      | "failed_rows"
      | "field_mapping"
      | "imported_rows"
      | "invalid_rows"
      | "skipped_rows"
      | "status"
      | "total_rows"
      | "updated_rows"
      | "valid_rows"
    >
  > & {
    completed_at?: string | null;
    failed_at?: string | null;
    started_at?: string | null;
  },
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_jobs")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", importJobId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Không tìm thấy import job.");
  }

  return data as ImportJobRecord;
}

export async function cancelImportJob(importJobId: string) {
  return updateImportJob(importJobId, { status: "cancelled" });
}
