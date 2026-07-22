import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminUsers } from "@/lib/admin/data/users";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_USERS, async () =>
    adminJson(await getAdminUsers(searchParamsToObject(request.url))),
  );
}
