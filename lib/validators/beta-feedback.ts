import { z } from "zod";

export const FEEDBACK_TYPE_OPTIONS = [
  { label: "Báo lỗi", value: "bug" },
  { label: "Khó sử dụng", value: "ux_issue" },
  { label: "Đề xuất tính năng", value: "feature_request" },
  { label: "Góp ý chung", value: "general_feedback" },
  { label: "Điểm thích nhất", value: "positive" },
] as const;

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, "Nội dung quá dài.")
    .optional()
    .or(z.literal(""));

export const betaFeedbackSchema = z.object({
  browserInfo: optionalText(500),
  content: z.string().trim().min(5, "Vui lòng nhập nội dung góp ý.").max(3000),
  deviceType: optionalText(80),
  feedbackType: z.enum(["bug", "ux_issue", "feature_request", "general_feedback", "positive"]),
  pagePath: optionalText(300),
  rating: z.coerce.number().int().min(1).max(5).optional().or(z.literal("")),
  title: optionalText(160),
});

export type BetaFeedbackInput = z.infer<typeof betaFeedbackSchema>;
