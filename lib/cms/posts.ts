import "server-only";

import { writeAdminAuditLog } from "@/lib/admin/audit-log";
import { ADMIN_PERMISSIONS } from "@/lib/admin/admin-permissions";
import { requirePermission } from "@/lib/admin/auth";
import type { CmsContentType, CmsPostStatus } from "@/lib/cms/cms-status";
import { excerptFromContent } from "@/lib/cms/sanitize-content";
import { SafeError } from "@/lib/security/safe-error";
import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { cmsPostFormSchema, cmsRedirectSchema } from "@/lib/validators/cms";

type CmsCategoryRow = {
  description?: string | null;
  id: string;
  name?: string | null;
  slug?: string | null;
};

type CmsPostRow = {
  author_admin_id?: string | null;
  canonical_path?: string | null;
  content_text?: string | null;
  content_type?: CmsContentType | null;
  created_at?: string | null;
  excerpt?: string | null;
  featured_image_alt?: string | null;
  featured_image_url?: string | null;
  id: string;
  noindex?: boolean | null;
  og_description?: string | null;
  og_image_url?: string | null;
  og_title?: string | null;
  primary_category_id?: string | null;
  published_at?: string | null;
  revision_number?: number | null;
  scheduled_at?: string | null;
  seo_description?: string | null;
  seo_title?: string | null;
  slug?: string | null;
  status?: CmsPostStatus | null;
  title?: string | null;
  updated_at?: string | null;
};

type CmsRevisionRow = {
  created_at?: string | null;
  created_by?: string | null;
  id: string;
  revision_number?: number | null;
  status?: string | null;
  title?: string | null;
};

type CmsRedirectRow = {
  created_at?: string | null;
  destination_path?: string | null;
  id: string;
  is_active?: boolean | null;
  source_path?: string | null;
  status_code?: number | null;
};

type CmsTagRow = {
  description?: string | null;
  id: string;
  name?: string | null;
  slug?: string | null;
};

type CmsMediaRow = {
  alt_text?: string | null;
  created_at?: string | null;
  file_name?: string | null;
  id: string;
  mime_type?: string | null;
  public_url?: string | null;
  size_bytes?: number | null;
  status?: string | null;
};

export type CmsCategory = {
  description?: string | null;
  id: string;
  name: string;
  slug: string;
};

export type CmsPost = {
  canonicalPath?: string | null;
  contentText: string;
  contentType: CmsContentType;
  createdAt?: string | null;
  excerpt: string;
  featuredImageAlt?: string | null;
  featuredImageUrl?: string | null;
  id: string;
  noindex: boolean;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  ogTitle?: string | null;
  primaryCategoryId?: string | null;
  publishedAt?: string | null;
  revisionNumber: number;
  scheduledAt?: string | null;
  seoDescription?: string | null;
  seoTitle?: string | null;
  slug: string;
  status: CmsPostStatus;
  title: string;
  updatedAt?: string | null;
};

export type CmsRevision = {
  createdAt?: string | null;
  createdBy?: string | null;
  id: string;
  revisionNumber: number;
  status: string;
  title: string;
};

export type CmsRedirect = {
  createdAt?: string | null;
  destinationPath: string;
  id: string;
  isActive: boolean;
  sourcePath: string;
  statusCode: 301 | 302;
};

export type CmsTag = {
  description?: string | null;
  id: string;
  name: string;
  slug: string;
};

export type CmsMedia = {
  altText?: string | null;
  createdAt?: string | null;
  fileName: string;
  id: string;
  mimeType: string;
  publicUrl?: string | null;
  sizeBytes: number;
  status: string;
};

