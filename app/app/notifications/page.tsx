import { Bell, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/app/app/notifications/actions";
import { NotificationCenterTracker } from "@/components/notifications/NotificationCenterTracker";
import { Toast } from "@/components/ui/Toast";
import { getNotifications } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function safeActionUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith("/app/") ? value : "/app/notifications";
}

export default async function NotificationsPage(props: NotificationsPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(getString(searchParams?.page)) || 1;
  const unreadOnly = getString(searchParams?.unreadOnly) === "true";
  const notifications = await getNotifications({
    page,
    unreadOnly,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <NotificationCenterTracker />
      <Toast code={getString(searchParams?.toast)} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Notification center
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Thông báo
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Theo dõi các nhắc việc follow-up và cập nhật quan trọng trong SaleMap.
          </p>
        </div>
        <form action={markAllNotificationsAsReadAction}>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:border-ocean hover:text-ocean"
            type="submit"
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          className={[
            "inline-flex min-h-10 items-center rounded-lg px-4 py-2 text-sm font-bold",
            unreadOnly ? "border border-slate-200 bg-white text-ink" : "bg-ink text-white",
          ].join(" ")}
          href="/app/notifications"
        >
          Tất cả
        </Link>
        <Link
          className={[
            "inline-flex min-h-10 items-center rounded-lg px-4 py-2 text-sm font-bold",
            unreadOnly ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink",
          ].join(" ")}
          href="/app/notifications?unreadOnly=true"
        >
          Chưa đọc
        </Link>
      </div>

      {notifications.items.length > 0 ? (
        <div className="mt-5 space-y-4">
          {notifications.items.map((notification) => {
            const isUnread = !notification.read_at;
            const markReadAction = markNotificationAsReadAction.bind(null, notification.id);
            const actionUrl = safeActionUrl(notification.action_url);

            return (
              <article
                className={[
                  "rounded-lg border bg-white p-5 shadow-sm",
                  isUnread ? "border-ocean/30" : "border-slate-200",
                ].join(" ")}
                key={notification.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold leading-7 text-ink">
                        {notification.title}
                      </h2>
                      {isUnread ? (
                        <span className="rounded-full bg-ocean/10 px-2.5 py-1 text-xs font-bold text-ocean">
                          Chưa đọc
                        </span>
                      ) : null}
                    </div>
                    {notification.content ? (
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {notification.content}
                      </p>
                    ) : null}
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {actionUrl ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink hover:border-ocean hover:text-ocean"
                        href={actionUrl}
                      >
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        Xem lead
                      </Link>
                    ) : null}
                    {isUnread ? (
                      <form action={markReadAction}>
                        <button
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-bold text-ink hover:bg-[#5de0b3]"
                          type="submit"
                        >
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                          Đã đọc
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mint/15 text-ocean">
            <Bell aria-hidden="true" className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink">
            Bạn chưa có thông báo nào.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
            Khi có follow-up đến hạn hoặc digest hằng ngày, thông báo sẽ xuất hiện ở đây.
          </p>
        </section>
      )}

      {notifications.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink",
              notifications.page <= 1 ? "pointer-events-none opacity-50" : "hover:border-ocean",
            ].join(" ")}
            href={`/app/notifications?page=${Math.max(1, notifications.page - 1)}${
              unreadOnly ? "&unreadOnly=true" : ""
            }`}
          >
            Trước
          </Link>
          <p className="text-sm font-bold text-slate-500">
            Trang {notifications.page}/{notifications.totalPages}
          </p>
          <Link
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink",
              notifications.page >= notifications.totalPages
                ? "pointer-events-none opacity-50"
                : "hover:border-ocean",
            ].join(" ")}
            href={`/app/notifications?page=${Math.min(
              notifications.totalPages,
              notifications.page + 1,
            )}${unreadOnly ? "&unreadOnly=true" : ""}`}
          >
            Sau
          </Link>
        </div>
      ) : null}
    </div>
  );
}
