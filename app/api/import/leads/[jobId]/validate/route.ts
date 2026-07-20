import { NextResponse } from "next/server";
import { getImportJobById, updateImportJob } from "@/lib/data/import-jobs";
import { getAllImportRows, updateImportRow } from "@/lib/data/import-rows";
import type { FieldMapping } from "@/lib/import/field-mapping";
import { findDuplicateLeadForUser } from "@/lib/import/detect-duplicates";
import { normalizeImportRow } from "@/lib/import/normalize-import-row";
import { validateImportLead } from "@/lib/import/validate-import-row";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function POST(_request: Request, props: RouteContext) {
  const params = await props.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", success: false }, { status: 401 });
  }

  const job = await getImportJobById(params.jobId);

  if (!job) {
    return NextResponse.json({ error: "NOT_FOUND", success: false }, { status: 404 });
  }

  const fieldMapping = (job.field_mapping ?? {}) as FieldMapping;
  const rows = await getAllImportRows(job.id);
  let validRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;

  for (const row of rows) {
    const mapped = normalizeImportRow(row.raw_data, fieldMapping);
    const validation = validateImportLead(mapped);

    if (!validation.valid) {
      invalidRows += 1;
      await updateImportRow(row.id, {
        duplicate_lead_id: null,
        mapped_data: mapped,
        status: "invalid",
        validation_errors: validation.errors,
      });
      continue;
    }

    const duplicate = await findDuplicateLeadForUser(user.id, mapped);

    if (duplicate.duplicate) {
      duplicateRows += 1;
      await updateImportRow(row.id, {
        duplicate_lead_id: duplicate.leadId,
        mapped_data: {
          ...mapped,
          duplicateReason: duplicate.reason,
        },
        status: "duplicate",
        validation_errors: [],
      });
      continue;
    }

    validRows += 1;
    await updateImportRow(row.id, {
      duplicate_lead_id: null,
      mapped_data: mapped,
      status: "valid",
      validation_errors: [],
    });
  }

  await updateImportJob(job.id, {
    duplicate_rows: duplicateRows,
    invalid_rows: invalidRows,
    status: "validated",
    total_rows: rows.length,
    valid_rows: validRows,
  });

  return NextResponse.json({
    data: {
      duplicateRows,
      invalidRows,
      totalRows: rows.length,
      validRows,
    },
    success: true,
  });
}
