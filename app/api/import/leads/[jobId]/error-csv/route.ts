import { NextResponse } from "next/server";
import { getImportJobById } from "@/lib/data/import-jobs";
import { getAllImportRows } from "@/lib/data/import-rows";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(_request: Request, props: RouteContext) {
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

  const rows = await getAllImportRows(job.id, ["invalid", "failed"]);
  const rawHeaders = Array.from(new Set(rows.flatMap((row) => Object.keys(row.raw_data))));
  const headers = ["row_index", ...rawHeaders, "error_message"];
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => {
      const errorMessage =
        row.validation_errors?.map((error) => error.message).join("; ") ||
        "Không thể import dòng này.";

      return [
        csvEscape(row.row_index),
        ...rawHeaders.map((header) => csvEscape(row.raw_data[header] ?? "")),
        csvEscape(errorMessage),
      ].join(",");
    }),
  ];
  const csv = `\uFEFF${lines.join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="salemap-import-errors-${job.id}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
