import { CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BillingPlans } from "@/components/billing/BillingPlans";
import { CancellationReasonModal } from "@/components/billing/CancellationReasonModal";
import { RenewSubscriptionButton } from "@/components/billing/RenewSubscriptionButton";
import { QuotaUsageCard } from "@/components/quota/QuotaUsageCard";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import { BILLING_QUOTA_ACTIONS } from "@/lib/constants/quota";
import {
  getSubscriptionPlan,
  isPaidSubscriptionPlanKey,
} from "@/lib/constants/subscription-plans";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import {
  getMyPaymentGatewayTransactions,
  type PaymentGatewayTransactionRecord,
} from "@/lib/data/payment-gateway-transactions";
import { getMyPaymentRequests, type PaymentRequestRecord } from "@/lib/data/payment-requests";
import { getSubscriptionStatusForCurrentUser } from "@/lib/data/subscriptions";
import { getDailyUsageSnapshot } from "@/lib/data/usage";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  active: "Đang hoạt động",
  cancelled: "Đã hủy",
  expired: "Đã hết hạn",
  paid: "Đã thanh toán",
  past_due: "Quá hạn",
  pending: "Chờ chuyển khoản",
  rejected: "Bị từ chối",
  waiting_confirmation: "Chờ xác nhận",
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDaysRemaining(daysRemaining: number | null) {
  if (daysRemaining === null) {
    return "Chưa có ngày hết hạn";
  }

  if (daysRemaining <= 0) {
    return "Đã hết hạn";
  }

  return `Còn ${daysRemaining} ngày nữa hết hạn`;
}

function requestTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    new_subscription: "Nâng cấp mới",
    plan_change: "Đổi gói",
    renewal: "Gia hạn",
  };

  return labels[value || "new_subscription"] || "Nâng cấp mới";
}

function PaymentHistory({ items }: { items: PaymentRequestRecord[] }) {
  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Lịch sử yêu cầu nâng cấp</h2>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Theo dõi các yêu cầu chuyển khoản thủ công, gia hạn và trạng thái xác nhận.
          </p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article
              className="rounded-lg border border-slate-200 bg-cloud/40 p-4"
              key={item.id}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-ink">{item.plan_name}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ocean">
                      {statusLabels[item.status] || item.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                      {requestTypeLabel(item.request_type)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatDate(item.created_at)} · {formatCurrency(item.amount_vnd)} ·{" "}
                    {item.months ?? 1} tháng
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-ink">
                    {item.transfer_content || "Chưa có nội dung chuyển khoản"}
                  </p>
                </div>
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                  href={`/app/billing/payment/${item.id}`}
                >
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
          Bạn chưa có yêu cầu nâng cấp hoặc gia hạn nào.
        </p>
      )}
    </section>
  );
}

const gatewayStatusLabels: Record<string, string> = {
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  failed: "Thất bại",
  paid: "Đã thanh toán",
  pending: "Chờ thanh toán",
  unknown: "Chưa rõ",
};

function PaymentMethodsSection() {
  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-ink">Phương thức thanh toán</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-ocean/20 bg-ocean/5 p-4">
          <h3 className="font-bold text-ink">payOS / VietQR</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tạo link checkout tự động. Khi payOS xác nhận thanh toán, SaleMap tự kích hoạt gói và cập nhật quota.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-cloud/50 p-4">
          <h3 className="font-bold text-ink">Chuyển khoản thủ công</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Không thanh toán được qua payOS? Bạn vẫn có thể tạo yêu cầu chuyển khoản để admin kiểm tra thủ công.
          </p>
        </div>
      </div>
    </section>
  );
}

function PaymentGatewayHistory({
  items,
}: {
  items: PaymentGatewayTransactionRecord[];
}) {
  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-ink">Lịch sử thanh toán payOS</h2>
        <p className="mt-2 text-base leading-7 text-slate-600">
          Theo dõi các giao dịch checkout tự động, mã đơn hàng và trạng thái webhook.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article
              className="rounded-lg border border-slate-200 bg-cloud/40 p-4"
              key={item.id}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-ink">{item.plan_name}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ocean">
                      {gatewayStatusLabels[item.status] || item.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                      payOS
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatDate(item.created_at)} · {formatCurrency(item.amount_vnd)} ·{" "}
                    {item.months ?? 1} tháng
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-ink">
                    Mã đơn hàng: {item.order_code}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {item.checkout_url && item.status === "pending" ? (
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                      href={item.checkout_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                      Mở checkout
                    </a>
                  ) : null}
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                    href={`/app/billing/payment/return?orderCode=${item.order_code}`}
                  >
                    Kiểm tra
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-cloud px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
          Bạn chưa có giao dịch payOS nào.
        </p>
      )}
    </section>
  );
}

