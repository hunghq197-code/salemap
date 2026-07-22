import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminUsage } from "@/lib/admin/data/usage";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_USAGE, async () =>
    adminJson(await getAdminUsage(searchParamsToObject(request.url))),
  );
}
