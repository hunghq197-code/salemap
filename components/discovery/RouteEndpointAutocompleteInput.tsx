"use client";

import { LoaderCircle, MapPinned } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  GOOGLE_MAPS_AUTH_ERROR_MESSAGE,
  loadGooglePlacesAutocomplete,
  setGoogleMapsAuthFailureHandler,
} from "@/lib/google-maps/load-google-maps";

type RouteEndpointAutocompleteInputProps = {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

type EndpointSuggestion = {
  id: string;
  mainText: string;
  secondaryText?: string;
  text: string;
};

const MIN_QUERY_LENGTH = 3;
const SUGGESTION_LIMIT = 5;

function getText(value?: google.maps.places.FormattableText | null) {
  return value?.toString() || "";
}

function toSuggestions(
  suggestions: google.maps.places.AutocompleteSuggestion[],
): EndpointSuggestion[] {
  return suggestions
    .flatMap((suggestion) => {
      const prediction = suggestion.placePrediction;

      if (!prediction) {
        return [];
      }

      const text = getText(prediction.text);

      if (!text) {
        return [];
      }

      return [
        {
          id: prediction.placeId,
          mainText: getText(prediction.mainText) || text,
          secondaryText: getText(prediction.secondaryText),
          text,
        },
      ];
    })
    .slice(0, SUGGESTION_LIMIT);
}

export function RouteEndpointAutocompleteInput({
  label,
  onChange,
  placeholder,
  value,
}: RouteEndpointAutocompleteInputProps) {
  const requestIdRef = useRef(0);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<EndpointSuggestion[]>([]);

  useEffect(() => {
    const clearAuthFailureHandler = setGoogleMapsAuthFailureHandler(() => {
      setError(GOOGLE_MAPS_AUTH_ERROR_MESSAGE);
      setLoading(false);
      setSuggestions([]);
    });

    return clearAuthFailureHandler;
  }, []);

  useEffect(() => {
    const query = value.trim();

    if (!focused || query.length < MIN_QUERY_LENGTH) {
      const clearTimer = window.setTimeout(() => {
        setLoading(false);
        setSuggestions([]);
      }, 0);

      return () => window.clearTimeout(clearTimer);
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    const timer = window.setTimeout(() => {
      async function fetchSuggestions() {
        setLoading(true);
        setError("");

        try {
          const { AutocompleteSessionToken, AutocompleteSuggestion } =
            await loadGooglePlacesAutocomplete();

          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new AutocompleteSessionToken();
          }

          const response =
            await AutocompleteSuggestion.fetchAutocompleteSuggestions({
              includedRegionCodes: ["vn"],
              input: query,
              language: "vi",
              region: "VN",
              sessionToken: sessionTokenRef.current,
            });

          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setSuggestions(toSuggestions(response.suggestions));
        } catch (suggestionError) {
          if (requestIdRef.current !== currentRequestId) {
            return;
          }

          setSuggestions([]);
          setError(
            suggestionError instanceof Error
              ? suggestionError.message
              : "Không tải được gợi ý Google Maps. Bạn vẫn có thể nhập thủ công.",
          );
        } finally {
          if (requestIdRef.current === currentRequestId) {
            setLoading(false);
          }
        }
      }

      void fetchSuggestions();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [focused, value]);

  function handleSelectSuggestion(suggestion: EndpointSuggestion) {
    onChange(suggestion.text);
    setSuggestions([]);
    setFocused(false);
    sessionTokenRef.current = null;
  }

  return (
    <label className="relative block text-sm font-bold text-ink">
      {label}
      <div className="relative mt-2">
        <MapPinned
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        />
        <input
          autoComplete="off"
          className="min-h-12 w-full rounded-lg border border-slate-200 bg-white py-2 pl-11 pr-10 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
          maxLength={200}
          minLength={2}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 160);
          }}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          required
          value={value}
        />
        {loading ? (
          <LoaderCircle
            aria-hidden="true"
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400"
          />
        ) : null}
      </div>
      {focused && suggestions.length > 0 ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              className="block w-full border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-cloud"
              key={suggestion.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelectSuggestion(suggestion)}
              type="button"
            >
              <span className="block text-sm font-bold text-ink">
                {suggestion.mainText}
              </span>
              {suggestion.secondaryText ? (
                <span className="mt-1 block text-xs font-semibold text-slate-500">
                  {suggestion.secondaryText}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <span className="mt-2 block text-xs font-semibold leading-5 text-amber-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
