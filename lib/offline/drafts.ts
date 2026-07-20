"use client";

const DRAFT_PREFIX = "salemap:draft";

function draftKey(userId: string, key: string) {
  return `${DRAFT_PREFIX}:${userId}:${key}`;
}

export function saveDraft<T>(userId: string, key: string, data: T) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    draftKey(userId, key),
    JSON.stringify({
      data,
      savedAt: new Date().toISOString(),
    }),
  );
}

export function getDraft<T>(
  userId: string,
  key: string,
): { data: T; savedAt: string } | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(draftKey(userId, key));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as { data: T; savedAt: string };
  } catch {
    return null;
  }
}

export function clearDraft(userId: string, key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey(userId, key));
}

export function clearUserDrafts(userId: string) {
  if (typeof window === "undefined") return;

  const prefix = `${DRAFT_PREFIX}:${userId}:`;

  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith(prefix)) {
      window.localStorage.removeItem(key);
    }
  });
}