export type CmsPostDetail = CmsPost & {
  category?: CmsCategory | null;
  revisions: CmsRevision[];
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mapCategory(row: CmsCategoryRow): CmsCategory {
  return {
    description: row.description ?? null,
    id: row.id,
    name: row.name || "",
    slug: row.slug || "",
  };
}

function mapPost(row: CmsPostRow): CmsPost {
  const contentText = row.content_text || "";
  const excerpt = row.excerpt || excerptFromContent(contentText);

  return {
    canonicalPath: row.canonical_path ?? null,
    contentText,
    contentType: row.content_type || "post",
    createdAt: row.created_at ?? null,
    excerpt,
    featuredImageAlt: row.featured_image_alt ?? null,
    featuredImageUrl: row.featured_image_url ?? null,
    id: row.id,
    noindex: Boolean(row.noindex),
    ogDescription: row.og_description ?? null,
    ogImageUrl: row.og_image_url ?? null,
    ogTitle: row.og_title ?? null,
    primaryCategoryId: row.primary_category_id ?? null,
    publishedAt: row.published_at ?? null,
    revisionNumber: Number(row.revision_number ?? 1),
    scheduledAt: row.scheduled_at ?? null,
    seoDescription: row.seo_description ?? null,
    seoTitle: row.seo_title ?? null,
    slug: row.slug || "",
    status: row.status || "draft",
    title: row.title || "",
    updatedAt: row.updated_at ?? null,
  };
}

function mapRevision(row: CmsRevisionRow): CmsRevision {
  return {
    createdAt: row.created_at ?? null,
    createdBy: row.created_by ?? null,
    id: row.id,
    revisionNumber: Number(row.revision_number ?? 1),
    status: row.status || "",
    title: row.title || "",
  };
}

function mapRedirect(row: CmsRedirectRow): CmsRedirect {
  return {
    createdAt: row.created_at ?? null,
    destinationPath: row.destination_path || "/",
    id: row.id,
    isActive: Boolean(row.is_active ?? true),
    sourcePath: row.source_path || "/",
    statusCode: row.status_code === 302 ? 302 : 301,
  };
}

function mapTag(row: CmsTagRow): CmsTag {
  return {
    description: row.description ?? null,
    id: row.id,
    name: row.name || "",
    slug: row.slug || "",
  };
}

function mapMedia(row: CmsMediaRow): CmsMedia {
  return {
    altText: row.alt_text ?? null,
    createdAt: row.created_at ?? null,
    fileName: row.file_name || "",
    id: row.id,
    mimeType: row.mime_type || "",
    publicUrl: row.public_url ?? null,
    sizeBytes: Number(row.size_bytes ?? 0),
    status: row.status || "active",
  };
}

function publicPathForPost(post: Pick<CmsPost, "contentType" | "slug">) {
  return post.contentType === "page" ? `/${post.slug}` : `/blog/${post.slug}`;
}

function statusDates(input: {
  currentPublishedAt?: string | null;
  scheduledAt?: string | null;
  status: CmsPostStatus;
}) {
  if (input.status === "published") {
    return {
      published_at: input.currentPublishedAt || new Date().toISOString(),
      scheduled_at: null,
    };
  }

  if (input.status === "scheduled") {
    return {
      published_at: null,
      scheduled_at: input.scheduledAt || null,
    };
  }

  return {
    published_at: null,
    scheduled_at: null,
  };
}

function formDataToObject(formData: FormData) {
  return {
    canonicalPath: formData.get("canonicalPath") || "",
    contentText: formData.get("contentText") || "",
    contentType: formData.get("contentType") || "post",
    excerpt: formData.get("excerpt") || "",
    featuredImageAlt: formData.get("featuredImageAlt") || "",
    featuredImageUrl: formData.get("featuredImageUrl") || "",
    noindex: formData.get("noindex") === "on",
    ogDescription: formData.get("ogDescription") || "",
    ogImageUrl: formData.get("ogImageUrl") || "",
    ogTitle: formData.get("ogTitle") || "",
    primaryCategoryId: formData.get("primaryCategoryId") || "",
    scheduledAt: formData.get("scheduledAt") || "",
    seoDescription: formData.get("seoDescription") || "",
    seoTitle: formData.get("seoTitle") || "",
    slug: formData.get("slug") || "",
    status: formData.get("status") || "draft",
    title: formData.get("title") || "",
  };
}

async function writeCmsEvent(input: {
  actorAdminId?: string | null;
  eventType: string;
  fromStatus?: string | null;
  postId?: string | null;
  safeMetadata?: Record<string, unknown>;
  toStatus?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("cms_events").insert({
    actor_admin_id: input.actorAdminId ?? null,
    event_type: input.eventType,
    from_status: input.fromStatus ?? null,
    post_id: input.postId ?? null,
    safe_metadata: input.safeMetadata ?? {},
    to_status: input.toStatus ?? null,
  });
}

async function createRevision(input: {
  actorAdminId?: string | null;
  post: CmsPostRow;
  revisionNumber: number;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("cms_revisions").insert({
    content_text: input.post.content_text || "",
    created_by: input.actorAdminId ?? null,
    excerpt: input.post.excerpt ?? null,
    post_id: input.post.id,
    revision_number: input.revisionNumber,
    seo_snapshot: {
      canonicalPath: input.post.canonical_path ?? null,
      noindex: Boolean(input.post.noindex),
      ogDescription: input.post.og_description ?? null,
      ogTitle: input.post.og_title ?? null,
      seoDescription: input.post.seo_description ?? null,
      seoTitle: input.post.seo_title ?? null,
    },
    status: input.post.status || "draft",
    title: input.post.title || "",
  });
}

export async function getCmsCategories() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_categories")
    .select("id,slug,name,description")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(100);

  if (error) {
    return {
      items: [] as CmsCategory[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as CmsCategoryRow[]).map(mapCategory),
    schemaReady: true,
  };
}

export async function getAdminCmsDashboard() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CMS);

  const supabase = createSupabaseAdminClient();
  const [
    posts,
    pages,
    categories,
    tags,
    media,
    redirects,
    recentPosts,
  ] = await Promise.all([
    supabase.from("cms_posts").select("id,status", { count: "exact" }).eq("content_type", "post"),
    supabase.from("cms_posts").select("id,status", { count: "exact" }).eq("content_type", "page"),
    supabase.from("cms_categories").select("id", { count: "exact", head: true }),
    supabase.from("cms_tags").select("id", { count: "exact", head: true }),
    supabase.from("cms_media").select("id", { count: "exact", head: true }),
    supabase.from("cms_redirects").select("id", { count: "exact", head: true }),
    supabase
      .from("cms_posts")
      .select("id,content_type,slug,title,status,updated_at,published_at,scheduled_at")
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  const postRows = (posts.data ?? []) as CmsPostRow[];
  const pageRows = (pages.data ?? []) as CmsPostRow[];
  const schemaReady = !posts.error && !pages.error;

  return {
    kpis: {
      categories: categories.count ?? 0,
      drafts: [...postRows, ...pageRows].filter((post) => post.status === "draft").length,
      media: media.count ?? 0,
      pages: pages.count ?? 0,
      posts: posts.count ?? 0,
      published: [...postRows, ...pageRows].filter((post) => post.status === "published").length,
      redirects: redirects.count ?? 0,
      review: [...postRows, ...pageRows].filter((post) => post.status === "review").length,
      scheduled: [...postRows, ...pageRows].filter((post) => post.status === "scheduled").length,
      tags: tags.count ?? 0,
    },
    recentPosts: ((recentPosts.data ?? []) as CmsPostRow[]).map(mapPost),
    schemaReady,
  };
}

export async function getAdminCmsPosts(contentType: CmsContentType = "post") {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CMS);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_posts")
    .select("id,content_type,slug,title,excerpt,status,updated_at,published_at,scheduled_at,noindex")
    .eq("content_type", contentType)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      items: [] as CmsPost[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as CmsPostRow[]).map(mapPost),
    schemaReady: true,
  };
}

export async function getAdminCmsPost(postId: string) {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CMS);

  if (!isUuid(postId)) return null;

  const supabase = createSupabaseAdminClient();
  const { data: post, error } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  if (error || !post) return null;

  const [{ data: category }, { data: revisions }, categories] = await Promise.all([
    post.primary_category_id
      ? supabase
          .from("cms_categories")
          .select("id,slug,name,description")
          .eq("id", String(post.primary_category_id))
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("cms_revisions")
      .select("id,revision_number,title,status,created_by,created_at")
      .eq("post_id", postId)
      .order("revision_number", { ascending: false })
      .limit(30),
    getCmsCategories(),
  ]);

  return {
    categories: categories.items,
    post: {
      ...mapPost(post as CmsPostRow),
      category: category ? mapCategory(category as CmsCategoryRow) : null,
      revisions: ((revisions ?? []) as CmsRevisionRow[]).map(mapRevision),
    } satisfies CmsPostDetail,
    schemaReady: categories.schemaReady,
  };
}

