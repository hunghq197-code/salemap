import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { BillingCheckoutPanel } from "@/components/billing/BillingCheckoutPanel";
import {
  getPaymentByIdForUser,
  getPaymentByOrderCodeForUser,
  toSafeBillingPayment,
} from "@/lib/billing/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BillingCheckoutPageProps = {
  searchParams?: Promise<{
    orderCode?: string;
    paymentId?: string;
  }>;
};

function parseOrderCode(value?: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default async function BillingCheckoutPage(props: BillingCheckoutPageProps) {
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

  if (!user || !payment) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Không tìm thấy thanh toán</h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Payment này không tồn tại hoặc không thuộc tài khoản của bạn.
        </p>
        <Link
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white"
          href="/app/billing"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          Quay lại gói sử dụng
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:text-ink"
        href="/app/billing"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại gói sử dụng
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <CreditCard aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Billing checkout
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Hoàn tất thanh toán SaleMap
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Kiểm tra đúng số tiền, provider và mã thanh toán trước khi thực hiện giao dịch.
          </p>
        </div>
      </div>

      <BillingCheckoutPanel payment={toSafeBillingPayment(payment)} />
    </div>
  );
}
