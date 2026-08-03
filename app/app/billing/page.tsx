import {
  CreditCard,
  FileText,
  HelpCircle,
  Landmark,
  PackagePlus,
  QrCode,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { BillingPlans } from "@/components/billing/BillingPlans";
import { BillingUsageSummary } from "@/components/billing/BillingUsageSummary";
import { CancellationReasonModal } from "@/components/billing/CancellationReasonModal";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { PaymentHistory } from "@/components/billing/PaymentHistory";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeatureDisabledNotice } from "@/components/ui/FeatureDisabledNotice";
import {
  getAllowedBillingProviders,
  getPaymentsForUser,
  isBillingProviderEnabled,
  toSafeBillingPayment,
} from "@/lib/billing/payments";
import { fromSubscriptionPlanKey } from "@/lib/billing/plans";
import { getManualBankPreview } from "@/lib/billing/providers/manual-bank";
import type { PaymentProviderId, PlanId } from "@/lib/billing/types";
import { BILLING_QUOTA_ACTIONS } from "@/lib/constants/quota";
import { isPaidSubscriptionPlanKey } from "@/lib/constants/subscription-plans";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { getSubscriptionStatusForCurrentUser } from "@/lib/data/subscriptions";
import { getDailyUsageSnapshot } from "@/lib/data/usage";

export const dynamic = "force-dynamic";

function providerLabel(provider: PaymentProviderId) {
  const labels: Record<PaymentProviderId, string> = {
    manual_bank_transfer: "Chuyển khoản",
    payos: "payOS",
    vietqr_manual: "VietQR thủ công",
  };

  return labels[provider];
}

function providerDescription(provider: PaymentProviderId) {
  const labels: Record<PaymentProviderId, string> = {
    manual_bank_transfer: "Tạo hướng dẫn chuyển khoản. Admin đối soát xong mới kích hoạt.",
    payos: "Tạo checkout tự động. Webhook hợp lệ mới kích hoạt subscription.",
    vietqr_manual: "Tạo QR nếu backend cấu hình VietQR, vẫn cần admin đối soát.",
  };

  return labels[provider];
}

function providerIcon(provider: PaymentProviderId) {
  if (provider === "payos") return WalletCards;
  if (provider === "vietqr_manual") return QrCode;
  return Landmark;
}

function getProviderOptions() {
  const manualBank = getManualBankPreview();

  return getAllowedBillingProviders().map((provider) => ({
    configured:
      provider === "payos"
        ? process.env.PAYOS_ENABLED === "true" &&
          Boolean(
            process.env.PAYOS_CLIENT_ID &&
              process.env.PAYOS_API_KEY &&
              process.env.PAYOS_CHECKSUM_KEY,
          )
        : manualBank.configured,
    enabled: isBillingProviderEnabled(provider),
    id: provider,
  }));
}

function subscriptionStatusForDisplay(input: {
  expired?: boolean;
  planId: PlanId | string;
  status?: string | null;
}) {
  if (input.expired) return "expired";
  if (input.planId === "free") return "free";
  return input.status || "free";
}

function PaymentMethodsSection({
  providers,
}: {
  providers: ReturnType<typeof getProviderOptions>;
}) {
  return (
    <Card>
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-success-soft text-emerald-700">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Phương thức thanh toán</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
            SaleMap chỉ kích hoạt gói sau khi server xác nhận payment hợp lệ.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            href="/app/billing/add-ons"
            icon={<PackagePlus aria-hidden="true" className="h-4 w-4" />}
            iconPosition="left"
            variant="secondary"
          >
            Add-ons
          </Button>
          <Button
            href="/app/billing/orders"
            icon={<FileText aria-hidden="true" className="h-4 w-4" />}
            iconPosition="left"
            variant="outline"
          >
            Orders
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {providers.map((provider) => {
          const Icon = providerIcon(provider.id);

          return (
            <article
              className="rounded-control border border-border-soft bg-surface-muted px-4 py-3"
              key={provider.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
                    <h3 className="font-bold text-text-primary">
                      {providerLabel(provider.id)}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {providerDescription(provider.id)}
                  </p>
                </div>
                <Badge tone={provider.enabled && provider.configured ? "success" : "warning"}>
                  {provider.enabled && provider.configured ? "Sẵn sàng" : "Chưa bật"}
                </Badge>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}

function BillingFaq() {
  return (
    <Card>
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-warning-soft text-amber-700">
          <HelpCircle aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Câu hỏi thường gặp</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              [
                "Return page có tự kích hoạt gói không?",
                "Không. Trang success/cancel chỉ đọc trạng thái payment từ server.",
              ],
              [
                "Chuyển khoản xong có dùng Pro ngay không?",
                "Chưa. Payment sẽ ở trạng thái chờ xác nhận cho đến khi admin đối soát.",
              ],
              [
                "payOS xử lý thế nào?",
                "Webhook hợp lệ, đúng số tiền và đúng order mới được server xử lý subscription.",
              ],
            ].map(([question, answer]) => (
              <article className="rounded-control border border-border-soft bg-surface-muted px-4 py-3" key={question}>
                <h3 className="font-bold text-text-primary">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default async function BillingPage() {
  const [subscriptionResult, upgradeEnabled] = await Promise.all([
    getSubscriptionStatusForCurrentUser(),
    isFeatureEnabled("upgrade_interest"),
  ]);
  const subscription = subscriptionResult.subscription;
  const planId = fromSubscriptionPlanKey(subscription.plan_key);
  const [quota, billingPayments] = await Promise.all([
    getDailyUsageSnapshot(BILLING_QUOTA_ACTIONS),
    getPaymentsForUser(subscription.user_id, 20),
  ]);
  const providerOptions = getProviderOptions();
  const status = subscriptionStatusForDisplay({
    expired: subscriptionResult.expired,
    planId,
    status: subscription.status,
  });
  const showCancellation = isPaidSubscriptionPlanKey(subscription.plan_key);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
            <CreditCard aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Billing
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              Gói dịch vụ
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-text-secondary">
              Quản lý gói đang sử dụng, hạn mức và lịch sử thanh toán của bạn.
            </p>
          </div>
        </div>
      </div>

      <CurrentPlanCard
        actions={
          showCancellation ? (
            <CancellationReasonModal
              daysRemaining={subscriptionResult.daysRemaining}
              planKey={subscription.plan_key}
            />
          ) : null
        }
        currentPeriodEnd={subscription.current_period_end}
        currentPeriodStart={subscription.current_period_start}
        daysRemaining={subscriptionResult.daysRemaining}
        planId={planId}
        planName={subscription.plan_name}
        schemaReady={subscriptionResult.schemaReady}
        status={status}
      />

      <BillingUsageSummary
        items={quota.items}
        planName={subscriptionResult.plan.name}
        schemaReady={quota.schemaReady}
      />

      <PaymentMethodsSection providers={providerOptions} />

      <PaymentHistory items={billingPayments.map(toSafeBillingPayment)} />

      {upgradeEnabled ? (
        <BillingPlans currentPlanKey={subscription.plan_key} providers={providerOptions} />
      ) : (
        <FeatureDisabledNotice flagKey="upgrade_interest" />
      )}

      <BillingFaq />
    </div>
  );
}
