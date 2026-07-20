import { z } from "zod";
import { DEFAULT_LEAD_PRIORITY } from "@/lib/constants/lead-priority";
import { DEFAULT_LEAD_STATUS } from "@/lib/constants/lead-status";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (maxLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(maxLength, "Nội dung quá dài.").optional(),
  );

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên lead cần ít nhất 2 ký tự.")
    .max(160, "Tên lead quá dài."),
  phone: optionalText(40),
  email: z.preprocess(
    emptyToUndefined,
    z.string().trim().email("Email chưa đúng định dạng.").max(160).optional(),
  ),
  website: optionalText(200),
  address: optionalText(300),
  source: optionalText(80).default("manual"),
  status: z
    .enum(["new", "contacted", "interested", "follow_up", "not_fit", "won", "lost"])
    .default(DEFAULT_LEAD_STATUS),
  priority: z.enum(["low", "medium", "high"]).default(DEFAULT_LEAD_PRIORITY),
  category: optionalText(120),
  noteSummary: optionalText(500),
  newTags: optionalText(240),
  tagIds: z.array(z.string().uuid()).max(12).default([]),
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;

export function parseLeadFormData(formData: FormData) {
  return leadFormSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    address: formData.get("address"),
    source: formData.get("source") || "manual",
    status: formData.get("status") || DEFAULT_LEAD_STATUS,
    priority: formData.get("priority") || DEFAULT_LEAD_PRIORITY,
    category: formData.get("category"),
    noteSummary: formData.get("noteSummary"),
    newTags: formData.get("newTags"),
    tagIds: formData.getAll("tagIds"),
  });
}
