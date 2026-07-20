import { NextResponse } from "next/server";
import { createGoalFromTemplate, getGoalTemplates } from "@/lib/data/sales-goals";
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
