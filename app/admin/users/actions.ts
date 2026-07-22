"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  updateAdminUserAccountStatus,
  type UserAccountStatus,
} from "@/lib/admin/data/users";

async function updateStatus(userId: string, status: UserAccountStatus) {
  try {
    await updateAdminUserAccountStatus(userId, status);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
  } catch {
    redirect(`/admin/users/${userId}?error=status_failed`);
  }

  redirect(`/admin/users/${userId}?updated=status`);
}

export async function suspendUserAction(userId: string) {
  await updateStatus(userId, "suspended");
}

export async function unsuspendUserAction(userId: string) {
  await updateStatus(userId, "active");
}
