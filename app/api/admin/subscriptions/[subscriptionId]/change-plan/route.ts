import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { changePlan } from "@/lib/billing/subscriptions";
import { SafeError } from "@/lib/security/safe-error";

type AdminSubscriptionRouteProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

export async function POST(request: Request, props: AdminSubscriptionRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION, async (admin) => {
    const { subscriptionId } = await props.params;
    const payload = await request.json().catch(() => ({}));

    const planId = String(payload.planId || payload.planKey || "");

    if (!planId) {
      throw new SafeError("VALIDATION_ERROR", 400);
    }

    return adminJson(
      await changePlan({
        adminUser: admin,
        note: String(payload.note || ""),
        planId: planId === "free_beta" ? "free" : planId,
        subscriptionId,
      }),
    );
  });
}
