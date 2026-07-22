import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import { getAdminOverviewData } from "@/lib/admin/data/overview";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_ADMIN_DASHBOARD, async () =>
    adminJson(await getAdminOverviewData()),
  );
}
