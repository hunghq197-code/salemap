import "server-only";

import { z } from "zod";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import { createCmsPost } from "@/lib/cms/posts";
import { sanitizeCmsText } from "@/lib/cms/sanitize-content";
import { getAIProvider } from "@/lib/providers/ai/provider";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  cmsSeoAgentFormSchema,
  cmsSeoAgentSearchIntentValues,
  type CmsSeoAgentInput,
} from "@/lib/validators/cms";

const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const DEFAULT_IMAGE_MODEL = "gpt-image-1-mini";
const DEFAULT_IMAGE_SIZE = "1536x1024";
const DEFAULT_CMS_MEDIA_BUCKET = "cms-media";
const MIN_REVIEW_SCORE = 80;

const keywordPlanSchema = z.object({
  audienceNeed: z.string().trim().min(10).max(400),
  rationale: z.string().trim().min(10).max(500),
  searchIntent: z.enum(cmsSeoAgentSearchIntentValues),
  secondaryKeywords: z.array(z.string().trim().min(2).max(80)).max(8),
  selectedKeyword: z.string().trim().min(2).max(120),
});

const generatedSeoPostSchema = z.object({
  imagePrompt: z.string().trim().min(40).max(1200),
  keywordPlan: keywordPlanSchema,
  post: z.object({
    contentText: z.string().trim().min(900).max(50000),
    excerpt: z.string().trim().min(40).max(700),
    featuredImageAlt: z.string().trim().max(220).optional().or(z.literal("")),
    ogDescription: z.string().trim().min(40).max(260),
    ogTitle: z.string().trim().min(3).max(120),
    seoDescription: z.string().trim().min(40).max(220),
    seoTitle: z.string().trim().min(3).max(120),
    slug: z.string().trim().min(3).max(160),
    title: z.string().trim().min(3).max(220),
  }),
});

type SeoQaCheck = {
  detail: string;
  key: string;
  passed: boolean;
  score: number;
};

type SeoQaResult = {
  checks: SeoQaCheck[];
  passed: boolean;
  score: number;
};

type ImageAssetResult = {
  errorCode?: string;
  mediaId?: string;
  prompt: string;
  publicUrl?: string;
  status: "created" | "disabled" | "failed" | "skipped";
};

