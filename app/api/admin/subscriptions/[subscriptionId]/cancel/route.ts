import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { cancelSubscription } from "@/lib/billing/subscriptions";

type AdminSubscriptionRouteProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

export async function POST(request: Request, props: AdminSubscriptionRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION, async (admin) => {
    const { subscriptionId } = await props.params;
    const payload = await request.json().catch(() => ({}));

    return adminJson(
      await cancelSubscription({
        adminUser: admin,
        reason: String(payload.note || payload.reason || ""),
        subscriptionId,
      }),
    );
  });
}
