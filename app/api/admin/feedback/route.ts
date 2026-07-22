import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import {
  adminJson,
  handleAdminApi,
  searchParamsToObject,
} from "@/lib/admin/api-guard";
import { getAdminFeedback } from "@/lib/admin/data/feedback";

export async function GET(request: Request) {
  return handleAdminApi(request, ADMIN_PERMISSIONS.VIEW_FEEDBACK, async () =>
    adminJson(await getAdminFeedback(searchParamsToObject(request.url))),
  );
}
