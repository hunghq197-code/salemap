import { NextResponse } from "next/server";
import { mergeLeads } from "@/lib/leads/merge-leads";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mergeLeadsSchema } from "@/lib/validators/lead-cleanup";

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
  const parsed = mergeLeadsSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const data = await mergeLeads(parsed.data);

    return NextResponse.json({ data, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "MERGE_LEADS_FAILED", 500);
  }
}