export async function createCmsPost(input: {
  auditMetadata?: Record<string, unknown>;
  formData: FormData;
  request?: Request;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CMS);
  const parsed = cmsPostFormSchema.parse(formDataToObject(input.formData));
  const dates = statusDates({
    scheduledAt: parsed.scheduledAt || null,
    status: parsed.status,
  });
  const supabase = createSupabaseAdminClient();
  const { data: post, error } = await supabase
    .from("cms_posts")
    .insert({
      author_admin_id: admin.userId,
      canonical_path: parsed.canonicalPath || null,
      content_text: parsed.contentText,
      content_type: parsed.contentType,
      excerpt: parsed.excerpt || excerptFromContent(parsed.contentText),
      featured_image_alt: parsed.featuredImageAlt || null,
      featured_image_url: parsed.featuredImageUrl || null,
      noindex: parsed.noindex ?? false,
      og_description: parsed.ogDescription || null,
      og_image_url: parsed.ogImageUrl || null,
      og_title: parsed.ogTitle || null,
      primary_category_id: parsed.primaryCategoryId || null,
      schema_type: parsed.contentType === "page" ? "WebPage" : "Article",
      seo_description: parsed.seoDescription || null,
      seo_title: parsed.seoTitle || null,
      slug: parsed.slug,
      status: parsed.status,
      title: parsed.title,
      updated_by: admin.userId,
      ...dates,
    })
    .select("*")
    .single();

  if (error || !post) throw new SafeError("UNKNOWN_ERROR", 500);

  await createRevision({
    actorAdminId: admin.userId,
    post: post as CmsPostRow,
    revisionNumber: 1,
  });
  await writeCmsEvent({
    actorAdminId: admin.userId,
    eventType: "cms_post_created",
    postId: String(post.id),
    safeMetadata: {
      ...(input.auditMetadata ?? {}),
      contentLength: parsed.contentText.length,
      contentType: parsed.contentType,
    },
    toStatus: parsed.status,
  });
  await writeAdminAuditLog({
    action: "cms_post_created",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      ...(input.auditMetadata ?? {}),
      contentLength: parsed.contentText.length,
      contentType: parsed.contentType,
      status: parsed.status,
    },
    request: input.request,
    targetId: String(post.id),
    targetType: "cms_post",
  });

  return mapPost(post as CmsPostRow);
}

