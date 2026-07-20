import { BETA_CHECKLIST_ITEMS } from "@/lib/constants/beta-checklist";
import { isBetaChecklistKey, type BetaChecklistKey } from "@/lib/constants/beta-checklist";
import { createAuthedSupabaseServerClient } from "@/lib/data/auth";
import { isMissingSupabaseSchema } from "@/lib/supabase/schema-error";

export type BetaChecklistProgress = {
  completedAt: string | null;
  key: BetaChecklistKey;
};

function isMissingTableError(error: { code?: string; message?: string }) {
  return isMissingSupabaseSchema(error, ["beta_checklist_progress"]);
}

export async function getBetaChecklistProgress() {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const { data, error } = await supabase
    .from("beta_checklist_progress")
    .select("checklist_key,completed_at")
    .eq("user_id", userId);

  if (error) {
    if (isMissingTableError(error)) {
      return {
        completed: new Set<BetaChecklistKey>(),
        done: 0,
        items: BETA_CHECKLIST_ITEMS,
        progress: [] as BetaChecklistProgress[],
        schemaReady: false,
        total: BETA_CHECKLIST_ITEMS.length,
      };
    }

    throw new Error(error.message);
  }

  const progress = (data ?? [])
    .filter((item) => isBetaChecklistKey(String(item.checklist_key)))
    .map((item) => ({
      completedAt: item.completed_at as string | null,
      key: item.checklist_key as BetaChecklistKey,
    }));
  const completed = new Set(
    progress.filter((item) => item.completedAt).map((item) => item.key),
  );

  return {
    completed,
    done: completed.size,
    items: BETA_CHECKLIST_ITEMS,
    progress,
    schemaReady: true,
    total: BETA_CHECKLIST_ITEMS.length,
  };
}

export async function markChecklistItemCompleted(checklistKey: BetaChecklistKey) {
  const { supabase, userId } = await createAuthedSupabaseServerClient();
  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from("beta_checklist_progress")
    .upsert(
      {
        checklist_key: checklistKey,
        completed_at: completedAt,
        user_id: userId,
      },
      { onConflict: "user_id,checklist_key" },
    );

  if (error) {
    if (isMissingTableError(error)) {
      return false;
    }

    throw new Error(error.message);
  }

  return true;
}

export async function safeMarkChecklistItemCompleted(checklistKey: BetaChecklistKey) {
  try {
    return await markChecklistItemCompleted(checklistKey);
  } catch {
    return false;
  }
}
