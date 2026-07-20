"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { completeReminder, snoozeReminder } from "@/lib/data/reminders";
import { reminderTabSchema } from "@/lib/validators/reminder";

function cleanTab(tab: string) {
  const parsed = reminderTabSchema.safeParse(tab);
  return parsed.success ? parsed.data : "today";
}

export async function completeReminderAction(reminderId: string, tab: string) {
  const currentTab = cleanTab(tab);

  try {
    await completeReminder(reminderId);
    revalidatePath("/app/reminders");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/leads");
  } catch {
    redirect(`/app/reminders?tab=${currentTab}&toast=error`);
  }

  redirect(`/app/reminders?tab=${currentTab}&toast=reminder_completed`);
}

export async function snoozeReminderAction(reminderId: string, tab: string) {
  const currentTab = cleanTab(tab);

  try {
    await snoozeReminder(reminderId);
    revalidatePath("/app/reminders");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/leads");
  } catch {
    redirect(`/app/reminders?tab=${currentTab}&toast=error`);
  }

  redirect(`/app/reminders?tab=upcoming&toast=reminder_snoozed`);
}
