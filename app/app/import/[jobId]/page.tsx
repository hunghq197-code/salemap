import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImportJobDetailClient } from "@/components/import/ImportJobDetailClient";
import { getImportJobById } from "@/lib/data/import-jobs";
import { getImportRows } from "@/lib/data/import-rows";

export const dynamic = "force-dynamic";

type ImportJobPageProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ImportJobPage(props: ImportJobPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const job = await getImportJobById(params.jobId);

  if (!job) {
    notFound();
  }

  const rowStatus = getString(searchParams?.status);
  const rows = await getImportRows(job.id, {
    limit: 50,
    status: rowStatus,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/import"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại nhập dữ liệu
      </Link>

      <div className="mt-4">
        <ImportJobDetailClient job={job} rowStatus={rowStatus} rows={rows} />
      </div>
    </div>
  );
}
