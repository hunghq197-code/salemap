import { NextResponse } from "next/server";
import { IMPORT_ROW_STATUSES } from "@/lib/constants/import";
import { getImportJobById } from "@/lib/data/import-jobs";
import { getImportRows } from "@/lib/data/import-rows";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(request: Request, props: RouteContext) {
  const params = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", success: false }, { status: 401 });
  }

  const job = await getImportJobById(params.jobId);

  if (!job) {
    return NextResponse.json({ error: "NOT_FOUND", success: false }, { status: 404 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const page = Number(url.searchParams.get("page") || 1);
  const allowedStatus = status && IMPORT_ROW_STATUSES.includes(status as never) ? status : undefined;
  const rows = await getImportRows(job.id, {
    page,
    status: allowedStatus,
  });

  return NextResponse.json({
    data: rows,
    success: true,
  });
}
