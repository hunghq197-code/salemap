"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { QuotaWarning } from "@/components/quota/QuotaWarning";
import {
  trackExportLeadsClicked,
  trackExportLeadsCompleted,
  trackExportLeadsFailed,
  trackExportPageViewed,
} from "@/lib/analytics/client";
import {
  DEFAULT_EXPORT_FIELDS,
  EXPORT_FIELDS,
  SOURCE_OPTIONS,
  type ExportFieldKey,
} from "@/lib/constants/export";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import { DAILY_QUOTAS } from "@/lib/constants/quota";
import type { TagRecord } from "@/lib/data/tags";
import type { DailyUsage } from "@/lib/data/usage";

type ExportFilters = {
  fromDate?: string;
  source?: string;
  status?: string;
  tagId?: string;
  toDate?: string;
};

type ExportLeadsFormProps = {
  count: number;
  exportQuota?: DailyUsage | null;
  filters: ExportFilters;
  quotaSchemaReady?: boolean;
  tags: TagRecord[];
};

function getString(value?: string) {
  return value || "";
}

export function ExportLeadsForm({
  count,
  exportQuota,
  filters,
  quotaSchemaReady = true,
  tags,
}: ExportLeadsFormProps) {
  const [error, setError] = useState("");
  const [quota, setQuota] = useState<DailyUsage | null>(exportQuota ?? null);
  const [selectedFields, setSelectedFields] =
    useState<ExportFieldKey[]>(DEFAULT_EXPORT_FIELDS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackExportPageViewed();
  }, []);

  useEffect(() => {
    setQuota(exportQuota ?? null);
  }, [exportQuota]);

  function toggleField(field: ExportFieldKey) {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
  }

  async function handleExport() {
    setError("");

    if (selectedFields.length === 0) {
      setError("Vui lòng chọn ít nhất một trường để xuất.");
      return;
    }

    setSubmitting(true);
    trackExportLeadsClicked({
      selectedFieldCount: selectedFields.length,
      sourceFilter: filters.source || undefined,
      statusFilter: filters.status || undefined,
    });

    try {
      const response = await fetch("/api/export/leads", {
        body: JSON.stringify({
          filters,
          selectedFields,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: { code?: string; message?: string } }
          | null;

        if (result?.error?.code === "QUOTA_EXCEEDED") {
          setQuota({
            actionType: "export_leads",
            limit: DAILY_QUOTAS.export_leads,
            remaining: 0,
            used: DAILY_QUOTAS.export_leads,
          });
        }

        throw new Error(
          result?.error?.message ||
            "Không thể xuất dữ liệu lúc này. Vui lòng thử lại sau.",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `salemap-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      trackExportLeadsCompleted({
        rowCount: count,
        selectedFieldCount: selectedFields.length,
        sourceFilter: filters.source || undefined,
        statusFilter: filters.status || undefined,
      });
      setQuota((current) =>
        current
          ? {
              ...current,
              remaining: Math.max(0, current.remaining - 1),
              used: Math.min(current.limit, current.used + 1),
            }
          : current,
      );
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Không thể xuất dữ liệu lúc này. Vui lòng thử lại sau.",
      );
      trackExportLeadsFailed({
        sourceFilter: filters.source || undefined,
        statusFilter: filters.status || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <form
        className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        method="get"
      >
        <h2 className="text-xl font-bold text-ink">Bộ lọc export</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm font-bold text-ink">
            Trạng thái lead
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={getString(filters.status)}
              name="status"
            >
              <option value="">Tất cả</option>
              {LEAD_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold text-ink">
            Tag
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={getString(filters.tagId)}
              name="tagId"
            >
              <option value="">Tất cả</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold text-ink">
            Nguồn lead
            <select
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={getString(filters.source)}
              name="source"
            >
              <option value="">Tất cả</option>
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold text-ink">
            Từ ngày
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={getString(filters.fromDate)}
              name="fromDate"
              type="date"
            />
          </label>

          <label className="text-sm font-bold text-ink">
            Đến ngày
            <input
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/15"
              defaultValue={getString(filters.toDate)}
              name="toDate"
              type="date"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-5 py-3 text-base font-bold text-white transition hover:bg-ocean"
            type="submit"
          >
            Áp dụng bộ lọc
          </button>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-base font-bold text-ink transition hover:border-ocean"
            href="/app/export"
          >
            Xóa bộ lọc
          </a>
        </div>
      </form>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Chọn trường export</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORT_FIELDS.map((field) => (
            <label
              className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-cloud/40 px-4 py-3 text-sm font-bold text-ink"
              key={field.key}
            >
              <input
                checked={selectedFields.includes(field.key)}
                className="h-4 w-4 accent-ocean"
                onChange={() => toggleField(field.key)}
                type="checkbox"
              />
              {field.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-ocean/20 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
              <FileText aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">
                Dự kiến xuất {count} lead
              </h2>
              <p className="mt-1 text-base leading-7 text-slate-600">
                {count > 0
                  ? "File CSV có BOM UTF-8 để Excel đọc tiếng Việt ổn định."
                  : "Không có lead nào phù hợp với bộ lọc hiện tại."}
              </p>
            </div>
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft transition hover:bg-[#5de0b3] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={count === 0 || submitting || quota?.remaining === 0}
            onClick={handleExport}
            type="button"
          >
            {submitting ? (
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="h-5 w-5" />
            )}
            {submitting ? "Đang xuất..." : "Tải file CSV"}
          </button>
        </div>

        {!quotaSchemaReady ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
            Chưa bật bảng quota trong Supabase nên lượt export hôm nay chưa được
            tính chính xác.
          </div>
        ) : null}

        {quota ? (
          <QuotaWarning
            actionType={quota.actionType}
            className="mt-4"
            limit={quota.limit}
            remaining={quota.remaining}
            used={quota.used}
          />
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
            {error}
          </div>
        ) : null}
      </section>
    </div>
  );
}
