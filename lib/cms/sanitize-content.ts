const BLOCKED_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "style",
  "link",
  "meta",
];

export function sanitizeCmsText(value: unknown, maxLength = 50000) {
  const raw = typeof value === "string" ? value : "";
  const withoutBlockedTags = BLOCKED_TAGS.reduce(
    (current, tag) =>
      current.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), ""),
    raw,
  );

  return withoutBlockedTags
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}

export function excerptFromContent(content: string, maxLength = 180) {
  return content.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function splitCmsParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
