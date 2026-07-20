import { requireAdmin } from "@/lib/admin/auth";
import {
  countRowsByUser,
  listAuthUsers,
  listProfiles,
  listUserIdRows,
  slicePage,
  toProfileMap,
} from "@/lib/admin/data/common";
import {
  getPaging,
  getParam,
  normalizeText,
  toListResult,
  type AdminSearchParams,
} from "@/lib/admin/data/utils";

export type AdminUserRow = {
  area: string;
  createdAt?: string;
  email: string;
  feedbackCount: number;
  fullName: string;
  industry: string;
  isAdmin: boolean;
  leadCount: number;
  mapSearchCount: number;
  noteCount: number;
  onboardingCompleted: boolean;
  reminderCount: number;
  roleType: string;
  routeSearchCount: number;
  upgradeInterestCount: number;
  userId: string;
};

function matchesDateRange(value: string | undefined, from?: string, to?: string) {
  if (!value) {
    return true;
  }

  const date = value.slice(0, 10);

  if (from && date < from) {
    return false;
  }

  if (to && date > to) {
    return false;
  }

  return true;
}

export async function getAdminUsers(params?: AdminSearchParams) {
  await requireAdmin();

  const { limit, page } = getPaging(params);
  const q = normalizeText(getParam(params, "q"));
  const role = getParam(params, "role") || "";
  const industry = getParam(params, "industry") || "";
  const onboarding = getParam(params, "onboarding") || "";
  const fromDate = getParam(params, "fromDate") || "";
  const toDate = getParam(params, "toDate") || "";

  const [
    users,
    profiles,
    leads,
    notes,
    reminders,
    mapSearches,
    routes,
    feedback,
    interests,
  ] = await Promise.all([
    listAuthUsers(),
    listProfiles(),
    listUserIdRows("leads", "user_id"),
    listUserIdRows("lead_notes", "user_id"),
    listUserIdRows("reminders", "user_id"),
    listUserIdRows("map_searches", "user_id"),
    listUserIdRows("routes", "user_id"),
    listUserIdRows("beta_feedback", "user_id"),
    listUserIdRows("upgrade_interests", "user_id"),
  ]);

  const profileMap = toProfileMap(profiles);
  const leadCounts = countRowsByUser(leads);
  const noteCounts = countRowsByUser(notes);
  const reminderCounts = countRowsByUser(reminders);
  const mapCounts = countRowsByUser(mapSearches);
  const routeCounts = countRowsByUser(routes);
  const feedbackCounts = countRowsByUser(feedback);
  const interestCounts = countRowsByUser(interests);

  const rows: AdminUserRow[] = users.map((user) => {
    const profile = profileMap.get(user.id);

    return {
      area: [profile?.primary_city, profile?.primary_district].filter(Boolean).join(" - "),
      createdAt: user.created_at,
      email: user.email || "",
      feedbackCount: feedbackCounts.get(user.id) ?? 0,
      fullName: profile?.full_name || "",
      industry: profile?.industry || "",
      isAdmin: Boolean(profile?.is_admin),
      leadCount: leadCounts.get(user.id) ?? 0,
      mapSearchCount: mapCounts.get(user.id) ?? 0,
      noteCount: noteCounts.get(user.id) ?? 0,
      onboardingCompleted: Boolean(profile?.onboarding_completed),
      reminderCount: reminderCounts.get(user.id) ?? 0,
      roleType: profile?.role_type || "",
      routeSearchCount: routeCounts.get(user.id) ?? 0,
      upgradeInterestCount: interestCounts.get(user.id) ?? 0,
      userId: user.id,
    };
  });

  const filtered = rows.filter((row) => {
    if (q && !normalizeText(`${row.email} ${row.fullName}`).includes(q)) {
      return false;
    }

    if (role && row.roleType !== role) {
      return false;
    }

    if (industry && row.industry !== industry) {
      return false;
    }

    if (onboarding === "true" && !row.onboardingCompleted) {
      return false;
    }

    if (onboarding === "false" && row.onboardingCompleted) {
      return false;
    }

    return matchesDateRange(row.createdAt, fromDate, toDate);
  });

  const sorted = filtered.sort((a, b) =>
    String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
  );

  return {
    filters: {
      industries: Array.from(new Set(rows.map((row) => row.industry).filter(Boolean))).sort(),
      roles: Array.from(new Set(rows.map((row) => row.roleType).filter(Boolean))).sort(),
    },
    result: toListResult(slicePage(sorted, page, limit), sorted.length, page, limit),
    selectedUser: getParam(params, "selectedUser")
      ? sorted.find((row) => row.userId === getParam(params, "selectedUser")) ?? null
      : null,
  };
}
