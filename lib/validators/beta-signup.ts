import { z } from "zod";

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(maxLength).optional(),
  );

const optionalEmail = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().email("Email không hợp lệ.").max(254).optional(),
);

const requiredTrimmedString = (message: string, maxLength?: number) => {
  let schema = z.string().trim().min(1, message);

  if (maxLength) {
    schema = schema.max(maxLength, `Thông tin này không được vượt quá ${maxLength} ký tự.`);
  }

  return z.preprocess((value) => (typeof value === "string" ? value : ""), schema);
};

export const betaSignupSchema = z.object({
  fullName: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z
      .string()
      .trim()
    .min(2, "Họ tên cần có ít nhất 2 ký tự.")
    .max(120, "Họ tên không được vượt quá 120 ký tự."),
  ),
  phoneZalo: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z
      .string()
      .trim()
    .min(8, "Số điện thoại/Zalo cần có ít nhất 8 ký tự.")
    .max(30, "Số điện thoại/Zalo không được vượt quá 30 ký tự."),
  ),
  email: optionalEmail,
  currentRole: requiredTrimmedString("Vui lòng chọn vai trò hiện tại."),
  industry: requiredTrimmedString("Vui lòng chọn ngành đang bán."),
  mainArea: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z
      .string()
      .trim()
    .min(2, "Khu vực hoạt động cần có ít nhất 2 ký tự.")
    .max(150, "Khu vực hoạt động không được vượt quá 150 ký tự."),
  ),
  desiredFeatures: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z
      .array(z.string().trim().min(1))
      .min(1, "Vui lòng chọn ít nhất một tính năng muốn dùng."),
  ),
  betaReadiness: requiredTrimmedString("Vui lòng chọn mức độ sẵn sàng."),
  utm_source: optionalTrimmedString(200),
  utm_medium: optionalTrimmedString(200),
  utm_campaign: optionalTrimmedString(200),
  utm_content: optionalTrimmedString(200),
  referrer: optionalTrimmedString(1000),
});

export type BetaSignupInput = z.infer<typeof betaSignupSchema>;
