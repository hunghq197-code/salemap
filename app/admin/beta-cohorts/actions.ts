"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addManualCohortMember,
  createBetaCohort,
  updateCohortMember,
} from "@/lib/admin/data/beta-cohorts";

export async function createBetaCohortAction(formData: FormData) {
  try {
    await createBetaCohort({
      cohortKey: String(formData.get("cohortKey") || ""),
      description: String(formData.get("description") || ""),
      name: String(formData.get("name") || ""),
      status: String(formData.get("status") || "planning"),
      targetUserCount: Number(formData.get("targetUserCount") || 0),
    });
    revalidatePath("/admin/beta-cohorts");
  } catch {
    redirect("/admin/beta-cohorts?error=1");
  }

  redirect("/admin/beta-cohorts");
}

export async function addManualCohortMemberAction(cohortId: string, formData: FormData) {
  try {
    await addManualCohortMember(cohortId, {
      email: String(formData.get("email") || ""),
      industry: String(formData.get("industry") || ""),
      name: String(formData.get("name") || ""),
      personaLabel: String(formData.get("personaLabel") || ""),
      phoneZalo: String(formData.get("phoneZalo") || ""),
      roleType: String(formData.get("roleType") || ""),
    });
    revalidatePath(`/admin/beta-cohorts/${cohortId}`);
  } catch {
    redirect(`/admin/beta-cohorts/${cohortId}?error=1`);
  }

  redirect(`/admin/beta-cohorts/${cohortId}`);
}

export async function updateCohortMemberAction(
  cohortId: string,
  memberId: string,
  formData: FormData,
) {
  try {
    await updateCohortMember(memberId, {
      adminNote: String(formData.get("adminNote") || ""),
      interviewStatus: String(formData.get("interviewStatus") || "not_scheduled"),
      inviteStatus: String(formData.get("inviteStatus") || "not_invited"),
    });
    revalidatePath(`/admin/beta-cohorts/${cohortId}`);
  } catch {
    redirect(`/admin/beta-cohorts/${cohortId}?error=1`);
  }

  redirect(`/admin/beta-cohorts/${cohortId}`);
}
