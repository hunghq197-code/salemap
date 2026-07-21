import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  message?: string;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function jsonSecurityError(code: string, message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json(
    {
      error: { code, message },
      success: false,
    },
    { headers, status },
  );
}

function normalizeOrigin(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request: Request) {
  const allowedOrigins = new Set<string>();
  const requestOrigin = normalizeOrigin(request.url);
  const siteOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const host = request.headers.get("host");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const vercelOrigin = vercelUrl?.startsWith("http")
    ? normalizeOrigin(vercelUrl)
    : normalizeOrigin(vercelUrl ? `https://${vercelUrl}` : null);

  if (requestOrigin) allowedOrigins.add(requestOrigin);
  if (siteOrigin) allowedOrigins.add(siteOrigin);
  if (vercelOrigin) allowedOrigins.add(vercelOrigin);

  if (host) {
    allowedOrigins.add(`http://${host}`);
    allowedOrigins.add(`https://${host}`);
  }

  return allowedOrigins;
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function enforceSameOrigin(request: Request) {
  const origin = normalizeOrigin(request.headers.get("origin"));

  if (!origin) {
    if (process.env.NODE_ENV === "production") {
      return jsonSecurityError(
        "SAME_ORIGIN_REQUIRED",
        "Yêu cầu bảo mật chưa hợp lệ. Vui lòng tải lại trang và thử lại.",
        403,
      );
    }

    return null;
  }

  if (!getAllowedOrigins(request).has(origin)) {
    return jsonSecurityError(
      "INVALID_REQUEST_ORIGIN",
      "Nguồn gửi yêu cầu chưa hợp lệ. Vui lòng tải lại trang và thử lại.",
      403,
    );
  }

  return null;
}

export function rateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const subject = getRequestIp(request);
  const bucketKey = `${options.key}:${subject}`;
  const current = rateLimitBuckets.get(bucketKey);

  if (rateLimitBuckets.size > 5000) {
    rateLimitBuckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) {
        rateLimitBuckets.delete(key);
      }
    });
  }

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return null;
  }

  current.count += 1;

  if (current.count <= options.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

  return jsonSecurityError(
    "RATE_LIMITED",
    options.message || "Bạn thao tác hơi nhanh. Vui lòng chờ một lát rồi thử lại.",
    429,
    {
      "Retry-After": String(retryAfterSeconds),
    },
  );
}

export function guardMutationRequest(request: Request, options: RateLimitOptions) {
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  return rateLimit(request, options);
}
