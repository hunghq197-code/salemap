import { NextResponse } from "next/server";
import { replyToTicketAsAdmin } from "@/lib/tickets/tickets";
import { guardMutationRequest } from "@/lib/security/request";
import { adminApiError } from "@/lib/security/safe-error";

type AdminTicketMessageRouteProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function POST(request: Request, props: AdminTicketMessageRouteProps) {
  const guardError = guardMutationRequest(request, {
    key: "admin-ticket-reply",
    limit: 80,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const { ticketId } = await props.params;

  try {
    const result = await replyToTicketAsAdmin({
      body: await request.json().catch(() => null),
      request,
      ticketId,
    });

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return adminApiError(error);
  }
}
