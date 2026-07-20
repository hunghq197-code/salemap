"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminInviteCode,
  setAdminInviteCodeActive,
} from "@/lib/admin/data/invite-codes";

export async function createInviteCodeAction(formData: FormData) {
  try {
    await createAdminInviteCode({
      assignedEmail: String(formData.get("assignedEmail") || ""),
      assignedPhone: String(formData.get("assignedPhone") || ""),
      code: String(formData.get("code") || ""),
      cohortId: String(formData.get("cohortId") || ""),
      description: String(formData.get("description") || ""),
      expiresAt: String(formData.get("expiresAt") || ""),
      isActive: formData.get("isActive") === "true",
      label: String(formData.get("label") || ""),
      maxUses: Number(formData.get("maxUses") || 1),
      source: String(formData.get("source") || ""),
    });
    revalidatePath("/admin/invite-codes");
  } catch {
    redirect("/admin/invite-codes?error=1");
  }

  redirect("/admin/invite-codes?created=1");
}

export async function toggleInviteCodeAction(
  inviteCodeId: string,
  isActive: boolean,
) {
  try {
    await setAdminInviteCodeActive(inviteCodeId, isActive);
    revalidatePath("/admin/invite-codes");
  } catch {
    redirect("/admin/invite-codes?error=1");
  }

  redirect("/admin/invite-codes");
}
