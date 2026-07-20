import {
  IMPORTABLE_LEAD_FIELDS,
  type ImportableLeadFieldKey,
} from "@/lib/constants/import";

export type FieldMapping = Record<string, ImportableLeadFieldKey | null>;

export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const aliasMap = new Map<string, ImportableLeadFieldKey>(
  IMPORTABLE_LEAD_FIELDS.flatMap((field) =>
    field.aliases.map((alias) => [normalizeHeader(alias), field.key] as const),
  ),
);

export function suggestFieldMapping(headers: string[]): FieldMapping {
  const usedFields = new Set<ImportableLeadFieldKey>();

  return headers.reduce<FieldMapping>((mapping, header) => {
    const fieldKey = aliasMap.get(normalizeHeader(header)) ?? null;

    if (fieldKey && !usedFields.has(fieldKey)) {
      mapping[header] = fieldKey;
      usedFields.add(fieldKey);
      return mapping;
    }

    mapping[header] = null;
    return mapping;
  }, {});
}

export function sanitizeFieldMapping(mapping: Record<string, unknown>): FieldMapping {
  return Object.entries(mapping).reduce<FieldMapping>((result, [header, value]) => {
    const field = typeof value === "string" ? value : null;
    const allowed = IMPORTABLE_LEAD_FIELDS.some((item) => item.key === field);

    result[header] = allowed ? (field as ImportableLeadFieldKey) : null;
    return result;
  }, {});
}
