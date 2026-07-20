import { createAuthedSupabaseServerClient } from "@/lib/data/auth";

export type TagRecord = {
  id: string;
  name: string;
  color: string | null;
};

export async function getTags() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id,name,color")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TagRecord[];
}

export async function createTag(name: string, color = "#0f5f8f") {
  const cleanName = name.trim();

  if (!cleanName) {
    return null;
  }

  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .upsert(
      {
        color,
        name: cleanName,
        user_id: userId,
      },
      { onConflict: "user_id,name" },
    )
    .select("id,name,color")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TagRecord;
}

export const ensureTag = createTag;

async function getOwnedTagIds(tagIds: string[]) {
  if (tagIds.length === 0) {
    return [];
  }

  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", userId)
    .in("id", tagIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((tag) => tag.id as string);
}

export async function assignTagsToLead(leadId: string, tagIds: string[]) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (leadError) {
    throw new Error(leadError.message);
  }

  if (!lead) {
    throw new Error("Không tìm thấy lead.");
  }

  const ownedTagIds = await getOwnedTagIds(Array.from(new Set(tagIds)));

  const { error: deleteError } = await supabase
    .from("lead_tags")
    .delete()
    .eq("lead_id", leadId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (ownedTagIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("lead_tags").insert(
    ownedTagIds.map((tagId) => ({
      lead_id: leadId,
      tag_id: tagId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}
