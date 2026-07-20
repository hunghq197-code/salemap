import { NextResponse } from "next/server";
import { updateLeadStatusFromPipeline } from "@/lib/data/lead-pipeline";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updatePipelineStatusSchema } from "@/lib/validators/lead-views";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = updatePipelineStatusSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const lead = await updateLeadStatusFromPipeline(parsed.data);

    return NextResponse.json({ data: lead, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "UPDATE_STATUS_FAILED", 500);
  }
}
