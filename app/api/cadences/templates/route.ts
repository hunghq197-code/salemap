import { NextResponse } from "next/server";
import {
  createCadenceTemplate,
  getCadenceTemplates,
} from "@/lib/data/cadences";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCadenceTemplateSchema } from "@/lib/validators/cadences";

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

export async function GET(request: Request) {
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const searchParams = new URL(request.url).searchParams;

  try {
    const result = await getCadenceTemplates({
      includeArchived: searchParams.get("includeArchived") === "1",
      limit: Number(searchParams.get("limit") || 50),
      q: searchParams.get("q") || undefined,
    });

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tải quy trình chăm sóc.",
      500,
    );
  }
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "cadence-template-create",
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

  const body = await request.json().catch(() => null);
  const parsed = createCadenceTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const template = await createCadenceTemplate(parsed.data);
    return NextResponse.json({ data: template, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tạo quy trình chăm sóc.",
      500,
    );
  }
}
