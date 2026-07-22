import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminQuotaOverrides } from "@/lib/admin/data/quotas";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_USAGE, async () =>
    adminJson(await getAdminQuotaOverrides(searchParamsToObject(request.url))),
  );
}
