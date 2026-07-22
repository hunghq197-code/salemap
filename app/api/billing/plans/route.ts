import { NextResponse } from "next/server";
import { getAvailablePlans } from "@/lib/billing/plans";
import {
  getAllowedBillingProviders,
  isBillingProviderEnabled,
} from "@/lib/billing/payments";
import { getManualBankPreview } from "@/lib/billing/providers/manual-bank";

export async function GET() {
  const providers = getAllowedBillingProviders().map((provider) => ({
    configured:
      provider === "payos"
        ? process.env.PAYOS_ENABLED === "true" &&
          Boolean(
            process.env.PAYOS_CLIENT_ID &&
              process.env.PAYOS_API_KEY &&
              process.env.PAYOS_CHECKSUM_KEY,
          )
        : getManualBankPreview().configured,
    enabled: isBillingProviderEnabled(provider),
    id: provider,
  }));

  return NextResponse.json({
    data: {
      plans: getAvailablePlans(),
      providers,
    },
    success: true,
  });
}
