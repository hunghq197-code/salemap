import { resendEmailProvider } from "@/lib/providers/email/resend";
import type { EmailProvider } from "@/lib/providers/email/types";

export function getEmailProvider(): EmailProvider {
  return resendEmailProvider;
}

export type { EmailProvider, SendEmailInput, SendEmailResult } from "@/lib/providers/email/types";
