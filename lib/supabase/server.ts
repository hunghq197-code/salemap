import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { assertServerOnly } from "@/lib/security/server-only";

export class MissingSupabaseConfigError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`);
    this.name = "MissingSupabaseConfigError";
  }
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new MissingSupabaseConfigError(name);
  }

  return value;
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export async function createSupabaseServerClient() {
  assertServerOnly("createSupabaseServerClient");

  const cookieStore = await cookies();

  return createServerClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), getSupabasePublicKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot write cookies; middleware refreshes sessions.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot write cookies; middleware refreshes sessions.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  assertServerOnly("createSupabaseAdminClient");

  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
