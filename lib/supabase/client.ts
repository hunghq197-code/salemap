"use client";

import { createBrowserClient } from "@supabase/ssr";

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Thiếu cấu hình Supabase public env.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