export async function updateCmsPost(input: {
  formData: FormData;
  postId: string;
  request?: Request;
}) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CMS);
  const parsed = cmsPostFormSchema.parse(formDataToObject(input.formData));

  if (!isUuid(input.postId)) throw new SafeError("VALIDATION_ERROR", 400);

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("id", input.postId)
    .maybeSingle();

  if (currentError || !current) throw new SafeError("NOT_FOUND", 404);

  const currentPost = mapPost(current as CmsPostRow);
  const nextRevision = currentPost.revisionNumber + 1;
  const dates = statusDates({
    currentPublishedAt: currentPost.publishedAt,
    scheduledAt: parsed.scheduledAt || null,
    status: parsed.status,
  });
  const { data: updated, error } = await supabase
    .from("cms_posts")
    .update({
      canonical_path: parsed.canonicalPath || null,
      content_text: parsed.contentText,
      content_type: parsed.contentType,
      excerpt: parsed.excerpt || excerptFromContent(parsed.contentText),
      featured_image_alt: parsed.featuredImageAlt || null,
      featured_image_url: parsed.featuredImageUrl || null,
      noindex: parsed.noindex ?? false,
      og_description: parsed.ogDescription || null,
      og_image_url: parsed.ogImageUrl || null,
      og_title: parsed.ogTitle || null,
      primary_category_id: parsed.primaryCategoryId || null,
      revision_number: nextRevision,
      schema_type: parsed.contentType === "page" ? "WebPage" : "Article",
      seo_description: parsed.seoDescription || null,
      seo_title: parsed.seoTitle || null,
      slug: parsed.slug,
      status: parsed.status,
      title: parsed.title,
      updated_by: admin.userId,
      ...dates,
    })
    .eq("id", input.postId)
    .select("*")
    .single();

  if (error || !updated) throw new SafeError("UNKNOWN_ERROR", 500);

  if (
    currentPost.status === "published" &&
    currentPost.slug !== parsed.slug &&
    currentPost.contentType === parsed.contentType
  ) {
    await supabase.from("cms_redirects").upsert(
      {
        created_by: admin.userId,
        destination_path: publicPathForPost({ contentType: parsed.contentType, slug: parsed.slug }),
        source_path: publicPathForPost(currentPost),
        status_code: 301,
        updated_by: admin.userId,
      },
      { onConflict: "source_path" },
    );
  }

  await createRevision({
    actorAdminId: admin.userId,
    post: updated as CmsPostRow,
    revisionNumber: nextRevision,
  });
  await writeCmsEvent({
    actorAdminId: admin.userId,
    eventType: "cms_post_updated",
    fromStatus: currentPost.status,
    postId: input.postId,
    safeMetadata: {
      contentLength: parsed.contentText.length,
      revisionNumber: nextRevision,
    },
    toStatus: parsed.status,
  });
  await writeAdminAuditLog({
    action: "cms_post_updated",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      contentLength: parsed.contentText.length,
      fromStatus: currentPost.status,
      revisionNumber: nextRevision,
      toStatus: parsed.status,
    },
    request: input.request,
    targetId: input.postId,
    targetType: "cms_post",
  });

  return mapPost(updated as CmsPostRow);
}

