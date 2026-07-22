const SENSITIVE_KEYS = new Set([
  "address",
  "apiKey",
  "authorization",
  "checksumKey",
  "customerName",
  "email",
  "leadName",
  "note",
  "noteContent",
  "password",
  "paymentSecret",
  "phone",
  "rawPlace",
  "rawPlaceData",
  "serviceRoleKey",
  "token",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKey(key: string) {
  return key.replace(/[_-]/g, "").toLowerCase();
}

function isSensitiveKey(key: string) {
  const normalized = normalizeKey(key);

  return Array.from(SENSITIVE_KEYS).some(
    (sensitiveKey) => normalizeKey(sensitiveKey) === normalized,
  );
}

export function sanitizeLogMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.slice(0, 50).map(sanitizeLogMetadata);
  }

  if (!isPlainObject(value)) {
    if (typeof value === "string" && value.length > 500) {
      return `${value.slice(0, 500)}...`;
    }

    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, item]) => [key, sanitizeLogMetadata(item)]),
  );
}

export function sanitizeLogMetadataObject(
  value?: Record<string, unknown> | null,
): Record<string, unknown> {
  const sanitized = sanitizeLogMetadata(value ?? {});

  return isPlainObject(sanitized) ? sanitized : {};
}
