import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { changeSubscriptionPlan } from "@/lib/admin/data/subscriptions";
import { SafeError } from "@/lib/security/safe-error";

type AdminSubscriptionRouteProps = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

export async function POST(request: Request, props: AdminSubscriptionRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_SUBSCRIPTION, async () => {
    const { subscriptionId } = await props.params;
    const payload = await request.json().catch(() => ({}));

    if (!payload.planKey || typeof payload.planKey !== "string") {
      throw new SafeError("VALIDATION_ERROR", 400);
    }

    return adminJson(
      await changeSubscriptionPlan(subscriptionId, payload.planKey, {
        months: Number(payload.months ?? 1),
        note: String(payload.note || ""),
      }),
    );
  });
}