function trimTo(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeText(value?: string | null) {
  return value?.trim() || "";
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

function getKeywordOccurrences(content: string, keyword: string) {
  const normalizedKeyword = keyword.toLowerCase().trim();

  if (!normalizedKeyword) {
    return 0;
  }

  return content.toLowerCase().split(normalizedKeyword).length - 1;
}

function buildSystemPrompt() {
  return [
    "You are SaleMap's senior SEO CMS agent.",
    "Plan one useful Vietnamese SEO article, then write it as a CMS review draft.",
    "Follow Google Search Central principles: people-first, accurate, useful, specific, trustworthy, and no keyword stuffing.",
    "Return strict JSON only. Do not wrap it in markdown.",
    "The JSON shape must be:",
    '{"keywordPlan":{"selectedKeyword":"","secondaryKeywords":[],"searchIntent":"informational","audienceNeed":"","rationale":""},"post":{"title":"","slug":"","excerpt":"","contentText":"","seoTitle":"","seoDescription":"","ogTitle":"","ogDescription":"","featuredImageAlt":""},"imagePrompt":""}',
    "Pick a low-risk keyword angle from the user's goal and seed terms. Do not claim search volume, rankings, or live trend data.",
    "contentText may use markdown-style ## and ### headings plus dash lists. Do not use HTML.",
    "Use short paragraphs, concrete examples, and practical next steps. Avoid unsupported facts, invented statistics, and exaggerated claims.",
    "seoTitle should be at most 65 characters. seoDescription should be about 140-160 characters. ogDescription should be under 200 characters.",
    "imagePrompt must describe a professional 16:9 blog hero image for SaleMap, with no text embedded in the image.",
  ].join("\n");
}

function buildUserPrompt(input: CmsSeoAgentInput) {
  return [
    `Business goal: ${input.businessGoal}`,
    `Optional topic seed: ${safeText(input.topic) || "auto-select"}`,
    `Optional primary keyword seed: ${safeText(input.primaryKeyword) || "auto-select"}`,
    `Optional secondary keyword seeds: ${safeText(input.secondaryKeywords) || "none"}`,
    `Audience: ${input.audience}`,
    `Preferred search intent: ${input.searchIntent}`,
    `SaleMap/editorial notes: ${safeText(input.notes) || "none"}`,
    "",
    "Write one CMS blog post for salemap.io.vn.",
    "The post should help readers solve a real sales/customer-management problem before mentioning SaleMap.",
    "Naturally connect the topic to SaleMap only where relevant: finding customers on maps, lead management, reminders, pipeline, follow-up, import/export, billing readiness, and admin operations.",
    "Include 4-6 sections with ## headings and one practical checklist or bullet list.",
    "Include a short section that gives readers a clear next step they can apply manually even if they do not use SaleMap.",
  ].join("\n");
}

function evaluateSeoDraft(input: {
  contentText: string;
  keyword: string;
  seoDescription: string;
  seoTitle: string;
  title: string;
}) {
  const contentLength = input.contentText.length;
  const keywordOccurrences = getKeywordOccurrences(
    `${input.title}\n${input.seoTitle}\n${input.contentText}`,
    input.keyword,
  );
  const headingCount = (input.contentText.match(/^##\s+/gm) ?? []).length;
  const hasList = /^-\s+/m.test(input.contentText);
  const checks: SeoQaCheck[] = [
    {
      detail: `${contentLength} ký tự`,
      key: "content_depth",
      passed: contentLength >= 1400,
      score: 20,
    },
    {
      detail: `${input.seoTitle.length} ký tự`,
      key: "seo_title_length",
      passed: input.seoTitle.length >= 20 && input.seoTitle.length <= 70,
      score: 15,
    },
    {
      detail: `${input.seoDescription.length} ký tự`,
      key: "seo_description_length",
      passed: input.seoDescription.length >= 120 && input.seoDescription.length <= 170,
      score: 15,
    },
    {
      detail: `${headingCount} heading H2`,
      key: "semantic_structure",
      passed: headingCount >= 3 && hasList,
      score: 20,
    },
    {
      detail: `${keywordOccurrences} lần xuất hiện`,
      key: "keyword_use",
      passed: keywordOccurrences >= 2 && keywordOccurrences <= 12,
      score: 15,
    },
    {
      detail: "Không phát hiện dấu hiệu claim định lượng mạnh cần kiểm chứng",
      key: "unsupported_claims",
      passed: !/(cam kết|đảm bảo|tăng\s+\d+%|giảm\s+\d+%|xếp hạng số 1)/i.test(input.contentText),
      score: 15,
    },
  ];
  const score = checks.reduce(
    (total, check) => total + (check.passed ? check.score : 0),
    0,
  );

  return {
    checks,
    passed: score >= MIN_REVIEW_SCORE,
    score,
  } satisfies SeoQaResult;
}

async function ensureUniqueSlug(baseSlug: string) {
  const supabase = createSupabaseAdminClient();
  const base = baseSlug.slice(0, 112).replace(/-+$/g, "") || "salemap-seo-post";

  for (let index = 0; index < 25; index += 1) {
    const suffix = index === 0 ? "" : `-${index + 1}`;
    const slug = `${base}${suffix}`;
    const { data, error } = await supabase
      .from("cms_posts")
      .select("id")
      .eq("content_type", "post")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return slug;
    }
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, 120).replace(/-+$/g, "");
}

async function normalizeGeneratedPost(raw: unknown, input: CmsSeoAgentInput) {
  const generated = generatedSeoPostSchema.parse(raw);
  const selectedKeyword = trimTo(
    sanitizeCmsText(
      generated.keywordPlan.selectedKeyword ||
        safeText(input.primaryKeyword) ||
        safeText(input.topic) ||
        input.businessGoal,
      120,
    ),
    120,
  );
  const slug = await ensureUniqueSlug(
    slugify(generated.post.slug || selectedKeyword || input.businessGoal),
  );
  const title = trimTo(sanitizeCmsText(generated.post.title, 180), 180);
  const contentText = sanitizeCmsText(generated.post.contentText, 50000);

  if (contentText.length < 900) {
    throw new Error("CMS_SEO_AGENT_CONTENT_TOO_SHORT");
  }

  const normalizedPost = {
    canonicalPath: `/blog/${slug}`,
    contentText,
    excerpt: trimTo(sanitizeCmsText(generated.post.excerpt, 500), 500),
    featuredImageAlt: trimTo(
      sanitizeCmsText(generated.post.featuredImageAlt || `Minh họa cho ${title}`, 180),
      180,
    ),
    ogDescription: trimTo(sanitizeCmsText(generated.post.ogDescription, 220), 220),
    ogTitle: trimTo(sanitizeCmsText(generated.post.ogTitle || title, 80), 80),
    seoDescription: trimTo(sanitizeCmsText(generated.post.seoDescription, 170), 170),
    seoTitle: trimTo(sanitizeCmsText(generated.post.seoTitle || title, 70), 70),
    slug,
    title,
  };
  const qa = evaluateSeoDraft({
    contentText: normalizedPost.contentText,
    keyword: selectedKeyword,
    seoDescription: normalizedPost.seoDescription,
    seoTitle: normalizedPost.seoTitle,
    title: normalizedPost.title,
  });

  return {
    imagePrompt: sanitizeCmsText(generated.imagePrompt, 1200),
    keywordPlan: {
      audienceNeed: sanitizeCmsText(generated.keywordPlan.audienceNeed, 400),
      rationale: sanitizeCmsText(generated.keywordPlan.rationale, 500),
      searchIntent: generated.keywordPlan.searchIntent,
      secondaryKeywords: generated.keywordPlan.secondaryKeywords.map((keyword) =>
        sanitizeCmsText(keyword, 80),
      ),
      selectedKeyword,
    },
    post: normalizedPost,
    qa,
  };
}

function formDataToSeoAgentInput(formData: FormData) {
  return {
    audience: formData.get("audience") || "",
    businessGoal: formData.get("businessGoal") || "",
    generateImage: formData.get("generateImage") === "on",
    notes: formData.get("notes") || "",
    primaryCategoryId: formData.get("primaryCategoryId") || "",
    primaryKeyword: formData.get("primaryKeyword") || "",
    searchIntent: formData.get("searchIntent") || "auto",
    secondaryKeywords: formData.get("secondaryKeywords") || "",
    topic: formData.get("topic") || "",
  };
}

function getImageGenerationConfig() {
  const enabled = process.env.CMS_AI_IMAGE_GENERATION_ENABLED === "true";
  const apiKey = process.env.AI_IMAGE_API_KEY?.trim() || process.env.AI_API_KEY?.trim();

  return {
    apiKey,
    bucket: process.env.CMS_MEDIA_BUCKET?.trim() || DEFAULT_CMS_MEDIA_BUCKET,
    enabled,
    model: process.env.AI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL,
    size: process.env.AI_IMAGE_SIZE?.trim() || DEFAULT_IMAGE_SIZE,
  };
}

async function imageResponseToBuffer(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("CMS_SEO_AGENT_IMAGE_EMPTY_OUTPUT");
  }

  const record = value as { b64_json?: unknown; url?: unknown };

  if (typeof record.b64_json === "string" && record.b64_json) {
    return Buffer.from(record.b64_json, "base64");
  }

  if (typeof record.url === "string" && record.url.startsWith("https://")) {
    const response = await fetch(record.url);

    if (!response.ok) {
      throw new Error("CMS_SEO_AGENT_IMAGE_DOWNLOAD_FAILED");
    }

    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("CMS_SEO_AGENT_IMAGE_EMPTY_OUTPUT");
}

async function generateFeaturedImage(input: {
  altText: string;
  prompt: string;
  slug: string;
  uploadedBy: string;
}): Promise<ImageAssetResult> {
  const config = getImageGenerationConfig();

  if (!input.prompt) {
    return { prompt: input.prompt, status: "skipped" };
  }

  if (!config.enabled) {
    return { prompt: input.prompt, status: "disabled" };
  }

  if (!config.apiKey) {
    return { errorCode: "AI_IMAGE_NOT_CONFIGURED", prompt: input.prompt, status: "failed" };
  }

  try {
    const response = await fetch(OPENAI_IMAGES_URL, {
      body: JSON.stringify({
        model: config.model,
        n: 1,
        prompt: input.prompt,
        size: config.size,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const raw = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        errorCode: "AI_IMAGE_REQUEST_FAILED",
        prompt: input.prompt,
        status: "failed",
      };
    }

    const firstImage = Array.isArray((raw as { data?: unknown[] } | null)?.data)
      ? (raw as { data: unknown[] }).data[0]
      : null;
    const imageBuffer = await imageResponseToBuffer(firstImage);
    const supabase = createSupabaseAdminClient();
    const storagePath = `ai-agent/${input.slug}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from(config.bucket)
      .upload(storagePath, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      return {
        errorCode: "CMS_MEDIA_UPLOAD_FAILED",
        prompt: input.prompt,
        status: "failed",
      };
    }

    const publicUrl = supabase.storage.from(config.bucket).getPublicUrl(storagePath)
      .data.publicUrl;
    const { data: media, error: mediaError } = await supabase
      .from("cms_media")
      .insert({
        alt_text: input.altText,
        file_name: `${input.slug}.png`,
        mime_type: "image/png",
        public_url: publicUrl,
        safe_metadata: {
          model: config.model,
          source: "cms_seo_agent_image",
        },
        size_bytes: imageBuffer.byteLength,
        storage_bucket: config.bucket,
        storage_path: storagePath,
        uploaded_by: input.uploadedBy,
      })
      .select("id")
      .single();

    if (mediaError || !media) {
      return {
        errorCode: "CMS_MEDIA_RECORD_FAILED",
        prompt: input.prompt,
        publicUrl,
        status: "failed",
      };
    }

    return {
      mediaId: String(media.id),
      prompt: input.prompt,
      publicUrl,
      status: "created",
    };
  } catch (error) {
    return {
      errorCode: error instanceof Error ? error.message : "AI_IMAGE_FAILED",
      prompt: input.prompt,
      status: "failed",
    };
  }
}

function buildCmsPostFormData(input: {
  generatedPost: Awaited<ReturnType<typeof normalizeGeneratedPost>>;
  imageAsset: ImageAssetResult;
  primaryCategoryId?: string;
}) {
  const formData = new FormData();
  const status = input.generatedPost.qa.passed ? "review" : "draft";
  const featuredImageUrl = input.imageAsset.publicUrl || "";

  formData.set("canonicalPath", input.generatedPost.post.canonicalPath);
  formData.set("contentText", input.generatedPost.post.contentText);
  formData.set("contentType", "post");
  formData.set("excerpt", input.generatedPost.post.excerpt);
  formData.set("featuredImageAlt", input.generatedPost.post.featuredImageAlt);
  formData.set("featuredImageUrl", featuredImageUrl);
  formData.set("ogDescription", input.generatedPost.post.ogDescription);
  formData.set("ogImageUrl", featuredImageUrl);
  formData.set("ogTitle", input.generatedPost.post.ogTitle);
  formData.set("primaryCategoryId", input.primaryCategoryId || "");
  formData.set("scheduledAt", "");
  formData.set("seoDescription", input.generatedPost.post.seoDescription);
  formData.set("seoTitle", input.generatedPost.post.seoTitle);
  formData.set("slug", input.generatedPost.post.slug);
  formData.set("status", status);
  formData.set("title", input.generatedPost.post.title);

  return formData;
}

export async function createSeoCmsDraftPost(input: {
  formData: FormData;
  request?: Request;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CMS);
  const parsed = cmsSeoAgentFormSchema.parse(formDataToSeoAgentInput(input.formData));
  const result = await getAIProvider().generateText({
    maxTokens: 3600,
    metadata: {
      businessGoal: parsed.businessGoal,
      primaryKeyword: safeText(parsed.primaryKeyword) || null,
      searchIntent: parsed.searchIntent,
      source: "cms_seo_agent",
    },
    responseMimeType: "application/json",
    systemPrompt: buildSystemPrompt(),
    temperature: 0.42,
    userPrompt: buildUserPrompt(parsed),
  });
  const generatedPost = await normalizeGeneratedPost(parseGeneratedJson(result.text), parsed);
  const imageAsset = parsed.generateImage
    ? await generateFeaturedImage({
        altText: generatedPost.post.featuredImageAlt,
        prompt: generatedPost.imagePrompt,
        slug: generatedPost.post.slug,
        uploadedBy: admin.userId,
      })
    : ({ prompt: generatedPost.imagePrompt, status: "skipped" } satisfies ImageAssetResult);
  const cmsPostFormData = buildCmsPostFormData({
    generatedPost,
    imageAsset,
    primaryCategoryId: parsed.primaryCategoryId || undefined,
  });

  return createCmsPost({
    auditMetadata: {
      aiModel: result.modelName || null,
      businessGoal: parsed.businessGoal,
      imageErrorCode: imageAsset.errorCode || null,
      imageStatus: parsed.generateImage ? imageAsset.status : "skipped",
      primaryKeyword: generatedPost.keywordPlan.selectedKeyword,
      qaPassed: generatedPost.qa.passed,
      qaScore: generatedPost.qa.score,
      searchIntent: generatedPost.keywordPlan.searchIntent,
      source: "cms_seo_agent",
      tokensInput: result.tokensInput || null,
      tokensOutput: result.tokensOutput || null,
    },
    formData: cmsPostFormData,
    request: input.request,
  });
}
