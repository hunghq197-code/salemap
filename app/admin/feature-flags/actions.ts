"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setFeatureFlag } from "@/lib/data/feature-flags";

export async function toggleFeatureFlagAction(flagKey: string, enabled: boolean) {
  try {
    await setFeatureFlag(flagKey, enabled);
    revalidatePath("/admin/feature-flags");
    revalidatePath("/app");
  } catch {
    redirect("/admin/feature-flags?error=1");
  }

  redirect("/admin/feature-flags");
}
