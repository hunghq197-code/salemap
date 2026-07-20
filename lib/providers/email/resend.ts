import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/providers/email/types";

type ResendResponse = {
  id?: string;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  return { apiKey, from };
}

export const resendEmailProvider: EmailProvider = {
  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const { apiKey, from } = getEmailConfig();

    if (!apiKey || !from) {
      return { skipped: true, success: false };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
          from,
          html: input.html,
          subject: input.subject,
          text: input.text,
          to: input.to,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        console.error("Resend email failed", {
          status: response.status,
          statusText: response.statusText,
        });

        return { success: false };
      }

      const data = (await response.json().catch(() => ({}))) as ResendResponse;

      return { id: data.id, success: true };
    } catch (error) {
      console.error("Resend email failed", error);

      return { success: false };
    }
  },
};
