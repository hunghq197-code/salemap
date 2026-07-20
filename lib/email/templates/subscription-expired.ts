import { getSiteUrl } from "@/lib/site-url";

export type SubscriptionExpiredEmailInput = {
  fullName?: string | null;
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

export function buildSubscriptionExpiredEmail(input: SubscriptionExpiredEmailInput) {
  const siteUrl = getSiteUrl();
  const billingUrl = `${siteUrl}/app/billing`;
  const subject = "Gói SaleMap của bạn đã hết hạn";
  const displayName = input.fullName || "bạn";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px;margin:0 0 12px">Gói SaleMap đã hết hạn</h1>
      <p>Chào ${escapeHtml(displayName)},</p>
      <p>Gói <strong>${escapeHtml(input.planName)}</strong> của bạn đã hết hạn. Tài khoản hiện đang sử dụng quota Free.</p>
      <p>Bạn có thể gia hạn bất cứ lúc nào trong trang Gói sử dụng.</p>
      <p>
        <a href="${escapeHtml(billingUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700">
          Xem gói sử dụng
        </a>
      </p>
    </div>
  `;
  const text = [
    subject,
    `Chào ${displayName},`,
    `Gói ${input.planName} của bạn đã hết hạn. Tài khoản hiện đang sử dụng quota Free.`,
    `Xem gói sử dụng: ${billingUrl}`,
  ].join("\n\n");

  return { html, subject, text };
}
