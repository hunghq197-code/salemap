"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveSecurityEvent } from "@/lib/admin/data/security";

export async function resolveSecurityEventAction(eventId: string) {
  try {
    await resolveSecurityEvent(eventId);
    revalidatePath("/admin/audit-logs");
  } catch {
    redirect("/admin/audit-logs?error=resolve_failed");
  }

  redirect("/admin/audit-logs?updated=resolved");
}
