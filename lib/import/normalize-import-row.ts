import type { ImportableLeadFieldKey } from "@/lib/constants/import";
import type { FieldMapping } from "@/lib/import/field-mapping";
import { normalizeHeader } from "@/lib/import/field-mapping";

export type NormalizedImportLead = {
  address?: string;
  category?: string;
  email?: string;
  initial_note?: string;
  name?: string;
  next_follow_up_at?: string;
  phone?: string;
  priority?: string;
  source?: string;
  status?: string;
  tags?: string[];
  website?: string;
};

function cleanText(value?: string) {
  return (value ?? "").trim();
}

function getMappedValue(
  rawRow: Record<string, string>,
  fieldMapping: FieldMapping,
  fieldKey: ImportableLeadFieldKey,
) {
  for (const [header, mappedField] of Object.entries(fieldMapping)) {
    if (mappedField === fieldKey) {
      const value = cleanText(rawRow[header]);
      if (value) return value;
    }
  }

  return "";
}

export function normalizePhone(value?: string) {
  const clean = cleanText(value);
  if (!clean) return undefined;

  const withoutSeparators = clean.replace(/[\s.-]/g, "");
  const onlyPhoneChars = withoutSeparators.replace(/[^\d+]/g, "");

  if (/^\+84\d{8,11}$/.test(onlyPhoneChars)) {
    return `0${onlyPhoneChars.slice(3)}`;
  }

  if (/^84\d{8,11}$/.test(onlyPhoneChars)) {
    return `0${onlyPhoneChars.slice(2)}`;
  }

  return onlyPhoneChars;
}

export function normalizeEmail(value?: string) {
  const clean = cleanText(value).toLowerCase();
  return clean || undefined;
}

export function normalizeWebsite(value?: string) {
  const clean = cleanText(value);
  if (!clean) return undefined;

  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  return `https://${clean}`;
}

function normalizeStatus(value?: string) {
  const normalized = normalizeHeader(cleanText(value));

  if (!normalized) return "new";
  if (["moi", "new", "chua lien he"].includes(normalized)) return "new";
  if (["da lien he", "contacted"].includes(normalized)) return "contacted";
  if (["quan tam", "interested"].includes(normalized)) return "interested";
  if (["hen lai", "follow up", "follow-up"].includes(normalized)) return "follow_up";
  if (["khong phu hop", "not fit", "not_fit"].includes(normalized)) return "not_fit";
  if (["da chot", "won"].includes(normalized)) return "won";
  if (["da mat", "lost"].includes(normalized)) return "lost";

  return "new";
}

function normalizePriority(value?: string) {
  const normalized = normalizeHeader(cleanText(value));

  if (!normalized) return "medium";
  if (["cao", "high"].includes(normalized)) return "high";
  if (["trung binh", "medium"].includes(normalized)) return "medium";
  if (["thap", "low"].includes(normalized)) return "low";

  return "medium";
}

function parseFollowUpDate(value?: string) {
  const clean = cleanText(value);
  if (!clean) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const dashMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  const match = slashMatch ?? dashMatch;

  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];

    return `${year}-${month}-${day}`;
  }

  return clean;
}

function normalizeTags(value?: string) {
  return Array.from(
    new Set(
      cleanText(value)
        .split(/[,;\n]/g)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}

export function normalizeImportRow(
  rawRow: Record<string, string>,
  fieldMapping: FieldMapping,
): NormalizedImportLead {
  const phone = normalizePhone(getMappedValue(rawRow, fieldMapping, "phone"));
  const email = normalizeEmail(getMappedValue(rawRow, fieldMapping, "email"));
  const website = normalizeWebsite(getMappedValue(rawRow, fieldMapping, "website"));
  let name = cleanText(getMappedValue(rawRow, fieldMapping, "name")) || undefined;

  if (!name && phone) {
    name = `Khách chưa đặt tên - ${phone}`;
  }

  if (!name && email) {
    name = `Khách chưa đặt tên - ${email}`;
  }

  const tags = normalizeTags(getMappedValue(rawRow, fieldMapping, "tags"));

  return {
    address: cleanText(getMappedValue(rawRow, fieldMapping, "address")) || undefined,
    category: cleanText(getMappedValue(rawRow, fieldMapping, "category")) || undefined,
    email,
    initial_note: cleanText(getMappedValue(rawRow, fieldMapping, "initial_note")) || undefined,
    name,
    next_follow_up_at: parseFollowUpDate(
      getMappedValue(rawRow, fieldMapping, "next_follow_up_at"),
    ),
    phone,
    priority: normalizePriority(getMappedValue(rawRow, fieldMapping, "priority")),
    source: cleanText(getMappedValue(rawRow, fieldMapping, "source")) || undefined,
    status: normalizeStatus(getMappedValue(rawRow, fieldMapping, "status")),
    tags: tags.length > 0 ? tags : undefined,
    website,
  };
}
