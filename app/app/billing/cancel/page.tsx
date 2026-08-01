import { ArrowLeft, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { PaymentStatusBadge } from "@/components/billing/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getPaymentByIdForUser,
  getPaymentByOrderCodeForUser,
  toSafeBillingPayment,
} from "@/lib/billing/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BillingCancelPageProps = {
  searchParams?: Promise<{
    orderCode?: string;
    paymentId?: string;
  }>;
};

function parseOrderCode(value?: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function BillingCancelPage(props: BillingCancelPageProps) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const orderCode = parseOrderCode(searchParams?.orderCode);
  const payment = user
    ? searchParams?.paymentId
      ? await getPaymentByIdForUser(searchParams.paymentId, user.id)
      : orderCode
        ? await getPaymentByOrderCodeForUser(orderCode, user.id)
        : null
    : null;
  const safePayment = payment ? toSafeBillingPayment(payment) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-text-primary"
        href="/app/billing"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại gói dịch vụ
      </Link>

      <Card className="mt-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-control bg-danger-soft text-danger">
          <XCircle aria-hidden="true" className="h-7 w-7" />
        </span>
        <div className="mt-4 flex justify-center">
          <PaymentStatusBadge status={safePayment?.status || "cancelled"} />
        </div>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-text-primary">
          Thanh toán chưa hoàn tất
        </h1>
        <p className="mt-3 text-base leading-8 text-text-secondary">
          Gói hiện tại của bạn chưa thay đổi. Trang này không tự tạo payment mới và không kích
          hoạt subscription.
        </p>

        {safePayment ? (
          <p className="mt-6 rounded-control border border-border-soft bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-text-secondary">
            Order code: <span className="font-mono text-text-primary">{safePayment.orderCode}</span>{" "}
            · Trạng thái hiện tại: {safePayment.status}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {safePayment ? (
            <Button
              href={`/app/billing/checkout?paymentId=${safePayment.id}`}
              icon={<RotateCcw className="h-4 w-4" />}
              variant="outline"
            >
              Thử lại payment này
            </Button>
          ) : null}
          <Button href="/app/billing">Chọn phương thức khác</Button>
        </div>
      </Card>
    </div>
  );
}
