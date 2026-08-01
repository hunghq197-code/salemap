import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PaymentStatusBadge } from "@/components/billing/PaymentStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getPaymentByIdForUser,
  getPaymentByOrderCodeForUser,
  toSafeBillingPayment,
} from "@/lib/billing/payments";
import type { SafeBillingPayment } from "@/lib/billing/types";
import { getPaymentStatusPresentation } from "@/lib/design-system/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BillingSuccessPageProps = {
  searchParams?: Promise<{
    orderCode?: string;
    paymentId?: string;
  }>;
};

function parseOrderCode(value?: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function titleForPayment(payment?: SafeBillingPayment | null) {
  if (!payment) return "Không tìm thấy payment";
  if (payment.status === "paid") return "Thanh toán đã được xác nhận";
  if (payment.status === "waiting_confirmation") return "Đang chờ đối soát";
  if (payment.status === "processing") return "Payment đang xử lý";
  if (payment.status === "pending") return "Payment đang chờ xác nhận";
  if (payment.status === "failed" || payment.status === "cancelled") {
    return "Thanh toán chưa hoàn tất";
  }
  return "Trạng thái payment";
}

function textForPayment(payment?: SafeBillingPayment | null) {
  if (!payment) {
    return "Payment không tồn tại hoặc không thuộc tài khoản của bạn.";
  }

  if (payment.status === "paid") {
    return "Server đã xác nhận payment hợp lệ. Subscription và quota sẽ phản ánh theo gói đã mua.";
  }

  if (payment.provider === "payos") {
    return "Trang này chỉ đọc trạng thái. Nếu bạn vừa quay lại từ payOS, hệ thống vẫn cần webhook hợp lệ trước khi kích hoạt gói.";
  }

  return "Trang này chỉ đọc trạng thái. Với chuyển khoản thủ công, admin cần đối soát trước khi kích hoạt gói.";
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

export default async function BillingSuccessPage(props: BillingSuccessPageProps) {
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
  const presentation = getPaymentStatusPresentation(safePayment?.status);
  const Icon = presentation.icon;

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
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-control bg-primary-soft text-primary">
          <Icon aria-hidden="true" className="h-7 w-7" />
        </span>
        <div className="mt-4 flex justify-center">
          <PaymentStatusBadge status={safePayment?.status} />
        </div>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-text-primary">
          {titleForPayment(safePayment)}
        </h1>
        <p className="mt-3 text-base leading-8 text-text-secondary">
          {textForPayment(safePayment)}
        </p>

        {safePayment ? (
          <dl className="mt-6 grid gap-3 rounded-control border border-border-soft bg-surface-muted p-4 text-left text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-text-muted">Gói</dt>
              <dd className="mt-1 font-bold text-text-primary">
                {safePayment.planId === "pro_plus" ? "Pro Plus" : "Pro"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">Số tiền</dt>
              <dd className="mt-1 font-bold text-text-primary">
                {formatCurrency(safePayment.amount)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">Order code</dt>
              <dd className="mt-1 break-all font-mono font-bold text-text-primary">
                {safePayment.orderCode}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">Provider</dt>
              <dd className="mt-1 font-bold text-text-primary">{safePayment.provider}</dd>
            </div>
          </dl>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {safePayment ? (
            <Button
              href={`/app/billing/checkout?paymentId=${safePayment.id}`}
              icon={<ExternalLink className="h-4 w-4" />}
              variant="outline"
            >
              Xem payment
            </Button>
          ) : null}
          <Button href="/app/billing">Về gói dịch vụ</Button>
        </div>
      </Card>
    </div>
  );
}
