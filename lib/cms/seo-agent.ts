import "server-only";

import { z } from "zod";
import { createCmsPost } from "@/lib/cms/posts";
import { sanitizeCmsText } from "@/lib/cms/sanitize-content";
import { getAIProvider } from "@/lib/providers/ai/provider";
import {
  cmsSeoAgentFormSchema,
  type CmsSeoAgentInput,
} from "@/lib/validators/cms";

const generatedSeoPostSchema = z.object({
  contentText: z.string().trim().min(600).max(50000),
  excerpt: z.string().trim().min(40).max(700),
  featuredImageAlt: z.string().trim().max(220).optional().or(z.literal("")),
  ogDescription: z.string().trim().min(40).max(260),
  ogTitle: z.string().trim().min(3).max(120),
  seoDescription: z.string().trim().min(40).max(220),
  seoTitle: z.string().trim().min(3).max(120),
  slug: z.string().trim().min(3).max(160),
  title: z.string().trim().min(3).max(220),
});

function trimTo(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function slugify(value: string) {
  const slug = value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120)
    .replace(/-+$/g, "");

  return slug || "salemap-seo-post";
}

function parseGeneratedJson(text: string) {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("CMS_SEO_AGENT_INVALID_JSON");
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as unknown;
  }
}

function buildSystemPrompt() {
  return [
    "You are SaleMap's senior SEO CMS agent.",
    "Create useful, people-first Vietnamese content for field sales teams, small businesses, and SaaS buyers.",
    "Follow Google Search Central principles: be helpful, specific, concise, trustworthy, and avoid keyword stuffing.",
    "Return strict JSON only. Do not wrap it in markdown.",
    "The JSON shape must be:",
    '{"title":"","slug":"","excerpt":"","contentText":"","seoTitle":"","seoDescription":"","ogTitle":"","ogDescription":"","featuredImageAlt":""}',
    "contentText may use markdown-style ## and ### headings plus dash lists. Do not use HTML.",
    "Use short paragraphs, concrete examples, and practical next steps. Avoid unsupported facts, invented statistics, and exaggerated claims.",
    "seoTitle should be at most 65 characters. seoDescription should be about 140-160 characters. ogDescription should be under 200 characters.",
  ].join("\n");
}

function buildUserPrompt(input: CmsSeoAgentInput) {
  return [
    `Topic: ${input.topic}`,
    `Primary keyword: ${input.primaryKeyword}`,
    `Secondary keywords: ${input.secondaryKeywords || "none"}`,
    `Audience: ${input.audience}`,
    `Search intent: ${input.searchIntent}`,
    `SaleMap/editorial notes: ${input.notes || "none"}`,
    "",
    "Write a CMS blog post for salemap.io.vn.",
    "The post should help readers solve a real sales/customer-management problem before mentioning SaleMap.",
    "Naturally connect the topic to SaleMap only where relevant: finding customers on maps, lead management, reminders, pipeline, follow-up, import/export, and admin operations.",
    "Include 4-6 sections with ## headings and one practical checklist or bullet list.",
  ].join("\n");
}

function normalizeGeneratedPost(raw: unknown, input: CmsSeoAgentInput) {
  const generated = generatedSeoPostSchema.parse(raw);
  const slug = slugify(generated.slug || input.primaryKeyword || input.topic);
  const title = trimTo(sanitizeCmsText(generated.title, 180), 180);
  const contentText = sanitizeCmsText(generated.contentText, 50000);

  if (contentText.length < 600) {
    throw new Error("CMS_SEO_AGENT_CONTENT_TOO_SHORT");
  }

  return {
    canonicalPath: `/blog/${slug}`,
    contentText,
    excerpt: trimTo(sanitizeCmsText(generated.excerpt, 500), 500),
    featuredImageAlt: trimTo(
      sanitizeCmsText(generated.featuredImageAlt || `Minh họa cho ${title}`, 180),
      180,
    ),
    ogDescription: trimTo(sanitizeCmsText(generated.ogDescription, 220), 220),
    ogTitle: trimTo(sanitizeCmsText(generated.ogTitle || title, 80), 80),
    seoDescription: trimTo(sanitizeCmsText(generated.seoDescription, 170), 170),
    seoTitle: trimTo(sanitizeCmsText(generated.seoTitle || title, 70), 70),
    slug,
    title,
  };
}

function formDataToSeoAgentInput(formData: FormData) {
  return {
    audience: formData.get("audience") || "",
    notes: formData.get("notes") || "",
    primaryCategoryId: formData.get("primaryCategoryId") || "",
    primaryKeyword: formData.get("primaryKeyword") || "",
    searchIntent: formData.get("searchIntent") || "informational",
    secondaryKeywords: formData.get("secondaryKeywords") || "",
    topic: formData.get("topic") || "",
  };
}

function buildCmsPostFormData(input: {
  generatedPost: ReturnType<typeof normalizeGeneratedPost>;
  primaryCategoryId?: string;
}) {
  const formData = new FormData();

  formData.set("canonicalPath", input.generatedPost.canonicalPath);
  formData.set("contentText", input.generatedPost.contentText);
  formData.set("contentType", "post");
  formData.set("excerpt", input.generatedPost.excerpt);
  formData.set("featuredImageAlt", input.generatedPost.featuredImageAlt);
  formData.set("featuredImageUrl", "");
  formData.set("ogDescription", input.generatedPost.ogDescription);
  formData.set("ogImageUrl", "");
  formData.set("ogTitle", input.generatedPost.ogTitle);
  formData.set("primaryCategoryId", input.primaryCategoryId || "");
  formData.set("scheduledAt", "");
  formData.set("seoDescription", input.generatedPost.seoDescription);
  formData.set("seoTitle", input.generatedPost.seoTitle);
  formData.set("slug", input.generatedPost.slug);
  formData.set("status", "review");
  formData.set("title", input.generatedPost.title);

  return formData;
}

export async function createSeoCmsDraftPost(input: {
  formData: FormData;
  request?: Request;
}) {
  const parsed = cmsSeoAgentFormSchema.parse(formDataToSeoAgentInput(input.formData));
  const result = await getAIProvider().generateText({
    maxTokens: 2800,
    metadata: {
      primaryKeyword: parsed.primaryKeyword,
      searchIntent: parsed.searchIntent,
      source: "cms_seo_agent",
    },
    systemPrompt: buildSystemPrompt(),
    temperature: 0.42,
    userPrompt: buildUserPrompt(parsed),
  });
  const generatedPost = normalizeGeneratedPost(parseGeneratedJson(result.text), parsed);
  const cmsPostFormData = buildCmsPostFormData({
    generatedPost,
    primaryCategoryId: parsed.primaryCategoryId || undefined,
  });

  return createCmsPost({
    auditMetadata: {
      aiModel: result.modelName || null,
      primaryKeyword: parsed.primaryKeyword,
      searchIntent: parsed.searchIntent,
      source: "cms_seo_agent",
      tokensInput: result.tokensInput || null,
      tokensOutput: result.tokensOutput || null,
    },
    formData: cmsPostFormData,
    request: input.request,
  });
}
