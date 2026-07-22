import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminPaymentRequests } from "@/lib/admin/data/payment-requests";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_PAYMENTS, async () =>
    adminJson(await getAdminPaymentRequests(searchParamsToObject(request.url))),
  );
}
