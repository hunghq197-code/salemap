import { z } from "zod";
import { cmsContentTypeValues, cmsPostStatusValues } from "@/lib/cms/cms-status";
import { sanitizeCmsText } from "@/lib/cms/sanitize-content";

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const pathSchema = z
  .string()
  .trim()
  .regex(/^\/[a-z0-9][a-z0-9/_-]*$/)
  .max(220);

export const cmsPostFormSchema = z.object({
  canonicalPath: pathSchema.optional().or(z.literal("")),
  contentText: z.preprocess((value) => sanitizeCmsText(value, 50000), z.string().max(50000)),
  contentType: z.enum(cmsContentTypeValues),
  excerpt: z.preprocess((value) => sanitizeCmsText(value, 500), z.string().max(500).optional()),
  featuredImageAlt: z.string().trim().max(180).optional().or(z.literal("")),
  featuredImageUrl: z.string().url().optional().or(z.literal("")),
  noindex: z.boolean().optional(),
  ogDescription: z.string().trim().max(220).optional().or(z.literal("")),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  ogTitle: z.string().trim().max(80).optional().or(z.literal("")),
  primaryCategoryId: z.string().uuid().optional().or(z.literal("")),
  scheduledAt: z.string().trim().optional().or(z.literal("")),
  seoDescription: z.string().trim().max(170).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  slug: slugSchema,
  status: z.enum(cmsPostStatusValues),
  title: z.string().trim().min(3).max(180),
});

export const cmsRedirectSchema = z.object({
  destinationPath: pathSchema,
  isActive: z.boolean().optional(),
  sourcePath: pathSchema,
  statusCode: z.enum(["301", "302"]).transform((value) => Number(value) as 301 | 302),
});

export type CmsPostFormInput = z.infer<typeof cmsPostFormSchema>;
export type CmsRedirectInput = z.infer<typeof cmsRedirectSchema>;
