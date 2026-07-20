"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateQaChecklistStatus } from "@/lib/admin/data/qa-checklist";

export async function updateQaChecklistAction(checklistKey: string, formData: FormData) {
  try {
    await updateQaChecklistStatus(
      checklistKey,
      String(formData.get("status") || "pending"),
    );
    revalidatePath("/admin/qa");
  } catch {
    redirect("/admin/qa?error=1");
  }

  redirect("/admin/qa");
}
