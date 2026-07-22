export type PaymentProviderId = "manual_bank_transfer" | "payos" | "vietqr_manual";

export type PaymentStatus =
  | "cancelled"
  | "expired"
  | "failed"
  | "paid"
  | "pending"
  | "processing"
  | "refunded"
  | "waiting_confirmation";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "free"
  | "grace"
  | "past_due"
  | "trialing";

export type BillingPeriod = "manual" | "monthly" | "yearly";

export type PlanId = "free" | "pro" | "pro_plus";

export type BillingEntitlements = {
  aiDailyLimit: number;
  cadenceLimit: number;
  exportDailyLimit: number;
  importMonthlyLimit: number;
  leadLimit: number;
  mapSearchDailyLimit: number;
  routeSearchDailyLimit: number;
  taskLimit: number;
};

export type BillingPlan = BillingEntitlements & {
  billingPeriod: "monthly";
  description: string;
  displayPrice: string;
  highlighted: boolean;
  id: PlanId;
  name: string;
  priceMonthly: number;
};

export type CreatePaymentInput = {
  amount: number;
  billingPeriod: BillingPeriod;
  cancelUrl?: string;
  currency: "VND";
  description: string;
  orderCode: number;
  planId: string;
  provider?: PaymentProviderId;
  returnUrl?: string;
  userId: string;
};

export type CreatePaymentResult = {
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankName?: string;
  checkoutUrl?: string;
  paymentLinkId?: string;
  provider: PaymentProviderId;
  providerPayload?: Record<string, unknown>;
  qrCode?: string;
  transferContent?: string;
};

export type NormalizedPaymentStatus = {
  amount?: number | null;
  orderCode: number;
  paidAt?: string | null;
  paymentLinkId?: string | null;
  providerReference?: string | null;
  providerStatus?: string | null;
  status: PaymentStatus | "unknown";
};

export type NormalizedWebhookResult = NormalizedPaymentStatus & {
  raw?: unknown;
  safeEvent?: Record<string, unknown>;
};

export interface BillingProvider {
  cancelPayment?(input: { orderCode: number }): Promise<void>;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus?(input: { orderCode: number }): Promise<NormalizedPaymentStatus>;
  id: PaymentProviderId;
  verifyWebhook?(input: unknown): Promise<NormalizedWebhookResult>;
}

export type BillingPaymentRecord = {
  admin_note?: string | null;
  amount: number;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  billing_period?: BillingPeriod | string | null;
  cancelled_at?: string | null;
  checkout_url?: string | null;
  created_at?: string | null;
  currency?: "VND" | string | null;
  description?: string | null;
  expired_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  id: string;
  order_code: number;
  paid_at?: string | null;
  payment_code?: string | null;
  payment_link_id?: string | null;
  plan_id: PlanId | string;
  provider: PaymentProviderId | string;
  provider_payload?: Record<string, unknown> | null;
  qr_code?: string | null;
  status: PaymentStatus;
  subscription_id?: string | null;
  transaction_reference?: string | null;
  transfer_content?: string | null;
  updated_at?: string | null;
  user_confirmed_transfer_at?: string | null;
  user_id: string;
};

export type SafeBillingPayment = {
  amount: number;
  bankInfo?: {
    accountName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
  };
  billingPeriod: BillingPeriod | string;
  checkoutUrl?: string | null;
  currency: string;
  createdAt?: string | null;
  id: string;
  orderCode: number;
  paidAt?: string | null;
  paymentCode?: string | null;
  paymentLinkId?: string | null;
  planId: string;
  provider: string;
  qrCode?: string | null;
  status: PaymentStatus;
  transferContent?: string | null;
  userConfirmedTransferAt?: string | null;
};
