export type CreatePaymentLinkInput = {
  amountVnd: number;
  buyerEmail?: string;
  buyerName?: string;
  buyerPhone?: string;
  cancelUrl: string;
  description: string;
  orderCode: number;
  paymentRequestId: string;
  planKey: string;
  planName: string;
  returnUrl: string;
  userId: string;
};

export type CreatePaymentLinkResult = {
  checkoutUrl: string;
  orderCode: number;
  paymentLinkId?: string;
  qrCode?: string;
  raw: unknown;
  status?: string;
};

export type PayOSWebhookPayload = {
  code: string;
  data: Record<string, unknown>;
  desc: string;
  signature: string;
  success: boolean;
};
