import { NextResponse } from "next/server";
import { sendDueReminderNotifications } from "@/lib/data/reminder-delivery";

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

  const data = await sendDueReminderNotifications();

  return NextResponse.json({
    data,
    success: true,
  });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
