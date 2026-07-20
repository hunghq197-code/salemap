import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdminAuthUser = {
  created_at?: string;
  email?: string;
  id: string;
};

export type AdminUserProfile = {
  full_name?: string | null;
  goals?: string[] | null;
  id?: string;
  industry?: string | null;
  is_admin?: boolean | null;
  onboarding_completed?: boolean | null;
  primary_city?: string | null;
  primary_district?: string | null;
  role_type?: string | null;
  user_id: string;
};

export async function listAuthUsers(limit = 1000) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: limit,
  });

  if (error) {
    return [] as AdminAuthUser[];
  }

  return (data.users ?? []).map((user) => ({
    created_at: user.created_at,
    email: user.email,
    id: user.id,
  })) satisfies AdminAuthUser[];
}

export async function listProfiles() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id,user_id,full_name,role_type,industry,primary_city,primary_district,goals,onboarding_completed,is_admin",
    );

  if (error) {
    return [] as AdminUserProfile[];
  }

  return (data ?? []) as AdminUserProfile[];
}

export async function listUserIdRows(table: string, select = "user_id") {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(table).select(select).limit(10000);

  if (error) {
    return [] as Array<{ user_id?: string | null; [key: string]: unknown }>;
  }

  return (data ?? []) as unknown as Array<{
    user_id?: string | null;
    [key: string]: unknown;
  }>;
}

export function toUserEmailMap(users: AdminAuthUser[]) {
  return new Map(users.map((user) => [user.id, user.email ?? ""]));
}

export function toProfileMap(profiles: AdminUserProfile[]) {
  return new Map(profiles.map((profile) => [profile.user_id, profile]));
}

export function countRowsByUser(rows: Array<{ user_id?: string | null }>) {
  const result = new Map<string, number>();

  rows.forEach((row) => {
    if (!row.user_id) {
      return;
    }

    result.set(row.user_id, (result.get(row.user_id) ?? 0) + 1);
  });

  return result;
}

export function getUserLabel(
  userId: string | null | undefined,
  profileMap: Map<string, AdminUserProfile>,
  emailMap: Map<string, string>,
) {
  if (!userId) {
    return "Không rõ user";
  }

  const profile = profileMap.get(userId);

  return profile?.full_name || emailMap.get(userId) || userId;
}

export function slicePage<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;

  return items.slice(start, start + limit);
}
