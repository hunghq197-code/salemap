"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  updateAdminUserAccountStatus,
  type UserAccountStatus,
} from "@/lib/admin/data/users";

async function updateStatus(
  userId: string,
  status: UserAccountStatus,
  formData?: FormData,
) {
  try {
    await updateAdminUserAccountStatus(userId, status, {
      reason: String(formData?.get("reason") || ""),
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
  } catch {
    redirect(`/admin/users/${userId}?error=status_failed`);
  }

  redirect(`/admin/users/${userId}?updated=status`);
}

export async function suspendUserAction(userId: string, formData: FormData) {
  await updateStatus(userId, "suspended", formData);
}

export async function unsuspendUserAction(userId: string, formData: FormData) {
  await updateStatus(userId, "active", formData);
}
