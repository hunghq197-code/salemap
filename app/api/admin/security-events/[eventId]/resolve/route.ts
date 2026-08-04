import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { resolveSecurityEvent } from "@/lib/admin/data/security";

type AdminSecurityEventRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function POST(request: Request, props: AdminSecurityEventRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.RESOLVE_SECURITY_EVENTS, async () => {
    const { eventId } = await props.params;
    await resolveSecurityEvent(eventId, request);

    return adminJson({ eventId });
  });
}
