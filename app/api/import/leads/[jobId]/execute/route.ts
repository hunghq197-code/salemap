import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { isDuplicateStrategy } from "@/lib/constants/import";
import { getImportJobById, updateImportJob } from "@/lib/data/import-jobs";
import { executeImportJob } from "@/lib/import/execute-import";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function POST(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "lead-import-execute",
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

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

  if (job.status !== "validated") {
    return NextResponse.json(
      {
        error: "JOB_NOT_VALIDATED",
        message: "Vui lòng kiểm tra dữ liệu trước khi import.",
        success: false,
      },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const duplicateStrategy =
    typeof body === "object" && body && "duplicateStrategy" in body
      ? String(body.duplicateStrategy)
      : "skip";

  if (!isDuplicateStrategy(duplicateStrategy)) {
    return NextResponse.json(
      { error: "INVALID_DUPLICATE_STRATEGY", success: false },
      { status: 400 },
    );
  }

  try {
    const summary = await executeImportJob(job, duplicateStrategy);

    return NextResponse.json({
      data: summary,
      success: true,
    });
  } catch {
    await updateImportJob(job.id, {
      failed_at: new Date().toISOString(),
      status: "failed",
    });

    return NextResponse.json(
      {
        error: "IMPORT_EXECUTE_FAILED",
        message: "Không thể hoàn tất import lúc này. Vui lòng thử lại.",
        success: false,
      },
      { status: 500 },
    );
  }
}
