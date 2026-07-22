import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { markSubscriptionCancelled } from "@/lib/admin/data/subscriptions";

type AdminSubscriptionRouteProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

export async function POST(request: Request, props: AdminSubscriptionRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION, async () => {
    const { subscriptionId } = await props.params;
    const payload = await request.json().catch(() => ({}));

    return adminJson(
      await markSubscriptionCancelled(subscriptionId, String(payload.note || "")),
    );
  });
}
