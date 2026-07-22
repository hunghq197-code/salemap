"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/data/feature-flags";
import { updateNotificationSettings } from "@/lib/data/notification-settings";
import { createDemoDataForUser } from "@/lib/data/onboarding";

export async function createSampleDataAction() {
  let toast: "sample_data_created" | "sample_data_skipped" = "sample_data_created";

  if (!(await isFeatureEnabled("sample_data"))) {
    redirect("/app/settings?toast=feature_disabled");
  }

  try {
    const result = await createDemoDataForUser();
    toast = result.status === "skipped" ? "sample_data_skipped" : "sample_data_created";
    revalidatePath("/app/dashboard");
    revalidatePath("/app/leads");
    revalidatePath("/app/tasks");
    revalidatePath("/app/settings");
  } catch {
    redirect("/app/settings?toast=sample_data_failed");
  }

  redirect(`/app/settings?toast=${toast}`);
}

export async function updateNotificationSettingsAction(formData: FormData) {
  try {
    const emailNotificationsEnabled = await isFeatureEnabled("email_notifications");

    await updateNotificationSettings({
      dailyDigestEnabled:
        emailNotificationsEnabled && formData.get("dailyDigestEnabled") === "true",
      dailyDigestTime: String(formData.get("dailyDigestTime") || "08:00"),
      emailReminderEnabled:
        emailNotificationsEnabled && formData.get("emailReminderEnabled") === "true",
      inAppNotificationEnabled: formData.get("inAppNotificationEnabled") === "true",
      reminderEmailMinutesBefore: Number(
        formData.get("reminderEmailMinutesBefore") || 0,
      ),
    });
    revalidatePath("/app/settings");
    revalidatePath("/app/notifications");
    revalidatePath("/app");
  } catch {
    redirect("/app/settings?toast=notification_settings_failed");
  }

  redirect("/app/settings?toast=notification_settings_updated");
}
