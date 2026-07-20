import { Bell, Mail } from "lucide-react";
import { updateNotificationSettingsAction } from "@/app/app/settings/actions";
import {
  DAILY_DIGEST_TIME_OPTIONS,
  REMINDER_EMAIL_MINUTES_BEFORE_OPTIONS,
  type NotificationSettings,
} from "@/lib/data/notification-settings";

type NotificationSettingsFormProps = {
  emailNotificationsEnabled?: boolean;
  settings: NotificationSettings;
};

const reminderMinuteLabels: Record<number, string> = {
  0: "Đúng thời điểm",
  15: "Trước 15 phút",
  30: "Trước 30 phút",
  60: "Trước 1 giờ",
};

const disabledMessage =
  "Tính năng này đang được mở dần. Vui lòng quay lại sau.";

export function NotificationSettingsForm({
  emailNotificationsEnabled = true,
  settings,
}: NotificationSettingsFormProps) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
          <Bell aria-hidden="true" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-ink">Cài đặt thông báo</h2>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Chọn cách SaleMap nhắc bạn xử lý follow-up để không bỏ sót khách.
          </p>
        </div>
      </div>

      <form action={updateNotificationSettingsAction} className="mt-6 space-y-5">
        <div className="grid gap-3">
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-cloud/60 p-4">
            <input
              className="mt-1 h-5 w-5 rounded border-slate-300 text-ocean focus:ring-ocean"
              defaultChecked={settings.in_app_notification_enabled}
              name="inAppNotificationEnabled"
              type="checkbox"
              value="true"
            />
            <span>
              <span className="block text-sm font-bold text-ink">
                Bật thông báo trong app
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                Hiển thị thông báo trong trung tâm thông báo SaleMap.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-cloud/60 p-4">
            <input
              className="mt-1 h-5 w-5 rounded border-slate-300 text-ocean focus:ring-ocean disabled:opacity-50"
              defaultChecked={emailNotificationsEnabled && settings.email_reminder_enabled}
              disabled={!emailNotificationsEnabled}
              name="emailReminderEnabled"
              type="checkbox"
              value="true"
            />
            <span>
              <span className="block text-sm font-bold text-ink">
                Bật email nhắc follow-up
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                {emailNotificationsEnabled
                  ? "Gửi email khi follow-up đến hạn nếu email provider đã cấu hình."
                  : disabledMessage}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-cloud/60 p-4">
            <input
              className="mt-1 h-5 w-5 rounded border-slate-300 text-ocean focus:ring-ocean disabled:opacity-50"
              defaultChecked={emailNotificationsEnabled && settings.daily_digest_enabled}
              disabled={!emailNotificationsEnabled}
              name="dailyDigestEnabled"
              type="checkbox"
              value="true"
            />
            <span>
              <span className="block text-sm font-bold text-ink">
                Bật email tổng hợp việc hôm nay
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                {emailNotificationsEnabled
                  ? "Mỗi sáng nhận danh sách follow-up cần xử lý trong ngày."
                  : disabledMessage}
              </span>
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold text-ink">
            Thời điểm gửi email nhắc
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15 disabled:bg-slate-50 disabled:text-slate-400"
              defaultValue={settings.reminder_email_minutes_before}
              disabled={!emailNotificationsEnabled}
              name="reminderEmailMinutesBefore"
            >
              {REMINDER_EMAIL_MINUTES_BEFORE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {reminderMinuteLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-ink">
            Giờ gửi email tổng hợp
            <select
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15 disabled:bg-slate-50 disabled:text-slate-400"
              defaultValue={settings.daily_digest_time}
              disabled={!emailNotificationsEnabled}
              name="dailyDigestTime"
            >
              {DAILY_DIGEST_TIME_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] sm:w-auto"
          type="submit"
        >
          <Mail aria-hidden="true" className="h-5 w-5" />
          Lưu cài đặt thông báo
        </button>
      </form>
    </section>
  );
}
