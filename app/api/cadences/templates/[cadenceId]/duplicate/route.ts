import { NextResponse } from "next/server";
import { duplicateCadenceTemplate } from "@/lib/data/cadences";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    cadenceId: string;
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
    key: "cadence-template-duplicate",
    limit: 30,
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

  try {
    const template = await duplicateCadenceTemplate(params.cadenceId);
    return NextResponse.json({ data: template, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể nhân bản quy trình.",
      500,
    );
  }
}
