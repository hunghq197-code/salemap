"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let loaderConfigured = false;

export class MissingGoogleMapsBrowserKeyError extends Error {
  constructor() {
    super("Chưa cấu hình Google Maps cho môi trường này.");
    this.name = "MissingGoogleMapsBrowserKeyError";
  }
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
