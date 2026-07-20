import { ArrowLeft, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import Link from "next/link";
import { PayOSPaymentPageTracker } from "@/components/billing/PayOSPaymentPageTracker";
import {
  getPaymentGatewayTransactionByOrderCodeForCurrentUser,
  syncPayOSGatewayTransaction,
} from "@/lib/data/payment-gateway-transactions";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";

export const dynamic = "force-dynamic";

type PaymentReturnPageProps = {
  searchParams?: Promise<{
    orderCode?: string;
  }>;
};

function parseOrderCode(value?: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";
}

export default async function PaymentReturnPage(props: PaymentReturnPageProps) {
  const searchParams = await props.searchParams;
  const orderCode = parseOrderCode(searchParams?.orderCode);
  let transaction = null;

  if (orderCode) {
    try {
      const { userId } = await createAuthedSupabaseServerClient();
      transaction = await syncPayOSGatewayTransaction({ orderCode, userId });
    } catch {
      transaction = await getPaymentGatewayTransactionByOrderCodeForCurrentUser(orderCode);
    }
  }

  const isPaid = transaction?.status === "paid";

  return (
    <div className="mx-auto max-w-3xl">
      <PayOSPaymentPageTracker
        amountVnd={transaction?.amount_vnd}
        event="return"
        planKey={transaction?.plan_key}
        status={transaction?.status}
      />
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ink"
        href="/app/billing"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại billing
      </Link>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span
          className={[
            "mx-auto flex h-14 w-14 items-center justify-center rounded-lg",
            isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          {isPaid ? (
            <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
          ) : (
            <Clock3 aria-hidden="true" className="h-7 w-7" />
          )}
        </span>

        <h1 className="mt-5 text-3xl font-bold leading-tight text-ink">
          {isPaid ? "Thanh toán thành công" : "Đang kiểm tra thanh toán"}
        </h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          {isPaid
            ? "SaleMap đã ghi nhận thanh toán và tự động cập nhật gói sử dụng của bạn."
            : "Chúng tôi đang kiểm tra trạng thái giao dịch của bạn. Nếu bạn đã thanh toán, hệ thống sẽ cập nhật sau vài phút."}
        </p>

        {transaction ? (
          <div className="mt-6 grid gap-3 rounded-lg bg-cloud p-4 text-left text-sm font-semibold text-slate-700 sm:grid-cols-2">
            <p>Gói: {transaction.plan_name}</p>
            <p>Số tiền: {formatCurrency(transaction.amount_vnd)}</p>
            <p>Mã đơn hàng: {transaction.order_code}</p>
            <p>Trạng thái: {transaction.status}</p>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
            Không tìm thấy giao dịch. Vui lòng quay lại trang gói sử dụng hoặc liên hệ hỗ trợ nếu bạn đã thanh toán.
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderCode ? (
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean"
              href={`/app/billing/payment/return?orderCode=${orderCode}`}
            >
              <RefreshCw aria-hidden="true" className="h-5 w-5" />
              Kiểm tra lại
            </Link>
          ) : null}
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 text-base font-bold text-white hover:bg-ocean"
            href="/app/billing"
          >
            Về gói sử dụng
          </Link>
        </div>
      </section>
    </div>
  );
}