export async function getPublishedBlogPosts(limit = 20) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_posts")
    .select(
      "id,content_type,slug,title,excerpt,content_text,status,published_at,updated_at,featured_image_url,featured_image_alt,seo_title,seo_description,og_title,og_description,og_image_url,canonical_path,noindex",
    )
    .eq("content_type", "post")
    .eq("status", "published")
    .eq("noindex", false)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      items: [] as CmsPost[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as CmsPostRow[]).map(mapPost),
    schemaReady: true,
  };
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("content_type", "post")
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  return mapPost(data as CmsPostRow);
}

export async function getPublishedPageBySlug(slug: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_posts")
    .select("*")
    .eq("content_type", "page")
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  return mapPost(data as CmsPostRow);
}

export async function getPublishedCmsSitemapEntries() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_posts")
    .select("content_type,slug,updated_at,published_at")
    .eq("status", "published")
    .eq("noindex", false)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .limit(500);

  if (error) return [];

  return ((data ?? []) as CmsPostRow[]).map((post) => {
    const mapped = mapPost(post);

    return {
      lastModified: mapped.updatedAt || mapped.publishedAt || new Date().toISOString(),
      path: publicPathForPost(mapped),
    };
  });
}

export async function getCmsRedirectForPath(sourcePath: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_redirects")
    .select("id,source_path,destination_path,status_code,is_active,created_at")
    .eq("source_path", sourcePath)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return mapRedirect(data as CmsRedirectRow);
}

