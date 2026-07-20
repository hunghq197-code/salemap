import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminProfile = {
  full_name: string | null;
  id: string;
  is_admin: boolean | null;
  user_id: string;
};

export type AdminContext = {
  email: string | null;
  profile: AdminProfile;
  userId: string;
};

export class AdminAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id,user_id,full_name,is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      email: user.email ?? null,
      profile: {
        full_name: null,
        id: "",
        is_admin: false,
        user_id: user.id,
      },
      userId: user.id,
    };
  }

  return {
    email: user.email ?? null,
    profile: profile as AdminProfile,
    userId: user.id,
  };
}

export async function isCurrentUserAdmin() {
  const context = await getAdminContext();

  return Boolean(context?.profile.is_admin);
}

export async function requireAdmin() {
  const context = await getAdminContext();

  if (!context) {
    redirect("/login");
  }

  if (!context.profile.is_admin) {
    redirect("/app/dashboard");
  }

  return context;
}

export async function requireAdminForApi() {
  const context = await getAdminContext();

  if (!context) {
    throw new AdminAuthError(401, "UNAUTHORIZED");
  }

  if (!context.profile.is_admin) {
    throw new AdminAuthError(403, "FORBIDDEN");
  }

  return context;
}
