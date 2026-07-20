import { NextResponse } from "next/server";
import { createSavedView, getSavedViews } from "@/lib/data/lead-saved-views";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSavedViewSchema } from "@/lib/validators/lead-views";

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

  const url = new URL(request.url);
  const views = await getSavedViews({
    pinned: url.searchParams.get("pinned") === "true",
    type: url.searchParams.get("type") || undefined,
  });

  return NextResponse.json({ data: views, success: true });
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = createSavedViewSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("INVALID_PAYLOAD");
  }

  try {
    const view = await createSavedView(parsed.data);

    return NextResponse.json({ data: view, success: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "CREATE_VIEW_FAILED", 500);
  }
}
