import { getSiteUrl } from "@/lib/site-url";

export type SubscriptionRenewalReminderEmailInput = {
  fullName?: string | null;
  periodEnd: string;
  planName: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function buildSubscriptionRenewalReminderEmail(
  input: SubscriptionRenewalReminderEmailInput,
) {
  const siteUrl = getSiteUrl();
  const billingUrl = `${siteUrl}/app/billing`;
  const subject = "Gói SaleMap của bạn sắp hết hạn";
  const displayName = input.fullName || "bạn";
  const endDate = formatDate(input.periodEnd);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px;margin:0 0 12px">Gói SaleMap sắp hết hạn</h1>
      <p>Chào ${escapeHtml(displayName)},</p>
      <p>Gói <strong>${escapeHtml(input.planName)}</strong> của bạn sẽ hết hạn vào <strong>${escapeHtml(endDate)}</strong>.</p>
      <p>Gia hạn để tiếp tục sử dụng quota tìm khách và xuất dữ liệu theo gói hiện tại.</p>
      <p>
        <a href="${escapeHtml(billingUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700">
          Gia hạn gói
        </a>
      </p>
    </div>
  `;
  const text = [
    subject,
    `Chào ${displayName},`,
    `Gói ${input.planName} của bạn sẽ hết hạn vào ${endDate}.`,
    "Gia hạn để tiếp tục sử dụng quota tìm khách và xuất dữ liệu theo gói hiện tại.",
    `Gia hạn gói: ${billingUrl}`,
  ].join("\n\n");

  return { html, subject, text };
}
