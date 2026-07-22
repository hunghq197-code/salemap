import { ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";
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
          Thanh toán đã bị hủy hoặc chưa hoàn tất
        </h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Gói hiện tại của bạn chưa thay đổi. Bạn có thể tạo payment mới hoặc dùng chuyển khoản/VietQR thủ công.
        </p>
        {safePayment ? (
          <p className="mt-5 rounded-lg bg-cloud px-4 py-3 text-sm font-semibold text-slate-600">
            Mã đơn hàng: {safePayment.orderCode} · Trạng thái hiện tại: {safePayment.status}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {safePayment ? (
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink hover:border-ocean"
              href={`/app/billing/checkout?paymentId=${safePayment.id}`}
            >
              Xem payment
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
