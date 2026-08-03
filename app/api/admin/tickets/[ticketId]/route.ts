import { NextResponse } from "next/server";
import { updateSupportTicketAsAdmin } from "@/lib/tickets/tickets";
import { guardMutationRequest } from "@/lib/security/request";
import { adminApiError } from "@/lib/security/safe-error";

type AdminTicketRouteProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function PATCH(request: Request, props: AdminTicketRouteProps) {
  const guardError = guardMutationRequest(request, {
    key: "admin-ticket-update",
    limit: 80,
    windowMs: 10 * 60 * 1000,
  });

  if (guardError) {
    return guardError;
  }

  const { ticketId } = await props.params;

  try {
    const result = await updateSupportTicketAsAdmin({
      body: await request.json().catch(() => null),
      request,
      ticketId,
    });

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    return adminApiError(error);
  }
}
