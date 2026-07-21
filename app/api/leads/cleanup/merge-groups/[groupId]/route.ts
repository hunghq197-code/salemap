import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { dismissMergeGroup, getMergeGroupById } from "@/lib/leads/merge-leads";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dismissMergeGroupSchema } from "@/lib/validators/lead-cleanup";

type RouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

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

export async function GET(_request: Request, props: RouteContext) {
  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const group = await getMergeGroupById(params.groupId);

  if (!group) {
    return jsonError("NOT_FOUND", 404);
  }

  return NextResponse.json({ data: group, success: true });
}

export async function PATCH(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "lead-merge-group-update",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = dismissMergeGroupSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    await dismissMergeGroup(params.groupId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "DISMISS_GROUP_FAILED", 500);
  }
}
