import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const authRoutes = new Set(["/login", "/register"]);

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/app");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAuthRoute = authRoutes.has(pathname);

  if (!isAppRoute && !isOnboardingRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    return NextResponse.next();
  }

  const { response, supabase } = createSupabaseMiddlewareClient(request);

  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({
    data: { user: null },
  }));

  if (!user) {
    if (isAppRoute || isOnboardingRoute) {
      return redirectTo(request, "/login");
    }

    return response;
  }

  let profile: { onboarding_completed?: boolean | null } | null = null;

  try {
    const profileResult = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    profile = profileResult.data;
  } catch {
    profile = null;
  }

  const onboardingCompleted = Boolean(profile?.onboarding_completed);

  if (isAppRoute && !onboardingCompleted) {
    return redirectTo(request, "/onboarding");
  }

  if (isOnboardingRoute && onboardingCompleted) {
    return redirectTo(request, "/app/dashboard");
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/onboarding", "/login", "/register"],
};
