import { NextResponse } from "next/server";
import {
  archiveCadenceTemplate,
  CadenceError,
  getCadenceTemplateById,
  updateCadenceTemplate,
} from "@/lib/data/cadences";
import { guardMutationRequest } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCadenceTemplateSchema } from "@/lib/validators/cadences";

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

export async function GET(_request: Request, props: RouteContext) {
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const params = await props.params;

  try {
    const template = await getCadenceTemplateById(params.cadenceId);
    return NextResponse.json({ data: template, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể tải quy trình chăm sóc.",
      500,
    );
  }
}

export async function PUT(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "cadence-template-update",
    limit: 40,
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
  const body = await request.json().catch(() => null);
  const parsed = updateCadenceTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const template = await updateCadenceTemplate(params.cadenceId, parsed.data);
    return NextResponse.json({ data: template, success: true });
  } catch (error) {
    if (error instanceof CadenceError) {
      return jsonError(error.message, 409);
    }

    return jsonError(
      error instanceof Error ? error.message : "Không thể cập nhật quy trình.",
      500,
    );
  }
}

export async function DELETE(request: Request, props: RouteContext) {
  const guardError = guardMutationRequest(request, {
    key: "cadence-template-delete",
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
    const template = await archiveCadenceTemplate(params.cadenceId);
    return NextResponse.json({ data: template, success: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Không thể lưu trữ quy trình.",
      500,
    );
  }
}
