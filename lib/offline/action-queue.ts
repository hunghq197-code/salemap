"use client";

export type OfflineActionType = "create_lead_note" | "create_reminder";

export type OfflineAction = {
  createdAt: string;
  error?: string;
  id: string;
  payload: Record<string, unknown>;
  retryCount: number;
  status: "failed" | "pending" | "syncing";
  type: OfflineActionType;
  userId: string;
};

const QUEUE_PREFIX = "salemap:offline-queue";

function queueKey(userId: string) {
  return `${QUEUE_PREFIX}:${userId}`;
}

function writeQueue(userId: string, actions: OfflineAction[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(queueKey(userId), JSON.stringify(actions.slice(-50)));
  window.dispatchEvent(new CustomEvent("salemap:offline-queue-updated"));
}

export function getOfflineQueueStorageKey(userId: string) {
  return queueKey(userId);
}

export function readQueue(userId: string): OfflineAction[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(queueKey(userId));
  if (!raw) return [];

  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

export function enqueueOfflineAction(
  action: Omit<OfflineAction, "createdAt" | "id" | "retryCount" | "status">,
) {
  const actions = readQueue(action.userId);
  const newAction: OfflineAction = {
    ...action,
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    retryCount: 0,
    status: "pending",
  };

  writeQueue(action.userId, [...actions, newAction]);

  return newAction;
}

export function getPendingOfflineActions(userId: string) {
  return readQueue(userId).filter((action) => action.status !== "syncing");
}

export function removeOfflineAction(userId: string, actionId: string) {
  const actions = readQueue(userId).filter((action) => action.id !== actionId);
  writeQueue(userId, actions);
}

export function updateOfflineAction(
  userId: string,
  actionId: string,
  patch: Partial<OfflineAction>,
) {
  const actions = readQueue(userId).map((action) =>
    action.id === actionId ? { ...action, ...patch } : action,
  );

  writeQueue(userId, actions);
}

export function clearUserOfflineQueue(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(queueKey(userId));
  window.dispatchEvent(new CustomEvent("salemap:offline-queue-updated"));
}
