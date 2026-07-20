import type { NormalizedImportLead } from "@/lib/import/normalize-import-row";

export type ImportValidationError = {
  code: string;
  field: string;
  message: string;
};

export type ImportValidationResult = {
  errors: ImportValidationError[];
  valid: boolean;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 9;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidImportDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

export function validateImportLead(row: NormalizedImportLead): ImportValidationResult {
  const errors: ImportValidationError[] = [];

  if (!row.name && !row.phone && !row.email && !row.website) {
    errors.push({
      code: "MISSING_CONTACT",
      field: "name",
      message: "Thiếu tên khách hoặc thông tin liên hệ.",
    });
  }

  if (row.email && !isValidEmail(row.email)) {
    errors.push({
      code: "INVALID_EMAIL",
      field: "email",
      message: "Email không hợp lệ.",
    });
  }

  if (row.phone && !isValidPhone(row.phone)) {
    errors.push({
      code: "INVALID_PHONE",
      field: "phone",
      message: "Số điện thoại không hợp lệ.",
    });
  }

  if (row.website && !isValidUrl(row.website)) {
    errors.push({
      code: "INVALID_WEBSITE",
      field: "website",
      message: "Website không hợp lệ.",
    });
  }

  if (row.next_follow_up_at && !isValidImportDate(row.next_follow_up_at)) {
    errors.push({
      code: "INVALID_FOLLOW_UP_DATE",
      field: "next_follow_up_at",
      message: "Ngày follow-up không đúng định dạng.",
    });
  }

  if (row.name && row.name.length > 255) {
    errors.push({
      code: "NAME_TOO_LONG",
      field: "name",
      message: "Tên khách quá dài.",
    });
  }

  if (row.address && row.address.length > 1000) {
    errors.push({
      code: "ADDRESS_TOO_LONG",
      field: "address",
      message: "Địa chỉ quá dài.",
    });
  }

  if (row.initial_note && row.initial_note.length > 5000) {
    errors.push({
      code: "NOTE_TOO_LONG",
      field: "initial_note",
      message: "Ghi chú quá dài.",
    });
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}
