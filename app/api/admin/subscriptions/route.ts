import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminSubscriptions } from "@/lib/admin/data/subscriptions";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_SUBSCRIPTIONS, async () =>
    adminJson(await getAdminSubscriptions(searchParamsToObject(request.url))),
  );
}
