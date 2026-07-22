import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminBillingPayments } from "@/lib/admin/data/billing-payments";
import { getAdminPaymentRequests } from "@/lib/admin/data/payment-requests";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_PAYMENTS, async () => {
    const params = searchParamsToObject(request.url);
    const [payments, legacyPaymentRequests] = await Promise.all([
      getAdminBillingPayments(params),
      getAdminPaymentRequests(params),
    ]);

    return adminJson({
      items: payments.items,
      legacyPaymentRequests: legacyPaymentRequests.items,
      schemaReady: payments.schemaReady || legacyPaymentRequests.schemaReady,
    });
  });
}
