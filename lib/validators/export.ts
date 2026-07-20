import { z } from "zod";
import { EXPORT_FIELDS } from "@/lib/constants/export";

const allowedFields = EXPORT_FIELDS.map((field) => field.key) as [
  (typeof EXPORT_FIELDS)[number]["key"],
  ...(typeof EXPORT_FIELDS)[number]["key"][],
];

const optionalText = z.string().trim().max(120).optional().or(z.literal(""));

export const exportLeadsSchema = z.object({
  filters: z
    .object({
      fromDate: optionalText,
      source: optionalText,
      status: optionalText,
      tagId: optionalText,
      toDate: optionalText,
    })
    .default({}),
  selectedFields: z.array(z.enum(allowedFields)).min(1).max(EXPORT_FIELDS.length),
});

export type ExportLeadsInput = z.infer<typeof exportLeadsSchema>;
