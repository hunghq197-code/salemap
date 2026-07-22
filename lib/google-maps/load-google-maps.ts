"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const authFailureHandlers = new Set<() => void>();
let loaderConfigured = false;

export const GOOGLE_MAPS_AUTH_ERROR_MESSAGE =
  "Google Maps browser key chưa hợp lệ hoặc chưa được cấp quyền cho domain hiện tại. Hãy kiểm tra NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY, Maps JavaScript API, giới hạn HTTP referrer và Billing.";

export class MissingGoogleMapsBrowserKeyError extends Error {
  constructor() {
    super("Chưa cấu hình Google Maps cho môi trường này.");
    this.name = "MissingGoogleMapsBrowserKeyError";
  }
}

export class GoogleMapsAuthError extends Error {
  constructor() {
    super(GOOGLE_MAPS_AUTH_ERROR_MESSAGE);
    this.name = "GoogleMapsAuthError";
  }
}

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export function setGoogleMapsAuthFailureHandler(onAuthFailure: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  authFailureHandlers.add(onAuthFailure);
  window.gm_authFailure = () => {
    authFailureHandlers.forEach((handler) => handler());
  };

  return () => {
    authFailureHandlers.delete(onAuthFailure);
  };
}

function configureLoader(apiKey: string) {
  if (loaderConfigured) {
    return;
  }

  setOptions({
    authReferrerPolicy: "origin",
    key: apiKey,
    language: "vi",
    region: "VN",
    v: "weekly",
  });
  loaderConfigured = true;
}

export async function loadGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim();

  if (!apiKey) {
    throw new MissingGoogleMapsBrowserKeyError();
  }

  configureLoader(apiKey);

  await Promise.all([importLibrary("maps"), importLibrary("geometry")]);
}

export async function loadGooglePlacesAutocomplete() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim();

  if (!apiKey) {
    throw new MissingGoogleMapsBrowserKeyError();
  }

  configureLoader(apiKey);

  return importLibrary("places") as Promise<google.maps.PlacesLibrary>;
}
