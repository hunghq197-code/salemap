type SupabaseMaybeError = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

const MISSING_SCHEMA_CODES = new Set([
  "42P01",
  "42703",
  "PGRST200",
  "PGRST204",
  "PGRST205",
]);

export function isMissingSupabaseSchema(
  error: SupabaseMaybeError | null | undefined,
  tableNames: string[] = [],
) {
  if (!error) {
    return false;
  }

  const text = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    Boolean(error.code && MISSING_SCHEMA_CODES.has(error.code)) ||
    text.includes("schema cache") ||
    text.includes("could not find the table") ||
    tableNames.some((tableName) => text.includes(tableName.toLowerCase()))
  );
}
