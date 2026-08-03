import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminCustomers } from "@/lib/admin/data/customers";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_CUSTOMERS, async () =>
    adminJson(await getAdminCustomers(searchParamsToObject(request.url))),
  );
}
