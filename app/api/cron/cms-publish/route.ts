import { NextResponse } from "next/server";
import { publishDueCmsPosts } from "@/lib/cms/posts";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "UNAUTHORIZED" }, success: false },
    { status: 401 },
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const result = await publishDueCmsPosts();

  return NextResponse.json({
    data: result,
    success: true,
  });
}
