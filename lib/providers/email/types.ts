export type SendEmailInput = {
  html: string;
  subject: string;
  text?: string;
  to: string;
};

export type SendEmailResult = {
  id?: string;
  skipped?: boolean;
  success: boolean;
};

export type EmailProvider = {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
};
