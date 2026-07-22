import { NextResponse } from "next/server";
import { pauseLeadCadence } from "@/lib/data/cadences";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leadCadenceMutationSchema } from "@/lib/validators/cadences";

type RouteContext = {
  params: Promise<{
    leadCadenceId: string;
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

export async function POST(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "lead-cadence-pause",
    limit: 80,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const params = await props.params;
  const body = await request.json().catch(() => ({}));
  const parsed = leadCadenceMutationSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const cadence = await pauseLeadCadence(params.leadCadenceId, parsed.data);
    return NextResponse.json({ data: cadence, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tạm dừng quy trình.",
      500,
    );
  }
}
