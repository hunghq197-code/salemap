import { NextResponse } from "next/server";
import { AdminAuthError } from "@/lib/admin/auth";
import { syncAdminPaymentGatewayTransaction } from "@/lib/admin/data/payment-gateway";
import { PayOSConfigError } from "@/lib/providers/payments";

type AdminPaymentGatewaySyncRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export async function POST(_request: Request, props: AdminPaymentGatewaySyncRouteProps) {
  const params = await props.params;
  try {
    const transaction = await syncAdminPaymentGatewayTransaction(params.id);

    return NextResponse.json({
      data: { transaction },
      success: true,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return errorResponse(error.message, "Bạn không có quyền thao tác.", error.status);
    }

    if (error instanceof PayOSConfigError) {
      return errorResponse(
        "PAYOS_NOT_CONFIGURED",
        "Chưa cấu hình payOS nên chưa thể đồng bộ trạng thái.",
        503,
      );
    }

    return errorResponse(
      "PAYOS_ADMIN_SYNC_FAILED",
      "Không thể đồng bộ trạng thái giao dịch lúc này.",
      500,
    );
  }
}
