import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { getAdminSubscriptions } from "@/lib/admin/data/subscriptions";
import { SafeError } from "@/lib/security/safe-error";

type AdminSubscriptionRouteProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

export async function GET(request: Request, props: AdminSubscriptionRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_SUBSCRIPTIONS, async () => {
    const { subscriptionId } = await props.params;
    const subscriptions = await getAdminSubscriptions();
    const subscription = subscriptions.items.find((item) => item.id === subscriptionId);

    if (!subscription) {
      throw new SafeError("NOT_FOUND", 404);
    }

    return adminJson(subscription);
  });
}
