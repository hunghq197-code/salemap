"use client";

import { Landmark, QrCode, WalletCards } from "lucide-react";
import { RadioGroup } from "@/components/ui/RadioGroup";
import type { PaymentProviderId } from "@/lib/billing/types";

export type BillingProviderOption = {
  configured: boolean;
  enabled: boolean;
  id: PaymentProviderId;
};

type PaymentMethodSelectorProps = {
  disabled?: boolean;
  onChange: (provider: PaymentProviderId) => void;
  providers: BillingProviderOption[];
  value?: PaymentProviderId;
};

export const paymentProviderCopy: Record<
  PaymentProviderId,
  { description: string; label: string }
> = {
  manual_bank_transfer: {
    description: "Tạo hướng dẫn chuyển khoản. Admin đối soát xong mới kích hoạt gói.",
    label: "Chuyển khoản",
  },
  payos: {
    description: "Tạo checkout payOS. Gói chỉ active khi webhook hợp lệ được server xử lý.",
    label: "payOS",
  },
  vietqr_manual: {
    description: "Quét VietQR hoặc chuyển khoản. Đây vẫn là luồng đối soát thủ công.",
    label: "VietQR thủ công",
  },
};

function ProviderIcon({ provider }: { provider: PaymentProviderId }) {
  const Icon =
    provider === "payos"
      ? WalletCards
      : provider === "vietqr_manual"
        ? QrCode
        : Landmark;

  return <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />;
}

export function PaymentMethodSelector({
  disabled = false,
  onChange,
  providers,
  value,
}: PaymentMethodSelectorProps) {
  const enabledProviders = providers.filter((provider) => provider.enabled);

  if (enabledProviders.length === 0) {
    return (
      <p className="rounded-control border border-warning/25 bg-warning-soft px-3 py-2 text-sm font-semibold leading-6 text-amber-800">
        Chưa có phương thức thanh toán khả dụng trong môi trường này.
      </p>
    );
  }

  return (
    <RadioGroup
      legend="Phương thức thanh toán"
      name="billing-provider"
      onChange={(nextValue) => onChange(nextValue as PaymentProviderId)}
      options={enabledProviders.map((provider) => {
        const copy = paymentProviderCopy[provider.id];

        return {
          description: provider.configured
            ? copy.description
            : "Provider chưa được cấu hình đủ biến môi trường.",
          disabled: disabled || !provider.configured,
          label: (
            <span className="flex items-center gap-2">
              <ProviderIcon provider={provider.id} />
              {copy.label}
            </span>
          ),
          value: provider.id,
        };
      })}
      value={value}
    />
  );
}
