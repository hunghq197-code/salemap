import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminSecurityEvents } from "@/lib/admin/data/security";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS, async () =>
    adminJson(await getAdminSecurityEvents(searchParamsToObject(request.url))),
  );
}
