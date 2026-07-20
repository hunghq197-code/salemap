import { NextResponse } from "next/server";
import { getImportJobById, updateImportJob } from "@/lib/data/import-jobs";
import { sanitizeFieldMapping } from "@/lib/import/field-mapping";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function POST(request: Request, props: RouteContext) {
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

  const body = await request.json().catch(() => null);
  const rawMapping =
    typeof body === "object" && body && "fieldMapping" in body
      ? (body.fieldMapping as Record<string, unknown>)
      : {};
  const fieldMapping = sanitizeFieldMapping(rawMapping);

  await updateImportJob(job.id, {
    field_mapping: fieldMapping,
    status: "mapped",
  });

  return NextResponse.json({
    data: {
      fieldMapping,
    },
    success: true,
  });
}
