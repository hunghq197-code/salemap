"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dictionaries,
  locales,
  type Locale,
} from "@/lib/i18n/dictionary";

type LanguageContextValue = {
  dictionary: (typeof dictionaries)[Locale];
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const STORAGE_KEY = "salemap-locale";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string | null): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "vi";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : "vi";
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      setLocaleState(nextLocale);
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    }

    return {
      dictionary: dictionaries[locale],
      locale,
      setLocale,
    };
  }, [locale]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
