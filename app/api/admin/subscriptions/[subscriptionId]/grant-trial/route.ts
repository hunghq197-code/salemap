import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { grantTrial } from "@/lib/billing/subscriptions";

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
      await grantTrial({
        adminUser: admin,
        days: Math.max(1, Math.min(90, Number(payload.days ?? 14) || 14)),
        note: String(payload.note || ""),
        planId: String(payload.planId || "pro"),
        subscriptionId,
      }),
    );
  });
}