export async function getAdminCmsRedirects() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CMS);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_redirects")
    .select("id,source_path,destination_path,status_code,is_active,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      items: [] as CmsRedirect[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as CmsRedirectRow[]).map(mapRedirect),
    schemaReady: true,
  };
}

export async function getAdminCmsTags() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CMS);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_tags")
    .select("id,slug,name,description")
    .order("name", { ascending: true })
    .limit(100);

  if (error) {
    return {
      items: [] as CmsTag[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as CmsTagRow[]).map(mapTag),
    schemaReady: true,
  };
}

export async function getAdminCmsMedia() {
  await requirePermission(ADMIN_PERMISSIONS.VIEW_CMS);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_media")
    .select("id,file_name,public_url,mime_type,size_bytes,alt_text,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      items: [] as CmsMedia[],
      schemaReady: false,
    };
  }

  return {
    items: ((data ?? []) as CmsMediaRow[]).map(mapMedia),
    schemaReady: true,
  };
}

export async function createCmsRedirect(input: { formData: FormData; request?: Request }) {
  const admin = await requirePermission(ADMIN_PERMISSIONS.MANAGE_CMS);
  const parsed = cmsRedirectSchema.parse({
    destinationPath: input.formData.get("destinationPath") || "",
    isActive: input.formData.get("isActive") === "on",
    sourcePath: input.formData.get("sourcePath") || "",
    statusCode: input.formData.get("statusCode") || "301",
  });

  if (parsed.sourcePath === parsed.destinationPath) {
    throw new SafeError("VALIDATION_ERROR", 400);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_redirects")
    .upsert(
      {
        created_by: admin.userId,
        destination_path: parsed.destinationPath,
        is_active: parsed.isActive ?? true,
        source_path: parsed.sourcePath,
        status_code: parsed.statusCode,
        updated_by: admin.userId,
      },
      { onConflict: "source_path" },
    )
    .select("id")
    .single();

  if (error || !data) throw new SafeError("UNKNOWN_ERROR", 500);

  await writeAdminAuditLog({
    action: "cms_redirect_saved",
    actorRole: admin.role,
    actorUserId: admin.userId,
    metadata: {
      destinationPath: parsed.destinationPath,
      sourcePath: parsed.sourcePath,
      statusCode: parsed.statusCode,
    },
    request: input.request,
    targetId: String(data.id),
    targetType: "cms_redirect",
  });
}

export async function publishDueCmsPosts(limit = 25) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: posts, error } = await supabase
    .from("cms_posts")
    .select("id,status,scheduled_at")
    .eq("status", "scheduled")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(Math.min(50, Math.max(1, limit)));

  if (error) {
    return {
      failed: 0,
      published: 0,
      schemaReady: false,
    };
  }

  let failed = 0;
  let published = 0;

  for (const post of (posts ?? []) as CmsPostRow[]) {
    const { error: updateError } = await supabase
      .from("cms_posts")
      .update({
        published_at: now,
        scheduled_at: null,
        status: "published",
      })
      .eq("id", post.id)
      .eq("status", "scheduled");

    if (updateError) {
      failed += 1;
      continue;
    }

    published += 1;
    await writeCmsEvent({
      eventType: "cms_post_scheduled_published",
      fromStatus: "scheduled",
      postId: post.id,
      toStatus: "published",
    });
  }

  return {
    failed,
    published,
    schemaReady: true,
  };
}

export function absoluteCmsUrl(path: string) {
  return `${getSiteUrl()}${path}`;
}
