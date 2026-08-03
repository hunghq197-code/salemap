"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assignCustomerTag,
  createAndAssignCustomerTag,
  createCustomerNote,
  deleteCustomerNote,
  removeCustomerTag,
  updateCustomerLifecycle,
} from "@/lib/admin/data/customers";

function customerPath(userId: string, suffix = "") {
  return `/admin/customers/${userId}${suffix}`;
}

export async function updateCustomerLifecycleAction(
  userId: string,
  formData: FormData,
) {
  try {
    await updateCustomerLifecycle({ formData, userId });
    revalidatePath("/admin/customers");
    revalidatePath(customerPath(userId));
  } catch {
    redirect(customerPath(userId, "?error=lifecycle_failed"));
  }

  redirect(customerPath(userId, "?updated=lifecycle"));
}

export async function createCustomerNoteAction(userId: string, formData: FormData) {
  try {
    await createCustomerNote({ formData, userId });
    revalidatePath(customerPath(userId));
  } catch {
    redirect(customerPath(userId, "?error=note_failed"));
  }

  redirect(customerPath(userId, "?updated=note"));
}

export async function deleteCustomerNoteAction(userId: string, noteId: string) {
  try {
    await deleteCustomerNote({ noteId, userId });
    revalidatePath(customerPath(userId));
  } catch {
    redirect(customerPath(userId, "?error=delete_note_failed"));
  }

  redirect(customerPath(userId, "?updated=note_deleted"));
}

export async function createAndAssignCustomerTagAction(
  userId: string,
  formData: FormData,
) {
  try {
    await createAndAssignCustomerTag({ formData, userId });
    revalidatePath("/admin/customers");
    revalidatePath(customerPath(userId));
  } catch {
    redirect(customerPath(userId, "?error=tag_failed"));
  }

  redirect(customerPath(userId, "?updated=tag"));
}

export async function assignCustomerTagAction(userId: string, formData: FormData) {
  try {
    await assignCustomerTag({ formData, userId });
    revalidatePath("/admin/customers");
    revalidatePath(customerPath(userId));
  } catch {
    redirect(customerPath(userId, "?error=assign_tag_failed"));
  }

  redirect(customerPath(userId, "?updated=tag"));
}

export async function removeCustomerTagAction(userId: string, tagId: string) {
  try {
    await removeCustomerTag({ tagId, userId });
    revalidatePath("/admin/customers");
    revalidatePath(customerPath(userId));
  } catch {
    redirect(customerPath(userId, "?error=remove_tag_failed"));
  }

  redirect(customerPath(userId, "?updated=tag_removed"));
}
