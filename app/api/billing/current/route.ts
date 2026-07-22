import { NextResponse } from "next/server";
import { getQuotaSummary } from "@/lib/billing/entitlements";
import { getPaymentsForUser, toSafeBillingPayment } from "@/lib/billing/payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { status },
  );
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("UNAUTHENTICATED", "Bạn cần đăng nhập.", 401);
  }

  const [quotaSummary, payments] = await Promise.all([
    getQuotaSummary(user.id),
    getPaymentsForUser(user.id, 10),
  ]);

  return NextResponse.json({
    data: {
      entitlements: quotaSummary.entitlements,
      plan: quotaSummary.plan,
      quotaSummary: quotaSummary.items,
      recentPayments: payments.map(toSafeBillingPayment),
      subscription: quotaSummary.subscription,
    },
    success: true,
  });
}
