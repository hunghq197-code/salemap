import { redirect } from "next/navigation";
import { writeSecurityEvent } from "@/lib/admin/audit-log";
import {
  hasPermission,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin/admin-permissions";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminProfile = {
  account_status?: string | null;
  full_name: string | null;
  id: string;
  is_admin?: boolean | null;
  user_id: string;
};

export type AdminContext = {
  email: string | null;
  profile: AdminProfile;
  role: AdminRole;
  userId: string;
};

type AdminUserRow = {
  is_active?: boolean | null;
  role?: string | null;
  user_id: string;
};

export class AdminAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

function isAdminRole(value?: string | null): value is AdminRole {
  return value === "super_admin" || value === "admin" || value === "support";
}

function hasRequiredRole(role: AdminRole, requiredRoles: AdminRole[]) {
  return requiredRoles.length === 0 || requiredRoles.includes(role);
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getAdminRole(userId?: string | null): Promise<AdminRole | null> {
  const safeUserId = userId || (await getCurrentUser())?.id;

  if (!safeUserId) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id,role,is_active")
      .eq("user_id", safeUserId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const role = (data as AdminUserRow).role;

    return isAdminRole(role) ? role : null;
  } catch {
    return null;
  }
}

export async function getAdminContext(
  requiredRoles: AdminRole[] = ["super_admin", "admin", "support"],
): Promise<AdminContext | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const role = await getAdminRole(user.id);

  if (!role || !hasRequiredRole(role, requiredRoles)) {
    await writeSecurityEvent({
      eventType: "admin_access_denied",
      message: "Admin role missing or insufficient.",
      metadata: {
        requiredRoles,
      },
      severity: "warning",
      userId: user.id,
    });
    return null;
  }

  let profile: AdminProfile = {
    account_status: null,
    full_name: null,
    id: "",
    is_admin: true,
    user_id: user.id,
  };

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("id,user_id,full_name,is_admin,account_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      profile = {
        ...(data as AdminProfile),
        is_admin: true,
      };
    }
  } catch {
    // Admin role is decided by admin_users. Profile is display-only.
  }

  return {
    email: user.email ?? null,
    profile,
    role,
    userId: user.id,
  };
}

export async function isAdminUser(
  userId: string,
  requiredRoles: AdminRole[] = ["super_admin", "admin", "support"],
) {
  const role = await getAdminRole(userId);

  return Boolean(role && hasRequiredRole(role, requiredRoles));
}

export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();

  return user ? isAdminUser(user.id) : false;
}

export async function requireAdmin(
  requiredRoles: AdminRole[] = ["super_admin", "admin", "support"],
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const context = await getAdminContext(requiredRoles);

  if (!context) {
    redirect("/app/dashboard");
  }

  return context;
}

export async function assertAdmin(
  requiredRoles: AdminRole[] = ["super_admin", "admin", "support"],
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new AdminAuthError(401, "UNAUTHORIZED");
  }

  const context = await getAdminContext(requiredRoles);

  if (!context) {
    throw new AdminAuthError(403, "FORBIDDEN");
  }

  return context;
}

export async function requireAdminForApi(
  requiredRoles: AdminRole[] = ["super_admin", "admin", "support"],
) {
  return assertAdmin(requiredRoles);
}

export async function requirePermission(permission: AdminPermission) {
  const context = await assertAdmin();

  if (!hasPermission(context.role, permission)) {
    await writeSecurityEvent({
      eventType: "admin_access_denied",
      message: "Admin permission denied.",
      metadata: {
        permission,
      },
      severity: "warning",
      userId: context.userId,
    });
    throw new AdminAuthError(403, "FORBIDDEN");
  }

  return context;
}
