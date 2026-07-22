import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const source = new URL(request.url);
  const target = new URL("/app/billing/cancel", getSiteUrl());

  for (const key of ["paymentId", "orderCode", "code", "status"]) {
    const value = source.searchParams.get(key);

    if (value) {
      target.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(target);
}
