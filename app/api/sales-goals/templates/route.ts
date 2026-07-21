import { NextResponse } from "next/server";
import { createGoalFromTemplate, getGoalTemplates } from "@/lib/data/sales-goals";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { goalTemplateSchema } from "@/lib/validators/sales-analytics";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  return NextResponse.json({ data: getGoalTemplates(), success: true });
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "sales-goal-template-create",
    limit: 30,
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
  const parsed = goalTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const goal = await createGoalFromTemplate(parsed.data.templateKey);
    return NextResponse.json({ data: goal, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "CREATE_TEMPLATE_GOAL_FAILED", 500);
  }
}
