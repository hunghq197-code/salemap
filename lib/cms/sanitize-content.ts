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

export type CmsContentBlock =
  | {
      text: string;
      type: "h2" | "h3" | "paragraph";
    }
  | {
      items: string[];
      type: "list";
    };

export function parseCmsContentBlocks(content: string): CmsContentBlock[] {
  return splitCmsParagraphs(content).map((block) => {
    if (block.startsWith("### ")) {
      return {
        text: block.replace(/^###\s+/, "").trim(),
        type: "h3",
      };
    }

    if (block.startsWith("## ")) {
      return {
        text: block.replace(/^##\s+/, "").trim(),
        type: "h2",
      };
    }

    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 1 && lines.every((line) => line.startsWith("- "))) {
      return {
        items: lines.map((line) => line.replace(/^-\s+/, "").trim()),
        type: "list",
      };
    }

    return {
      text: block,
      type: "paragraph",
    };
  });
}
