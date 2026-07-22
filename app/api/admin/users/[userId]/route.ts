import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { getAdminUserDetail } from "@/lib/admin/data/users";
import { SafeError } from "@/lib/security/safe-error";

type AdminUserRouteProps = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, props: AdminUserRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_USER_DETAIL, async () => {
    const { userId } = await props.params;
    const user = await getAdminUserDetail(userId, { reason: "admin_api_user_detail" });

    if (!user) {
      throw new SafeError("NOT_FOUND", 404);
    }

    return adminJson(user);
  });
}
