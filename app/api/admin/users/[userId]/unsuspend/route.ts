import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { updateAdminUserAccountStatus } from "@/lib/admin/data/users";

type AdminUserStatusRouteProps = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(request: Request, props: AdminUserStatusRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.UPDATE_USER_STATUS, async () => {
    const { userId } = await props.params;
    const body = await request.json().catch(() => ({}));

    return adminJson(
      await updateAdminUserAccountStatus(userId, "active", {
        reason: typeof body?.reason === "string" ? body.reason : "",
        request,
      }),
    );
  });
}
