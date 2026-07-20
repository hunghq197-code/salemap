import type { NormalizedImportLead } from "@/lib/import/normalize-import-row";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ImportDuplicateResult =
  | {
      duplicate: false;
    }
  | {
      duplicate: true;
      leadId: string;
      reason: "email" | "name_address" | "phone" | "website";
    };

async function findLeadByField(
  userId: string,
  field: "email" | "phone" | "website",
  value?: string,
) {
  if (!value) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("user_id", userId)
    .eq(field, value)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ? String(data.id) : null;
}

export async function findDuplicateLeadForUser(
  userId: string,
  row: NormalizedImportLead,
): Promise<ImportDuplicateResult> {
  const phoneLeadId = await findLeadByField(userId, "phone", row.phone);
  if (phoneLeadId) return { duplicate: true, leadId: phoneLeadId, reason: "phone" };

  const emailLeadId = await findLeadByField(userId, "email", row.email);
  if (emailLeadId) return { duplicate: true, leadId: emailLeadId, reason: "email" };

  const websiteLeadId = await findLeadByField(userId, "website", row.website);
  if (websiteLeadId) return { duplicate: true, leadId: websiteLeadId, reason: "website" };

  if (row.name && row.address) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", row.name)
      .ilike("address", row.address)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data?.id) {
      return { duplicate: true, leadId: String(data.id), reason: "name_address" };
    }
  }

  return { duplicate: false };
}
