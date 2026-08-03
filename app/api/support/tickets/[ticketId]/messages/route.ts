import { NextResponse } from "next/server";
import { guardMutationRequest } from "@/lib/security/request";
import { userApiError } from "@/lib/security/safe-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { replyToTicketAsUser } from "@/lib/tickets/tickets";

type UserTicketMessageRouteProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function POST(request: Request, props: UserTicketMessageRouteProps) {
  const guardError = guardMutationRequest(request, {
    key: "support-ticket-user-reply",
    limit: 40,
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

  const { ticketId } = await props.params;

  try {
    const result = await replyToTicketAsUser({
      body: await request.json().catch(() => null),
      request,
      ticketId,
      userId,
    });

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return userApiError(error);
  }
}
