import type { ImportRowStatus } from "@/lib/constants/import";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import type { ImportValidationError } from "@/lib/import/validate-import-row";

export type ImportRowRecord = {
  created_at: string | null;
  duplicate_lead_id: string | null;
  id: string;
  import_job_id: string;
  imported_lead_id: string | null;
  mapped_data: Record<string, unknown> | null;
  raw_data: Record<string, string>;
  row_index: number;
  status: ImportRowStatus;
  updated_at: string | null;
  user_id: string;
  validation_errors: ImportValidationError[] | null;
};

export type ImportRowsResult = {
  items: ImportRowRecord[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

function paging(page?: number, limit?: number) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(10, Number(limit) || 50));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return { from, limit: safeLimit, page: safePage, to };
}

export async function createImportRows(
  importJobId: string,
  rows: Array<{ rawData: Record<string, string>; rowIndex: number }>,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const batchSize = 500;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await supabase.from("import_rows").insert(
      batch.map((row) => ({
        import_job_id: importJobId,
        raw_data: row.rawData,
        row_index: row.rowIndex,
        status: "pending",
        user_id: userId,
      })),
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function getImportRows(
  importJobId: string,
  params: { limit?: number; page?: number; status?: string } = {},
): Promise<ImportRowsResult> {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { from, limit, page, to } = paging(params.page, params.limit);
  let query = supabase
    .from("import_rows")
    .select("*", { count: "exact" })
    .eq("import_job_id", importJobId)
    .eq("user_id", userId);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { count, data, error } = await query.order("row_index", { ascending: true }).range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (data ?? []) as ImportRowRecord[],
    limit,
    page,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function getAllImportRows(
  importJobId: string,
  statuses?: ImportRowStatus[],
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const allRows: ImportRowRecord[] = [];
  const batchSize = 1000;
  let from = 0;

  while (true) {
    let query = supabase
      .from("import_rows")
      .select("*")
      .eq("import_job_id", importJobId)
      .eq("user_id", userId)
      .order("row_index", { ascending: true })
      .range(from, from + batchSize - 1);

    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as ImportRowRecord[];
    allRows.push(...rows);

    if (rows.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  return allRows;
}

export async function updateImportRow(
  rowId: string,
  patch: Partial<
    Pick<
      ImportRowRecord,
      | "duplicate_lead_id"
      | "imported_lead_id"
      | "mapped_data"
      | "status"
      | "validation_errors"
    >
  >,
) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { error } = await supabase
    .from("import_rows")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rowId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getImportRowsSummary(importJobId: string) {
  const rows = await getAllImportRows(importJobId);

  return rows.reduce(
    (summary, row) => {
      summary.totalRows += 1;
      if (row.status === "valid") summary.validRows += 1;
      if (row.status === "invalid") summary.invalidRows += 1;
      if (row.status === "duplicate") summary.duplicateRows += 1;
      if (row.status === "imported") summary.importedRows += 1;
      if (row.status === "skipped") summary.skippedRows += 1;
      if (row.status === "updated") summary.updatedRows += 1;
      if (row.status === "failed") summary.failedRows += 1;
      return summary;
    },
    {
      duplicateRows: 0,
      failedRows: 0,
      importedRows: 0,
      invalidRows: 0,
      skippedRows: 0,
      totalRows: 0,
      updatedRows: 0,
      validRows: 0,
    },
  );
}
