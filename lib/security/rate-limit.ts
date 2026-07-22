import { NextResponse } from "next/server";
import { getRequestIp } from "@/lib/security/request";

export type RateLimitCategory =
  | "admin_api"
  | "ai_request"
  | "auth_sensitive"
  | "import_upload"
  | "map_search"
  | "payment_webhook"
  | "route_search";

type RateLimitInput = {
  category: RateLimitCategory;
  identifier?: string | null;
  limit?: number;
  request?: Request;
  windowMs?: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_LIMITS: Record<RateLimitCategory, { limit: number; windowMs: number }> = {
  admin_api: { limit: 120, windowMs: 5 * 60 * 1000 },
  ai_request: { limit: 30, windowMs: 5 * 60 * 1000 },
  auth_sensitive: { limit: 20, windowMs: 10 * 60 * 1000 },
  import_upload: { limit: 10, windowMs: 60 * 60 * 1000 },
  map_search: { limit: 80, windowMs: 5 * 60 * 1000 },
  payment_webhook: { limit: 300, windowMs: 5 * 60 * 1000 },
  route_search: { limit: 60, windowMs: 5 * 60 * 1000 },
};

const buckets = new Map<string, Bucket>();

function getSubject(input: RateLimitInput) {
  return input.identifier || (input.request ? getRequestIp(input.request) : "unknown");
}

export function checkRateLimit(input: RateLimitInput) {
  const now = Date.now();
  const defaults = DEFAULT_LIMITS[input.category];
  const limit = input.limit ?? defaults.limit;
  const windowMs = input.windowMs ?? defaults.windowMs;
  const bucketKey = `${input.category}:${getSubject(input)}`;
  const current = buckets.get(bucketKey);

  if (buckets.size > 5000) {
    buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    });
  }

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    });

    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  current.count += 1;

  if (current.count <= limit) {
    return {
      allowed: true,
      remaining: Math.max(0, limit - current.count),
      retryAfterSeconds: 0,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Thao tác quá nhanh. Vui lòng thử lại sau.",
      },
      success: false,
    },
    {
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
      status: 429,
    },
  );
}

export function rateLimitByUser(input: Omit<RateLimitInput, "identifier"> & { userId: string }) {
  return checkRateLimit({ ...input, identifier: input.userId });
}

export function rateLimitByIp(input: Omit<RateLimitInput, "identifier"> & { request: Request }) {
  return checkRateLimit({ ...input, identifier: getRequestIp(input.request) });
}

export function rateLimitAdminAction(input: { request?: Request; userId: string }) {
  return rateLimitByUser({
    category: "admin_api",
    request: input.request,
    userId: input.userId,
  });
}

export function rateLimitExpensiveApi(input: {
  category: Extract<RateLimitCategory, "ai_request" | "map_search" | "route_search">;
  request?: Request;
  userId: string;
}) {
  return rateLimitByUser(input);
}
