"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/data/notifications";

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    await markNotificationAsRead(notificationId);
    revalidatePath("/app/notifications");
    revalidatePath("/app");
  } catch {
    redirect("/app/notifications?toast=error");
  }

  redirect("/app/notifications?toast=notification_marked_read");
}

export async function markAllNotificationsAsReadAction() {
  try {
    await markAllNotificationsAsRead();
    revalidatePath("/app/notifications");
    revalidatePath("/app");
  } catch {
    redirect("/app/notifications?toast=error");
  }

  redirect("/app/notifications?toast=notification_all_marked_read");
}