export default async function BillingPage() {
  const [
    subscriptionResult,
    paymentRequests,
    paymentGatewayTransactions,
    upgradeEnabled,
  ] = await Promise.all([
    getSubscriptionStatusForCurrentUser(),
    getMyPaymentRequests(),
    getMyPaymentGatewayTransactions(),
    isFeatureEnabled("upgrade_interest"),
  ]);
  const quota = await getDailyUsageSnapshot(BILLING_QUOTA_ACTIONS);
  const subscription = subscriptionResult.subscription;
  const isFree = subscription.plan_key === "free_beta";
  const isPaidPlan = isPaidSubscriptionPlanKey(subscription.plan_key);
  const isExpired = subscription.status === "expired" || subscriptionResult.expired;
  const planPrice = getSubscriptionPlan(subscription.plan_key).priceVnd;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
          <CreditCard aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Billing
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Gói sử dụng
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            Nâng cấp hoặc gia hạn Pro/Pro Plus bằng chuyển khoản thủ công. SaleMap sẽ kích hoạt gói sau khi admin xác nhận thanh toán.
          </p>
        </div>
      </div>

      {!subscriptionResult.schemaReady ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
          Chưa thấy bảng subscriptions/payment_requests. Hãy chạy file SQL manual-payment-subscription và revenue-renewal-churn trong Supabase trước.
        </div>
      ) : null}

      <section className="mt-8 rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
              <ShieldCheck aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">
                Gói hiện tại: {subscription.plan_name}
              </h2>
              <p className="mt-2 text-base leading-7 text-slate-600">
                {isExpired
                  ? "Gói đã hết hạn. Bạn đang sử dụng quota Free."
                  : isFree
                    ? "Bạn đang sử dụng gói Free."
                    : `Bạn đang sử dụng gói ${subscription.plan_name}.`}
              </p>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                <p>Bắt đầu kỳ: {formatDate(subscription.current_period_start)}</p>
                <p>Kích hoạt: {formatDate(subscription.activated_at)}</p>
                <p>Hết hạn: {formatDate(subscription.current_period_end)}</p>
                <p>{formatDaysRemaining(subscriptionResult.daysRemaining)}</p>
              </div>

              {subscriptionResult.expiringSoon ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                  Gói của bạn sắp hết hạn. Hãy gia hạn để tiếp tục sử dụng quota Pro.
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-lg bg-mint/15 px-4 py-3 text-sm font-bold text-ocean">
              Trạng thái: {statusLabels[isExpired ? "expired" : subscription.status] || subscription.status}
            </div>
            {isPaidPlan ? (
              <RenewSubscriptionButton
                amountVnd={planPrice}
                disabled={!subscriptionResult.schemaReady}
                planKey={subscription.plan_key as "pro" | "pro_plus"}
              />
            ) : null}
          </div>
        </div>
      </section>

      {isPaidPlan ? (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">
                Không muốn tiếp tục sử dụng?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Bạn có thể gửi yêu cầu hủy hoặc cho chúng tôi biết lý do bạn chưa muốn gia hạn.
              </p>
            </div>
            <CancellationReasonModal
              daysRemaining={subscriptionResult.daysRemaining}
              planKey={subscription.plan_key}
            />
          </div>
        </section>
      ) : null}

      <div className="mt-6">
        <QuotaUsageCard
          items={quota.items}
          planName={subscriptionResult.plan.name}
          schemaReady={quota.schemaReady}
          sourcePage="billing"
          title="Quota hôm nay"
        />
      </div>

      <PaymentMethodsSection />

      <PaymentGatewayHistory items={paymentGatewayTransactions} />

      <PaymentHistory
        items={paymentRequests.filter((item) => (item.provider || "manual") === "manual")}
      />

      <section className="mt-8">
        {upgradeEnabled ? (
          <BillingPlans currentPlanKey={subscription.plan_key} />
        ) : (
          <FeatureDisabledNotice flagKey="upgrade_interest" />
        )}
      </section>
    </div>
  );
}
