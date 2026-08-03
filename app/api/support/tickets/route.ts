import { NextResponse } from "next/server";
import { createSupportTicketForUser } from "@/lib/tickets/tickets";
import { guardMutationRequest } from "@/lib/security/request";
import { userApiError } from "@/lib/security/safe-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function POST(request: Request) {
  const guardError = guardMutationRequest(request, {
    key: "support-ticket-create",
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const userId = await requireUserId();

  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Bạn cần đăng nhập." }, success: false },
      { status: 401 },
    );
  }

  try {
    const ticket = await createSupportTicketForUser({
      body: await request.json().catch(() => null),
      request,
      userId,
    });

    return NextResponse.json({ data: ticket, success: true });
  } catch (error) {
    return userApiError(error);
  }
}
