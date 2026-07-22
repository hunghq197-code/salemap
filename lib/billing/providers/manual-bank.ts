import "server-only";

import { BillingError } from "@/lib/billing/billing-errors";
import type {
  BillingProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderId,
} from "@/lib/billing/types";

type ManualBankConfig = {
  accountName: string;
  accountNumber: string;
  bankBin?: string;
  bankBranch?: string;
  bankName: string;
  transferPrefix: string;
  vietQrEnabled: boolean;
  vietQrTemplate: string;
};

function readConfig(): ManualBankConfig {
  return {
    accountName:
      process.env.BILLING_BANK_ACCOUNT_NAME?.trim() ||
      process.env.VIETQR_ACCOUNT_NAME?.trim() ||
      process.env.PAYMENT_BANK_ACCOUNT_NAME?.trim() ||
      "",
    accountNumber:
      process.env.BILLING_BANK_ACCOUNT_NUMBER?.trim() ||
      process.env.VIETQR_ACCOUNT_NUMBER?.trim() ||
      process.env.PAYMENT_BANK_ACCOUNT_NUMBER?.trim() ||
      "",
    bankBin: process.env.VIETQR_BANK_BIN?.trim() || undefined,
    bankBranch: process.env.BILLING_BANK_BRANCH?.trim() || undefined,
    bankName:
      process.env.BILLING_BANK_NAME?.trim() ||
      process.env.PAYMENT_BANK_NAME?.trim() ||
      "",
    transferPrefix: process.env.BILLING_TRANSFER_PREFIX?.trim() || "SALEMAP",
    vietQrEnabled: process.env.VIETQR_ENABLED !== "false",
    vietQrTemplate: process.env.VIETQR_TEMPLATE?.trim() || "compact",
  };
}

function assertManualBankConfigured(config: ManualBankConfig) {
  if (!config.bankName || !config.accountNumber || !config.accountName) {
    throw new BillingError("BILLING_NOT_CONFIGURED", 503);
  }
}

function buildTransferContent(config: ManualBankConfig, orderCode: number) {
  return `${config.transferPrefix}-${orderCode}`;
}

function buildVietQrUrl(input: CreatePaymentInput, config: ManualBankConfig) {
  if (
    !config.vietQrEnabled ||
    !config.bankBin ||
    !config.accountNumber ||
    !config.accountName
  ) {
    return undefined;
  }

  const url = new URL(
    `https://img.vietqr.io/image/${config.bankBin}-${config.accountNumber}-${config.vietQrTemplate}.png`,
  );
  url.searchParams.set("amount", String(input.amount));
  url.searchParams.set("addInfo", buildTransferContent(config, input.orderCode));
  url.searchParams.set("accountName", config.accountName);

  return url.toString();
}

export function getManualBankPreview() {
  const config = readConfig();

  return {
    accountName: config.accountName || null,
    accountNumber: config.accountNumber || null,
    bankBranch: config.bankBranch || null,
    bankName: config.bankName || null,
    configured: Boolean(config.bankName && config.accountNumber && config.accountName),
    transferPrefix: config.transferPrefix,
    vietQrConfigured: Boolean(
      config.vietQrEnabled && config.bankBin && config.accountNumber && config.accountName,
    ),
  };
}

export async function createManualBankPayment(
  input: CreatePaymentInput,
  provider: Extract<PaymentProviderId, "manual_bank_transfer" | "vietqr_manual">,
): Promise<CreatePaymentResult> {
  const config = readConfig();

  assertManualBankConfigured(config);

  return {
    bankAccountName: config.accountName,
    bankAccountNumber: config.accountNumber,
    bankBranch: config.bankBranch,
    bankName: config.bankName,
    provider,
    qrCode: provider === "vietqr_manual" ? buildVietQrUrl(input, config) : undefined,
    transferContent: buildTransferContent(config, input.orderCode),
  };
}

export const manualBankProvider: BillingProvider = {
  createPayment(input) {
    return createManualBankPayment(input, "manual_bank_transfer");
  },
  id: "manual_bank_transfer",
};

export const vietQrManualProvider: BillingProvider = {
  createPayment(input) {
    return createManualBankPayment(input, "vietqr_manual");
  },
  id: "vietqr_manual",
};
