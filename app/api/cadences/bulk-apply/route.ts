import { NextResponse } from "next/server";
import { applyCadenceToLeads } from "@/lib/data/cadences";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyCadenceToLeadsSchema } from "@/lib/validators/cadences";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "cadence-bulk-apply",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = applyCadenceToLeadsSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const result = await applyCadenceToLeads(parsed.data);
    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể áp dụng hàng loạt.",
      500,
    );
  }
}
