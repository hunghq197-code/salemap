import { getSiteUrl } from "@/lib/site-url";

export type ReminderDueEmailInput = {
  actionUrl?: string;
  description?: string | null;
  leadName?: string | null;
  leadPhone?: string | null;
  remindAt: string;
  reminderTitle: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function buildReminderDueEmail(input: ReminderDueEmailInput) {
  const siteUrl = getSiteUrl();
  const actionUrl = input.actionUrl || `${siteUrl}/app/reminders`;
  const leadName = input.leadName || "Lead chưa có tên";
  const description = input.description ? input.description.slice(0, 320) : "";
  const subject = "Bạn có follow-up cần xử lý hôm nay";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px;margin:0 0 12px">Bạn có follow-up cần xử lý</h1>
      <p style="margin:0 0 16px">SaleMap nhắc bạn chăm sóc khách đúng thời điểm.</p>
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>${escapeHtml(input.reminderTitle)}</strong></p>
        <p style="margin:0 0 6px">Lead: ${escapeHtml(leadName)}</p>
        ${
          input.leadPhone
            ? `<p style="margin:0 0 6px">SĐT: ${escapeHtml(input.leadPhone)}</p>`
            : ""
        }
        <p style="margin:0 0 6px">Thời gian: ${escapeHtml(formatDateTime(input.remindAt))}</p>
        ${
          description
            ? `<p style="margin:12px 0 0;color:#475569">${escapeHtml(description)}</p>`
            : ""
        }
      </div>
      <p>
        <a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700">
          Xem lead trong SaleMap
        </a>
      </p>
    </div>
  `;
  const text = [
    subject,
    `Reminder: ${input.reminderTitle}`,
    `Lead: ${leadName}`,
    input.leadPhone ? `SĐT: ${input.leadPhone}` : "",
    `Thời gian: ${formatDateTime(input.remindAt)}`,
    description ? `Nội dung: ${description}` : "",
    `Xem lead: ${actionUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, subject, text };
}
