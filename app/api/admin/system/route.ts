import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { checkSystemHealth } from "@/lib/admin/system-health";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_SYSTEM_HEALTH, async () =>
    adminJson(await checkSystemHealth()),
  );
}
