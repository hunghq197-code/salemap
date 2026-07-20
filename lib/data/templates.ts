import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";

export type TemplateCategoryRecord = {
  description: string | null;
  id: string;
  name: string;
  slug: string;
  sort_order: number | null;
};

export type TemplateRecord = {
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  category_id: string | null;
  channel: string | null;
  content: string;
  description: string | null;
  id: string;
  industry: string | null;
  situation: string | null;
  slug: string | null;
  sort_order: number | null;
  template_type: string;
  title: string;
};

export type TemplateListParams = {
  categorySlug?: string;
  favoritesOnly?: boolean;
  q?: string;
  templateType?: string;
};

function isMissingTemplateTable(error: { code?: string; message?: string }) {
  return isMissingSupabaseSchema(error, [
    "templates",
    "template_categories",
    "template_favorites",
  ]);
}

function cleanQuery(value?: string) {
  return value?.replace(/[%_,]/g, " ").trim();
}

function normalizeTemplate(raw: Record<string, unknown>): TemplateRecord {
  const categoryRaw = raw.template_categories;
  const category = Array.isArray(categoryRaw) ? categoryRaw[0] : categoryRaw;

  return {
    category:
      category && typeof category === "object"
        ? {
            id: String((category as { id?: unknown }).id ?? ""),
            name: String((category as { name?: unknown }).name ?? ""),
            slug: String((category as { slug?: unknown }).slug ?? ""),
          }
        : null,
    category_id: (raw.category_id as string | null) ?? null,
    channel: (raw.channel as string | null) ?? null,
    content: String(raw.content ?? ""),
    description: (raw.description as string | null) ?? null,
    id: String(raw.id ?? ""),
    industry: (raw.industry as string | null) ?? null,
    situation: (raw.situation as string | null) ?? null,
    slug: (raw.slug as string | null) ?? null,
    sort_order: (raw.sort_order as number | null) ?? null,
    template_type: String(raw.template_type ?? "other"),
    title: String(raw.title ?? ""),
  };
}

export async function getTemplateCategories() {
  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("template_categories")
    .select("id,name,slug,description,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (isMissingTemplateTable(error)) {
      return { items: [] as TemplateCategoryRecord[], schemaReady: false };
    }

    throw new Error(error.message);
  }

  return {
    items: (data ?? []) as TemplateCategoryRecord[],
    schemaReady: true,
  };
}

export async function getFavoriteTemplateIds() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("template_favorites")
    .select("template_id")
    .eq("user_id", userId);

  if (error) {
    if (isMissingTemplateTable(error)) {
      return new Set<string>();
    }

    throw new Error(error.message);
  }

  return new Set((data ?? []).map((item) => item.template_id as string));
}

async function getCategoryIdBySlug(categorySlug?: string) {
  if (!categorySlug) {
    return null;
  }

  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("template_categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (error) {
    if (isMissingTemplateTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return (data?.id as string | undefined) ?? null;
}

export async function getTemplates(params: TemplateListParams = {}) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const favoriteIds = params.favoritesOnly ? await getFavoriteTemplateIds() : null;

  if (favoriteIds && favoriteIds.size === 0) {
    return { items: [] as TemplateRecord[], schemaReady: true };
  }

  const categoryId = await getCategoryIdBySlug(params.categorySlug);

  if (params.categorySlug && !categoryId) {
    return { items: [] as TemplateRecord[], schemaReady: true };
  }

  let query = supabase
    .from("templates")
    .select(
      "id,category_id,title,slug,description,content,template_type,situation,industry,channel,sort_order,template_categories(id,name,slug)",
    )
    .eq("is_public", true)
    .eq("is_active", true);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (params.templateType) {
    query = query.eq("template_type", params.templateType);
  }

  const q = cleanQuery(params.q);

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,content.ilike.%${q}%,situation.ilike.%${q}%`,
    );
  }

  if (favoriteIds) {
    query = query.in("id", Array.from(favoriteIds));
  }

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .limit(200);

  if (error) {
    if (isMissingTemplateTable(error)) {
      return { items: [] as TemplateRecord[], schemaReady: false };
    }

    throw new Error(error.message);
  }

  return {
    items: ((data ?? []) as unknown as Record<string, unknown>[]).map(normalizeTemplate),
    schemaReady: true,
  };
}

export async function getTemplateById(templateId: string) {
  const { supabase } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("templates")
    .select(
      "id,category_id,title,slug,description,content,template_type,situation,industry,channel,sort_order,template_categories(id,name,slug)",
    )
    .eq("id", templateId)
    .eq("is_public", true)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (isMissingTemplateTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return data ? normalizeTemplate(data as unknown as Record<string, unknown>) : null;
}

export async function toggleTemplateFavorite(templateId: string) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const template = await getTemplateById(templateId);

  if (!template) {
    throw new Error("Không tìm thấy mẫu.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("template_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (existingError) {
    if (isMissingTemplateTable(existingError)) {
      return { favorited: false };
    }

    throw new Error(existingError.message);
  }

  if (existing) {
    const { error } = await supabase
      .from("template_favorites")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", userId);

    if (error) {
      if (isMissingTemplateTable(error)) {
        return { favorited: false };
      }

      throw new Error(error.message);
    }

    return { favorited: false };
  }

  const { error } = await supabase.from("template_favorites").insert({
    template_id: templateId,
    user_id: userId,
  });

  if (error) {
    if (isMissingTemplateTable(error)) {
      return { favorited: false };
    }

    throw new Error(error.message);
  }

  return { favorited: true };
}
