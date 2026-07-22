"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  FEATURE_OVERRIDE_FIELDS,
  QUOTA_OVERRIDE_FIELDS,
  removeUserFeatureOverride,
  removeUserQuotaOverride,
  setUserFeatureOverride,
  setUserQuotaOverride,
} from "@/lib/admin/data/quotas";

export async function saveQuotaOverrideAction(formData: FormData) {
  const userId = String(formData.get("userId") || "");

  try {
    await setUserQuotaOverride({
      reason: String(formData.get("reason") || ""),
      userId,
      ...Object.fromEntries(
        QUOTA_OVERRIDE_FIELDS.map((field) => [field.key, formData.get(field.key)]),
      ),
    });
    revalidatePath("/admin/quotas");
  } catch {
    redirect("/admin/quotas?error=quota_failed");
  }

  redirect("/admin/quotas?updated=quota");
}

export async function saveFeatureOverrideAction(formData: FormData) {
  const userId = String(formData.get("userId") || "");

  try {
    await setUserFeatureOverride({
      reason: String(formData.get("reason") || ""),
      userId,
      ...Object.fromEntries(
        FEATURE_OVERRIDE_FIELDS.map((field) => [field.key, formData.get(field.key)]),
      ),
    });
    revalidatePath("/admin/quotas");
  } catch {
    redirect("/admin/quotas?error=feature_failed");
  }

  redirect("/admin/quotas?updated=feature");
}

export async function removeQuotaOverrideAction(userId: string) {
  try {
    await removeUserQuotaOverride(userId);
    revalidatePath("/admin/quotas");
  } catch {
    redirect("/admin/quotas?error=remove_quota_failed");
  }

  redirect("/admin/quotas?updated=quota_removed");
}

export async function removeFeatureOverrideAction(userId: string) {
  try {
    await removeUserFeatureOverride(userId);
    revalidatePath("/admin/quotas");
  } catch {
    redirect("/admin/quotas?error=remove_feature_failed");
  }

  redirect("/admin/quotas?updated=feature_removed");
}
