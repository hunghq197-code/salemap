import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import Link from "next/link";
import {
  getPaymentByIdForUser,
  getPaymentByOrderCodeForUser,
  toSafeBillingPayment,
} from "@/lib/billing/payments";
import type { SafeBillingPayment } from "@/lib/billing/types";
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

function messageForPayment(payment?: SafeBillingPayment | null) {
  if (!payment) {
    return {
      icon: XCircle,
      tone: "rose",
      title: "Không tìm thấy thanh toán",
      text: "Vui lòng quay lại trang gói sử dụng hoặc liên hệ hỗ trợ nếu bạn đã thanh toán.",
    };
  }

  if (payment.status === "paid") {
    return {
      icon: CheckCircle2,
      tone: "emerald",
      title: "Thanh toán thành công",
      text: "Gói của bạn đã được kích hoạt.",
    };
  }

  if (payment.status === "failed" || payment.status === "cancelled") {
    return {
      icon: XCircle,
      tone: "rose",
      title: "Thanh toán chưa hoàn tất",
      text: "Thanh toán đã bị hủy hoặc thất bại. Gói hiện tại của bạn chưa thay đổi.",
    };
  }

  return {
    icon: Clock3,
    tone: "amber",
    title: "Thanh toán đang được xác nhận",
    text:
      payment.provider === "payos"
        ? "Hệ thống đang chờ webhook payOS hợp lệ để kích hoạt gói."
        : "Chúng tôi sẽ kiểm tra giao dịch và kích hoạt gói sau khi xác nhận.",
  };
}

function toneClass(tone: string) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700";
  if (tone === "rose") return "bg-rose-50 text-rose-700";

  return "bg-amber-50 text-amber-700";
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
  const message = messageForPayment(safePayment);
  const Icon = message.icon;

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
        <span
          className={[
            "mx-auto flex h-14 w-14 items-center justify-center rounded-lg",
            toneClass(message.tone),
          ].join(" ")}
        >
          <Icon aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-ink">
          {message.title}
        </h1>
        <p className="mt-3 text-base leading-8 text-slate-600">{message.text}</p>

        {safePayment ? (
          <div className="mt-6 grid gap-3 rounded-lg bg-cloud p-4 text-left text-sm font-semibold text-slate-700 sm:grid-cols-2">
            <p>Gói: {safePayment.planId === "pro_plus" ? "Pro Plus" : "Pro"}</p>
            <p>Số tiền: {new Intl.NumberFormat("vi-VN").format(safePayment.amount)}đ</p>
            <p>Mã đơn hàng: {safePayment.orderCode}</p>
            <p>Trạng thái: {safePayment.status}</p>
          </div>
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
