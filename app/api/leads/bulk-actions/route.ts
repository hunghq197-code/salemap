import { NextResponse } from "next/server";
import { runBulkAction } from "@/lib/leads/bulk-actions";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bulkActionSchema } from "@/lib/validators/lead-cleanup";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "lead-bulk-actions",
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = bulkActionSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const result = await runBulkAction(parsed.data);

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "BULK_ACTION_FAILED", 500);
  }
}
