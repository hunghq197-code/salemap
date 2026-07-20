import {
  createAdminDataClient,
  getPaging,
  getParam,
  toListResult,
  todayDate,
  type AdminListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";

export type AdminImportJobRow = {
  created_at: string | null;
  duplicate_rows: number | null;
  failed_rows: number | null;
  file_name: string;
  file_type: string;
  id: string;
  imported_rows: number | null;
  invalid_rows: number | null;
  status: string;
  total_rows: number | null;
  updated_rows: number | null;
  userLabel: string;
  user_id: string;
};

export type AdminImportsKpis = {
  failedJobs: number;
  jobsToday: number;
  topErrorFile: string;
  topImportUser: string;
  totalImportedLeads: number;
  totalJobs: number;
};

function startOfTodayIso() {
  return `${todayDate()}T00:00:00.000Z`;
}

async function getUserLabels(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await createAdminDataClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("user_id,full_name")
    .in("user_id", Array.from(new Set(userIds)));

  return new Map(
    (data ?? []).map((profile) => [
      String(profile.user_id),
      String(profile.full_name || profile.user_id),
    ]),
  );
}

export async function getAdminImports(params?: AdminSearchParams): Promise<{
  kpis: AdminImportsKpis;
  result: AdminListResult<AdminImportJobRow>;
}> {
  const supabase = await createAdminDataClient();
  const { from, limit, page, to } = getPaging(params);

  const { count: totalJobs } = await supabase
    .from("import_jobs")
    .select("id", { count: "exact", head: true });
  const { count: jobsToday } = await supabase
    .from("import_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfTodayIso());
  const { count: failedJobs } = await supabase
    .from("import_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed");
  const { data: allJobs } = await supabase
    .from("import_jobs")
    .select("user_id,file_name,imported_rows,updated_rows,invalid_rows,failed_rows")
    .limit(5000);
  const totalImportedLeads = (allJobs ?? []).reduce(
    (sum, job) => sum + Number(job.imported_rows ?? 0) + Number(job.updated_rows ?? 0),
    0,
  );
  const importedByUser = new Map<string, number>();
  const errorsByFile = new Map<string, number>();

  (allJobs ?? []).forEach((job) => {
    importedByUser.set(
      String(job.user_id),
      (importedByUser.get(String(job.user_id)) ?? 0) +
        Number(job.imported_rows ?? 0) +
        Number(job.updated_rows ?? 0),
    );
    errorsByFile.set(
      String(job.file_name),
      (errorsByFile.get(String(job.file_name)) ?? 0) +
        Number(job.invalid_rows ?? 0) +
        Number(job.failed_rows ?? 0),
    );
  });

  const topUserId =
    Array.from(importedByUser.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const labels = await getUserLabels([
    topUserId,
    ...((allJobs ?? []).map((job) => String(job.user_id)) ?? []),
  ]);

  const status = getParam(params, "status");
  const fileType = getParam(params, "fileType");
  const dateFrom = getParam(params, "dateFrom");
  const dateTo = getParam(params, "dateTo");
  let listQuery = supabase
    .from("import_jobs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  const q = getParam(params, "q")?.trim();

  if (status) {
    listQuery = listQuery.eq("status", status);
  }

  if (fileType) {
    listQuery = listQuery.eq("file_type", fileType);
  }

  if (dateFrom) {
    listQuery = listQuery.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  }

  if (dateTo) {
    listQuery = listQuery.lte("created_at", `${dateTo}T23:59:59.999Z`);
  }

  if (q) {
    listQuery = listQuery.or(`file_name.ilike.%${q}%,user_id.eq.${q}`);
  }

  const { count, data, error } = await listQuery.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rowLabels = await getUserLabels((data ?? []).map((job) => String(job.user_id)));
  const items = ((data ?? []) as AdminImportJobRow[]).map((job) => ({
    ...job,
    userLabel: rowLabels.get(job.user_id) || job.user_id,
  }));

  return {
    kpis: {
      failedJobs: failedJobs ?? 0,
      jobsToday: jobsToday ?? 0,
      topErrorFile: Array.from(errorsByFile.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-",
      topImportUser: labels.get(topUserId) || topUserId || "-",
      totalImportedLeads,
      totalJobs: totalJobs ?? 0,
    },
    result: toListResult(items, count ?? 0, page, limit),
  };
}
