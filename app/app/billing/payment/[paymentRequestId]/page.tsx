import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { PaymentInstructionPanel } from "@/components/billing/PaymentInstructionPanel";
import { getPaymentBankInfo, getPaymentRequestById } from "@/lib/data/payment-requests";

export const dynamic = "force-dynamic";

type PaymentInstructionPageProps = {
  params: Promise<{
    paymentRequestId: string;
  }>;
};

export default async function PaymentInstructionPage(props: PaymentInstructionPageProps) {
  const params = await props.params;
  const paymentRequest = await getPaymentRequestById(params.paymentRequestId);

  if (!paymentRequest) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Không tìm thấy yêu cầu thanh toán</h1>
        <p className="mt-3 text-base leading-8 text-slate-600">
          Yêu cầu này không tồn tại hoặc không thuộc tài khoản của bạn.
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

  const titlePrefix =
    paymentRequest.request_type === "renewal"
      ? "Hoàn tất gia hạn gói"
      : "Hoàn tất nâng cấp gói";

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
            Manual payment
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {titlePrefix} {paymentRequest.plan_name}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Chuyển khoản đúng số tiền và nội dung bên dưới để SaleMap xác nhận nhanh hơn.
          </p>
        </div>
      </div>

      <PaymentInstructionPanel
        bank={getPaymentBankInfo(paymentRequest)}
        paymentRequest={paymentRequest}
      />
    </div>
  );
}
