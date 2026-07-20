"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useOfflineUser } from "@/components/pwa/OfflineUserProvider";
import {
  trackOfflineActionEnqueued,
  trackOfflineDraftRestored,
  trackPWAOfflineDraftSaved,
  trackPWAOfflineQueueSaved,
} from "@/lib/analytics/client";
import {
  enqueueOfflineAction,
  type OfflineActionType,
  readQueue,
} from "@/lib/offline/action-queue";
import {
  clearDraft as clearStoredDraft,
  getDraft,
  saveDraft as saveStoredDraft,
} from "@/lib/offline/drafts";

export const OFFLINE_QUEUE_STORAGE_KEY = "salemap:offlineQueue:v1";

type DraftValues = Record<string, string[]>;

type DraftRecord = {
  formName: string;
  savedAt: string;
  values: DraftValues;
};

type UseLocalFormDraftInput = {
  clearOnToastCodes?: string[];
  draftKey: string;
  formName: string;
  offlineActionType?: OfflineActionType;
  toastCode?: string;
};

function toValues(form: HTMLFormElement): DraftValues {
  const formData = new FormData(form);
  const values: DraftValues = {};

  formData.forEach((value, key) => {
    if (typeof value !== "string") {
      return;
    }

    values[key] = [...(values[key] ?? []), value];
  });

  return values;
}

function restoreValues(form: HTMLFormElement, values: DraftValues) {
  const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    "input[name], select[name], textarea[name]",
  );

  fields.forEach((field) => {
    const fieldValues = values[field.name];

    if (!fieldValues) {
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        field.checked = false;
      }

      return;
    }

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = fieldValues.includes(field.value || "on");
      return;
    }

    if (field instanceof HTMLInputElement && field.type === "radio") {
      field.checked = fieldValues.includes(field.value);
      return;
    }

    if (field instanceof HTMLSelectElement && field.multiple) {
      Array.from(field.options).forEach((option) => {
        option.selected = fieldValues.includes(option.value);
      });
      return;
    }

    field.value = fieldValues[0] ?? "";
  });
}

function firstValue(values: DraftValues, key: string) {
  return values[key]?.[0] ?? "";
}

function buildOfflinePayload(actionType: OfflineActionType, values: DraftValues) {
  if (actionType === "create_lead_note") {
    return {
      content: firstValue(values, "content"),
      createReminder: Boolean(values.createReminder?.includes("on")),
      interactionType: firstValue(values, "interactionType") || "call",
      leadId: firstValue(values, "leadId"),
      outcome: firstValue(values, "outcome"),
      remindAt: firstValue(values, "remindAt"),
      reminderDescription: firstValue(values, "reminderDescription"),
      reminderTitle: firstValue(values, "reminderTitle"),
      statusAfter: firstValue(values, "statusAfter"),
    };
  }

  return {
    description: firstValue(values, "description"),
    leadId: firstValue(values, "leadId"),
    remindAt: firstValue(values, "remindAt"),
    title: firstValue(values, "title"),
  };
}

function formatSavedAt(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function useLocalFormDraft({
  clearOnToastCodes = [],
  draftKey,
  formName,
  offlineActionType,
  toastCode,
}: UseLocalFormDraftInput) {
  const { refreshQueue, userId } = useOfflineUser();
  const formRef = useRef<HTMLFormElement>(null);
  const trackedDraft = useRef(false);
  const restoredDraft = useRef(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [offlineBlocked, setOfflineBlocked] = useState(false);

  useEffect(() => {
    if (!formRef.current) {
      return;
    }

    if (toastCode && clearOnToastCodes.includes(toastCode)) {
      clearStoredDraft(userId, draftKey);
      setDraftSavedAt(null);
      setHasDraft(false);
      return;
    }

    const draft = getDraft<DraftRecord>(userId, draftKey);

    if (draft?.data?.values) {
      restoreValues(formRef.current, draft.data.values);
      setDraftSavedAt(draft.data.savedAt || draft.savedAt);
      setHasDraft(true);

      if (!restoredDraft.current) {
        restoredDraft.current = true;
        trackOfflineDraftRestored({
          formName,
          route: window.location.pathname,
          status: "restored",
        });
      }
    }
  }, [clearOnToastCodes, draftKey, formName, toastCode, userId]);

  function saveDraft() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    try {
      const savedAt = new Date().toISOString();
      const draft: DraftRecord = {
        formName,
        savedAt,
        values: toValues(form),
      };

      saveStoredDraft(userId, draftKey, draft);
      setDraftSavedAt(savedAt);
      setHasDraft(true);

      if (!trackedDraft.current) {
        trackedDraft.current = true;
        trackPWAOfflineDraftSaved({ formName, status: "draft_saved" });
      }
    } catch {
      // Local draft must never block typing.
    }
  }

  function clearDraft() {
    clearStoredDraft(userId, draftKey);
    setDraftSavedAt(null);
    setHasDraft(false);
    setOfflineBlocked(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    saveDraft();

    if (window.navigator.onLine) {
      return;
    }

    event.preventDefault();
    setOfflineBlocked(true);

    const form = formRef.current;

    if (!form || !offlineActionType) {
      return;
    }

    const action = enqueueOfflineAction({
      payload: buildOfflinePayload(offlineActionType, toValues(form)),
      type: offlineActionType,
      userId,
    });
    const queueCount = readQueue(userId).length;

    refreshQueue();
    trackOfflineActionEnqueued({
      actionType: action.type,
      formName,
      pendingCount: queueCount,
      route: window.location.pathname,
      status: "queued_offline",
    });
    trackPWAOfflineQueueSaved({
      formName,
      queueCount,
      status: "queued_offline",
    });
  }

  return {
    clearDraft,
    draftSavedLabel: formatSavedAt(draftSavedAt),
    formRef,
    handleChange: saveDraft,
    handleSubmit,
    hasDraft,
    offlineBlocked,
  };
}
