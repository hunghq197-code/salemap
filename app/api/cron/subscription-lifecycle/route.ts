import { NextResponse } from "next/server";
import {
  downgradeExpiredSubscriptions,
  expireSubscriptions,
} from "@/lib/billing/subscriptions";
import { processSubscriptionLifecycle } from "@/lib/data/subscription-lifecycle";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") || "";

  return Boolean(secret) && authorization === `Bearer ${secret}`;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: { code: "UNAUTHORIZED", message: "Cron secret không hợp lệ." },
      success: false,
    },
    { status: 401 },
  );
}

async function handler(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  const movedToGrace = await expireSubscriptions();
  const expiredFromGrace = await downgradeExpiredSubscriptions();
  const legacy = await processSubscriptionLifecycle();

  return NextResponse.json({
    data: {
      ...legacy,
      expiredFromGrace,
      movedToGrace,
    },
    success: true,
  });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
