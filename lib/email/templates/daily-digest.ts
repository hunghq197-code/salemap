import { getSiteUrl } from "@/lib/site-url";

export type DailyDigestEmailItem = {
  actionUrl?: string;
  leadName?: string | null;
  remindAt: string;
  title: string;
};

export type DailyDigestEmailInput = {
  fullName?: string | null;
  items: DailyDigestEmailItem[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function buildDailyDigestEmail(input: DailyDigestEmailInput) {
  const siteUrl = getSiteUrl();
  const appUrl = `${siteUrl}/app/reminders`;
  const subject = "Việc follow-up hôm nay của bạn trên SaleMap";
  const displayName = input.fullName || "bạn";
  const itemsHtml = input.items
    .map((item) => {
      const actionUrl = item.actionUrl || appUrl;

      return `
        <li style="margin:0 0 14px">
          <strong>${escapeHtml(item.title)}</strong><br />
          <span>Lead: ${escapeHtml(item.leadName || "Chưa có tên")}</span><br />
          <span>Thời gian: ${escapeHtml(formatTime(item.remindAt))}</span><br />
          <a href="${escapeHtml(actionUrl)}" style="color:#0369a1;font-weight:700">Xem lead</a>
        </li>
      `;
    })
    .join("");
  const textItems = input.items
    .map((item) =>
      [
        `- ${item.title}`,
        `  Lead: ${item.leadName || "Chưa có tên"}`,
        `  Thời gian: ${formatTime(item.remindAt)}`,
        `  Link: ${item.actionUrl || appUrl}`,
      ].join("\n"),
    )
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px;margin:0 0 12px">Việc follow-up hôm nay</h1>
      <p>Chào ${escapeHtml(displayName)},</p>
      <p>Hôm nay bạn có <strong>${input.items.length}</strong> việc follow-up cần xử lý.</p>
      <ol style="padding-left:22px">${itemsHtml}</ol>
      <p>
        <a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700">
          Mở SaleMap
        </a>
      </p>
    </div>
  `;
  const text = [
    subject,
    `Chào ${displayName},`,
    `Hôm nay bạn có ${input.items.length} việc follow-up cần xử lý.`,
    textItems,
    `Mở SaleMap: ${appUrl}`,
  ].join("\n\n");

  return { html, subject, text };
}
