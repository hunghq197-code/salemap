import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import {
  dismissDataQualityIssue,
  resolveDataQualityIssue,
} from "@/lib/leads/data-quality";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    issueId: string;
  }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function PATCH(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "lead-quality-issue-update",
    limit: 60,
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
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const action =
    typeof body === "object" && body && "action" in body ? String(body.action) : "";

  try {
    if (action === "resolve") {
      await resolveDataQualityIssue(params.issueId);
    } else if (action === "dismiss") {
      await dismissDataQualityIssue(params.issueId);
    } else {
      return jsonError("INVALID_ACTION");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "UPDATE_ISSUE_FAILED", 500);
  }
}
