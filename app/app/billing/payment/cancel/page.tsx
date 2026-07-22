import { ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";
import { PayOSPaymentPageTracker } from "@/components/billing/PayOSPaymentPageTracker";
import { getPaymentGatewayTransactionByOrderCodeForCurrentUser } from "@/lib/data/payment-gateway-transactions";

export const dynamic = "force-dynamic";

type PaymentCancelPageProps = {
  searchParams?: Promise<{
    orderCode?: string;
  }>;
};

function parseOrderCode(value?: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function PaymentCancelPage(props: PaymentCancelPageProps) {
  const searchParams = await props.searchParams;
  const orderCode = parseOrderCode(searchParams?.orderCode);
  let transaction = null;

  if (orderCode) {
    try {
      transaction = await getPaymentGatewayTransactionByOrderCodeForCurrentUser(orderCode);
    } catch {
      transaction = null;
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PayOSPaymentPageTracker
        amountVnd={transaction?.amount_vnd}
        event="cancel"
        planKey={transaction?.plan_key}
        status={transaction?.status || "cancelled"}
      />
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ink"
        href="/app/billing"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại gói sử dụng
      </Link>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
          <XCircle aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-ink">
          Thanh toán đã bị hủy
        </h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Bạn đã hủy thanh toán hoặc giao dịch chưa hoàn tất. Gói hiện tại của bạn chưa thay đổi.
        </p>
        {orderCode ? (
          <p className="mt-5 rounded-lg bg-cloud px-4 py-3 text-sm font-semibold text-slate-600">
            Mã đơn hàng: {orderCode}
          </p>
        ) : null}
        <Link
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 text-base font-bold text-white hover:bg-ocean"
          href="/app/billing"
        >
          Quay lại gói sử dụng
        </Link>
      </section>
    </div>
  );
}
