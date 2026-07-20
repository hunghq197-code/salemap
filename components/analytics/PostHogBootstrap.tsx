"use client";

import { useEffect } from "react";
import { initPostHog } from "@/instrumentation-client";

export function PostHogBootstrap() {
  useEffect(() => {
    void initPostHog();
  }, []);

  return null;
}
