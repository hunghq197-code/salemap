import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { adminJson, handleAdminApi } from "@/lib/admin/api-guard";
import {
  getAdminCustomerDetail,
  updateCustomerLifecycle,
} from "@/lib/admin/data/customers";
import { SafeError } from "@/lib/security/safe-error";

type AdminCustomerRouteProps = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, props: AdminCustomerRouteProps) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_CUSTOMER_DETAIL, async () => {
    const { userId } = await props.params;
    const customer = await getAdminCustomerDetail(userId);

    if (!customer) {
      throw new SafeError("NOT_FOUND", 404);
    }

    return adminJson(customer);
  });
}

export async function PATCH(request: Request, props: AdminCustomerRouteProps) {
  return handleAdminApi(
    request,
    ADMIN_PERMISSIONS.MANAGE_CUSTOMER_LIFECYCLE,
    async () => {
      const { userId } = await props.params;
      const payload = await request.json().catch(() => ({}));
      const formData = new FormData();

      formData.set("lifecycle", String(payload.lifecycle || ""));
      formData.set("reason", String(payload.reason || ""));
      await updateCustomerLifecycle({ formData, request, userId });

      return adminJson({ userId });
    },
  );
}
