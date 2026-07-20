import { NextResponse } from "next/server";
import {
  deleteSavedView,
  getSavedViewById,
  updateSavedView,
} from "@/lib/data/lead-saved-views";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateSavedViewSchema } from "@/lib/validators/lead-views";

type RouteContext = {
  params: Promise<{
    viewId: string;
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

  const view = await getSavedViewById(params.viewId);

  if (!view) {
    return jsonError("NOT_FOUND", 404);
  }

  return NextResponse.json({ data: view, success: true });
}

export async function PATCH(request: Request, props: RouteContext) {
  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSavedViewSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const view = await updateSavedView(params.viewId, parsed.data);

    return NextResponse.json({ data: view, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "UPDATE_VIEW_FAILED", 500);
  }
}

export async function DELETE(_request: Request, props: RouteContext) {
  const params = await props.params;
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  try {
    await deleteSavedView(params.viewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "DELETE_VIEW_FAILED", 400);
  }
}
