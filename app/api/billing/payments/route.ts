import { NextResponse } from "next/server";
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

  const payments = await getPaymentsForUser(user.id, 50);

  return NextResponse.json({
    data: {
      items: payments.map(toSafeBillingPayment),
    },
    success: true,
  });
}
