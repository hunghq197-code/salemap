import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CleanupScanButtons } from "@/components/cleanup/CleanupScanButtons";
import { DataQualityIssueActions } from "@/components/cleanup/DataQualityIssueActions";
import {
  DATA_QUALITY_SEVERITY_LABELS,
} from "@/lib/constants/lead-cleanup";
import {
  getDataQualityIssueLabel,
  getDataQualityIssues,
} from "@/lib/leads/data-quality";

export const dynamic = "force-dynamic";

type QualityPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function severityClass(severity?: string | null) {
  if (severity === "important") return "bg-rose-50 text-rose-700";
  if (severity === "warning") return "bg-amber-50 text-amber-700";
  return "bg-sky-50 text-sky-700";
}

export default async function DataQualityPage(props: QualityPageProps) {
  const searchParams = await props.searchParams;
  const page = Number(getString(searchParams?.page) || 1);
  const status = getString(searchParams?.status) || "open";
  const type = getString(searchParams?.type) || undefined;
  const result = await getDataQualityIssues({ page, status, type });

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/leads/cleanup"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Về trung tâm dọn dữ liệu
      </Link>

      <div className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
          Data quality
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Chất lượng dữ liệu lead
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          Xem các lead thiếu thông tin, sai định dạng hoặc đã lâu chưa chăm sóc.
        </p>
      </div>

      <div className="mt-6">
        <CleanupScanButtons />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["open", "Tất cả đang mở", ""],
          ["resolved", "Đã xử lý", ""],
          ["dismissed", "Đã bỏ qua", ""],
          ["open", "Sai định dạng", "invalid_phone"],
          ["open", "Lâu chưa chăm sóc", "stale_lead"],
        ].map(([filterStatus, label, filterType]) => (
          <Link
            className={[
              "inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-sm font-bold",
              status === filterStatus && (type || "") === filterType
                ? "border-ocean bg-mint/15 text-ocean"
                : "border-slate-200 bg-white text-ink hover:border-ocean",
            ].join(" ")}
            href={`/app/leads/cleanup/quality?status=${filterStatus}${filterType ? `&type=${filterType}` : ""}`}
            key={`${filterStatus}-${filterType}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {result.items.length > 0 ? (
          result.items.map((issue) => {
            const lead = Array.isArray(issue.leads) ? issue.leads[0] : issue.leads;

            return (
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={issue.id}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex min-h-8 items-center rounded-full bg-cloud px-3 py-1 text-xs font-bold text-slate-600">
                        {getDataQualityIssueLabel(issue.issue_type)}
                      </span>
                      <span
                        className={[
                          "inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-bold",
                          severityClass(issue.severity),
                        ].join(" ")}
                      >
                        {DATA_QUALITY_SEVERITY_LABELS[issue.severity] || issue.severity}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-ink">
                      {lead?.name || "Lead"}
                    </h2>
                    <p className="mt-2 text-base leading-7 text-slate-600">{issue.message}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Field: {issue.field_name || "general"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {lead?.id ? (
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-ink hover:border-ocean"
                        href={`/app/leads/${lead.id}`}
                      >
                        Xem lead
                      </Link>
                    ) : null}
                    {issue.status === "open" ? (
                      <DataQualityIssueActions
                        issueId={issue.id}
                        issueType={issue.issue_type}
                        severity={issue.severity}
                      />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-mint/15 text-ocean">
              <AlertTriangle aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-ink">Chưa có cảnh báo dữ liệu.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-slate-600">
              Bấm quét lại nếu bạn vừa nhập thêm lead hoặc cập nhật danh sách.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
