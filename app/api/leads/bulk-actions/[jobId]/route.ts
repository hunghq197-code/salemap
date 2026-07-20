import { NextResponse } from "next/server";
import { getBulkActionJobById } from "@/lib/leads/bulk-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, props: RouteContext) {
  const params = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const job = await getBulkActionJobById(params.jobId);

  if (!job) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: job, success: true });
}
