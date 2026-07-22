import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import {
  removeUserQuotaOverride,
  setUserQuotaOverride,
} from "@/lib/admin/data/quotas";

type AdminUserQuotaRouteProps = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(request: Request, props: AdminUserQuotaRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_QUOTA, async () => {
    const { userId } = await props.params;
    const payload = await request.json().catch(() => ({}));
    await setUserQuotaOverride({ ...payload, userId }, request);

    return adminJson({ userId });
  });
}

export async function DELETE(request: Request, props: AdminUserQuotaRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_QUOTA, async () => {
    const { userId } = await props.params;
    await removeUserQuotaOverride(userId, request);

    return adminJson({ userId });
  });
}
