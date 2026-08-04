import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { isBetaInviteOnlyMode } from "@/lib/data/beta-invites";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type UserProfileRow = {
  full_name?: string | null;
};

function safeNextPath(value: string | null, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}

function getAuthSourcePath(value: string | null) {
  return value === "register" ? "/register" : "/login";
}

function redirectWithAuthError(
  requestUrl: URL,
  source: string | null,
  authError: "google-cancelled" | "google-invite-required" | "google-login-failed",
) {
  const url = new URL(getAuthSourcePath(source), requestUrl.origin);
  url.searchParams.set("authError", authError);

  return NextResponse.redirect(url);
}

function getProviderErrorCode(requestUrl: URL) {
  const errorCode = [
    requestUrl.searchParams.get("error"),
    requestUrl.searchParams.get("error_code"),
    requestUrl.searchParams.get("error_description"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return errorCode.includes("access_denied") ? "google-cancelled" : "google-login-failed";
}

function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, 160);
}

function getGoogleDisplayName(user: User) {
  const metadata = user.user_metadata ?? {};

  return (
    normalizeDisplayName(metadata.full_name) ||
    normalizeDisplayName(metadata.name) ||
    normalizeDisplayName(metadata.display_name) ||
    normalizeDisplayName(user.email?.split("@")[0]) ||
    null
  );
}

async function getUserProfile(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserProfileRow | null;
}

async function ensureGoogleUserProfile(
  supabase: SupabaseServerClient,
  user: User,
) {
  const profile = await getUserProfile(supabase, user.id);
  const fullName = getGoogleDisplayName(user);

  if (!profile && isBetaInviteOnlyMode()) {
    await supabase.auth.signOut();

    return false;
  }

  if (!profile) {
    const { error } = await supabase.from("user_profiles").upsert(
      {
        full_name: fullName,
        user_id: user.id,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  if (!profile.full_name && fullName) {
    await supabase
      .from("user_profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);
  }

  return true;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const provider = requestUrl.searchParams.get("provider");
  const source = requestUrl.searchParams.get("source");
  const isGoogleProvider = provider === "google";
  const next = safeNextPath(
    requestUrl.searchParams.get("next"),
    isGoogleProvider ? "/app/dashboard" : "/update-password",
  );

  if (
    isGoogleProvider &&
    (requestUrl.searchParams.has("error") || requestUrl.searchParams.has("error_code"))
  ) {
    return redirectWithAuthError(requestUrl, source, getProviderErrorCode(requestUrl));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (isGoogleProvider) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return redirectWithAuthError(requestUrl, source, "google-login-failed");
        }

        try {
          const canContinue = await ensureGoogleUserProfile(supabase, user);

          if (!canContinue) {
            return redirectWithAuthError(requestUrl, source, "google-invite-required");
          }
        } catch {
          return redirectWithAuthError(requestUrl, source, "google-login-failed");
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    if (isGoogleProvider) {
      return redirectWithAuthError(requestUrl, source, "google-login-failed");
    }
  }

  return NextResponse.redirect(new URL("/forgot-password?error=invalid-link", requestUrl.origin));
}
