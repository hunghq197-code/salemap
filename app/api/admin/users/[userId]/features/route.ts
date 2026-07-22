import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import {
  removeUserFeatureOverride,
  setUserFeatureOverride,
} from "@/lib/admin/data/quotas";

type AdminUserFeaturesRouteProps = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(request: Request, props: AdminUserFeaturesRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_QUOTA, async () => {
    const { userId } = await props.params;
    const payload = await request.json().catch(() => ({}));
    await setUserFeatureOverride({ ...payload, userId }, request);

    return adminJson({ userId });
  });
}

export async function DELETE(request: Request, props: AdminUserFeaturesRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_QUOTA, async () => {
    const { userId } = await props.params;
    await removeUserFeatureOverride(userId, request);

    return adminJson({ userId });
  });
}
