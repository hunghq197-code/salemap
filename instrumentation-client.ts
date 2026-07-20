"use client";

import type { CaptureResult } from "posthog-js";

declare global {
  interface Window {
    __salemapPosthogInitialized?: boolean;
    __salemapPosthogReady?: Promise<void>;
  }
}

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

const blockedPropertyKeys = new Set([
  "$ip",
  "email",
  "fullName",
  "mainArea",
  "message",
  "name",
  "phone",
  "phoneZalo",
]);

const urlPropertyKeys = new Set(["$current_url", "$referrer"]);

function sanitizeUrlProperty(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    const parsedUrl = new URL(value, window.location.origin);

    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return value.split("?")[0].split("#")[0].slice(0, 160);
  }
}

function sanitizeCaptureProperties(properties: CaptureResult["properties"]) {
  const nextProperties = { ...properties };

  blockedPropertyKeys.forEach((key) => {
    delete nextProperties[key];
  });

  urlPropertyKeys.forEach((key) => {
    if (key in nextProperties) {
      nextProperties[key] = sanitizeUrlProperty(nextProperties[key]);
    }
  });

  return nextProperties;
}

function sanitizeCaptureResult(captureResult: CaptureResult | null) {
  if (!captureResult) {
    return null;
  }

  return {
    ...captureResult,
    $set: captureResult.$set
      ? sanitizeCaptureProperties(captureResult.$set)
      : undefined,
    $set_once: captureResult.$set_once
      ? sanitizeCaptureProperties(captureResult.$set_once)
      : undefined,
    properties: sanitizeCaptureProperties(captureResult.properties),
  };
}

export function initPostHog() {
  try {
    if (typeof window === "undefined" || !posthogKey) {
      return undefined;
    }

    if (window.__salemapPosthogReady) {
      return window.__salemapPosthogReady;
    }

    if (window.__salemapPosthogInitialized) {
      return undefined;
    }

    window.__salemapPosthogInitialized = true;

    window.__salemapPosthogReady = import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          autocapture: false,
          before_send: sanitizeCaptureResult,
          capture_pageleave: "if_capture_pageview",
          capture_pageview: true,
          debug: process.env.NODE_ENV === "development",
          disable_session_recording: true,
          person_profiles: "identified_only",
          persistence: "localStorage+cookie",
          loaded: () => {
            window.__salemapPosthogInitialized = true;
          },
        });
      })
      .catch(() => {
        window.__salemapPosthogInitialized = false;
        window.__salemapPosthogReady = undefined;
      });

    return window.__salemapPosthogReady;
  } catch {
    return undefined;
  }
}

export {};
