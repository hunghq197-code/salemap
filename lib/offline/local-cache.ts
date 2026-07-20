"use client";

type CachedPayload<T> = {
  cachedAt: string;
  data: T;
  userId?: string;
};

const CACHE_PREFIX = "salemap";

function getKey(parts: string[]) {
  return [CACHE_PREFIX, ...parts].join(":");
}

export function saveLocalCache<T>(keyParts: string[], data: T, userId?: string) {
  if (typeof window === "undefined") return;

  const payload: CachedPayload<T> = {
    cachedAt: new Date().toISOString(),
    data,
    userId,
  };

  window.localStorage.setItem(getKey(keyParts), JSON.stringify(payload));
}

export function getLocalCache<T>(
  keyParts: string[],
  userId?: string,
): CachedPayload<T> | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(getKey(keyParts));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedPayload<T>;
    if (userId && parsed.userId && parsed.userId !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function removeLocalCache(keyParts: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getKey(keyParts));
}

export function clearUserLocalCache(userId: string) {
  if (typeof window === "undefined") return;

  const prefix = `${CACHE_PREFIX}:${userId}:`;

  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith(prefix)) {
      window.localStorage.removeItem(key);
    }
  });
}

export function saveCachedDashboard(userId: string, data: unknown) {
  saveLocalCache([userId, "dashboard"], data, userId);
}

export function getCachedDashboard<T>(userId: string) {
  return getLocalCache<T>([userId, "dashboard"], userId);
}

export function saveCachedLeads(userId: string, data: unknown) {
  saveLocalCache([userId, "leads"], data, userId);
}

export function getCachedLeads<T>(userId: string) {
  return getLocalCache<T>([userId, "leads"], userId);
}

export function saveCachedLeadDetail(userId: string, leadId: string, data: unknown) {
  saveLocalCache([userId, "lead", leadId], data, userId);
}

export function getCachedLeadDetail<T>(userId: string, leadId: string) {
  return getLocalCache<T>([userId, "lead", leadId], userId);
}

export function saveCachedReminders(userId: string, data: unknown) {
  saveLocalCache([userId, "reminders"], data, userId);
}

export function getCachedReminders<T>(userId: string) {
  return getLocalCache<T>([userId, "reminders"], userId);
}

export function saveCachedTemplates(data: unknown) {
  saveLocalCache(["templates"], data);
}

export function getCachedTemplates<T>() {
  return getLocalCache<T>(["templates"]);
}
