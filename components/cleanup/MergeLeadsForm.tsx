"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  MERGE_FIELD_LABELS,
  MERGE_FIELD_OPTIONS,
  type MergeFieldOption,
} from "@/lib/constants/lead-cleanup";
import {
  trackLeadMergeCompleted,
  trackLeadMergeFailed,
  trackLeadMergeStarted,
} from "@/lib/analytics/client";
import type { MergeGroupDetail } from "@/lib/leads/merge-leads";

type MergeLeadsFormProps = {
  group: MergeGroupDetail;
};

function displayValue(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Chua co";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  return String(value);
}

function getLeadValue(
  lead: MergeGroupDetail["leads"][number],
  field: MergeFieldOption,
) {
  return lead[field] ?? null;
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function buildDefaultFieldStrategy(group: MergeGroupDetail, primaryLeadId: string) {
  const primaryLead = group.leads.find((lead) => lead.id === primaryLeadId);

  return MERGE_FIELD_OPTIONS.reduce<Record<string, string>>((acc, field) => {
    if (primaryLead && hasValue(getLeadValue(primaryLead, field))) {
      acc[field] = primaryLead.id;
      return acc;
    }

    const firstLeadWithValue = group.leads.find((lead) => hasValue(getLeadValue(lead, field)));
    acc[field] = firstLeadWithValue?.id || primaryLeadId;

    return acc;
  }, {});
}

export function MergeLeadsForm({ group }: MergeLeadsFormProps) {
  const router = useRouter();
  const suggestedPrimaryLeadId = group.suggestedPrimaryLeadId || group.leads[0]?.id || "";
  const [primaryLeadId, setPrimaryLeadId] = useState(suggestedPrimaryLeadId);
  const [fieldStrategy, setFieldStrategy] = useState<Record<string, string>>(() =>
    buildDefaultFieldStrategy(group, suggestedPrimaryLeadId),
  );
  const [confirmSafeMerge, setConfirmSafeMerge] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mergedLeadIds = useMemo(
    () => group.leads.map((lead) => lead.id).filter((leadId) => leadId !== primaryLeadId),
    [group.leads, primaryLeadId],
  );

  function changePrimaryLead(leadId: string) {
    setPrimaryLeadId(leadId);
    setFieldStrategy(buildDefaultFieldStrategy(group, leadId));
  }

  async function submitMerge() {
    if (!primaryLeadId || mergedLeadIds.length === 0 || !confirmSafeMerge) {
      setMessage("Hay chon lead chinh va xac nhan truoc khi gop.");
      return;
    }

    setPending(true);
    setMessage(null);
    trackLeadMergeStarted({ leadCount: group.leads.length });

    try {
      const response = await fetch("/api/leads/cleanup/merge", {
        body: JSON.stringify({
          fieldStrategy,
          mergeGroupId: group.id,
          mergedLeadIds,
          primaryLeadId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "Khong the gop lead.");
      }

      trackLeadMergeCompleted({ leadCount: group.leads.length, successCount: mergedLeadIds.length });
      router.push(`/app/leads/${primaryLeadId}?toast=lead_merged`);
      router.refresh();
    } catch (error) {
      trackLeadMergeFailed({ leadCount: group.leads.length, failedCount: mergedLeadIds.length });
      setMessage(error instanceof Error ? error.message : "Khong the gop lead.");
    } finally {
      setPending(false);
    }
  }

  if (group.leads.length < 2) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
        Nhom nay khong con du lead de gop.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Chon lead chinh</h2>
        <p className="mt-2 text-base leading-7 text-slate-600">
          Hay chon lead chinh de giu lai. Cac ghi chu, lich nhac va tag se duoc chuyen sang lead nay.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {group.leads.map((lead) => (
            <label
              className={[
                "block rounded-lg border p-4 transition",
                primaryLeadId === lead.id
                  ? "border-ocean bg-mint/10"
                  : "border-slate-200 bg-white hover:border-ocean",
              ].join(" ")}
              key={lead.id}
            >
              <span className="flex items-start gap-3">
                <input
                  checked={primaryLeadId === lead.id}
                  className="mt-1 h-5 w-5"
                  name="primaryLeadId"
                  onChange={() => changePrimaryLead(lead.id)}
                  type="radio"
                />
                <span>
                  <span className="block text-base font-bold text-ink">{lead.name}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {lead.phone || lead.email || lead.website || "Chua co thong tin lien he"}
                  </span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Chon thong tin se giu</h2>
        <p className="mt-2 text-base leading-7 text-slate-600">
          SaleMap chon san gia tri tu lead chinh neu co. Ban co the doi tung dong truoc khi gop.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 px-3 py-3 font-bold text-slate-600">
                  Field
                </th>
                {group.leads.map((lead) => (
                  <th className="border-b border-slate-200 px-3 py-3 font-bold text-ink" key={lead.id}>
                    {lead.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MERGE_FIELD_OPTIONS.map((field) => (
                <tr key={field}>
                  <td className="border-b border-slate-100 px-3 py-3 font-bold text-slate-700">
                    {MERGE_FIELD_LABELS[field]}
                  </td>
                  {group.leads.map((lead) => (
                    <td className="border-b border-slate-100 px-3 py-3 align-top" key={lead.id}>
                      <label className="flex min-w-0 items-start gap-2">
                        <input
                          checked={(fieldStrategy[field] || primaryLeadId) === lead.id}
                          className="mt-1 h-4 w-4"
                          name={`field-${field}`}
                          onChange={() =>
                            setFieldStrategy((current) => ({ ...current, [field]: lead.id }))
                          }
                          type="radio"
                        />
                        <span className="break-words text-slate-700">
                          {displayValue(getLeadValue(lead, field))}
                        </span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Ghi chu, nhac viec va tag</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {group.leads.map((lead) => (
            <div className="rounded-lg bg-cloud px-4 py-3" key={lead.id}>
              <p className="font-bold text-ink">{lead.name}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {group.notesCountByLeadId[lead.id] ?? 0} ghi chu -{" "}
                {group.remindersCountByLeadId[lead.id] ?? 0} nhac viec -{" "}
                {group.tagsByLeadId[lead.id]?.length ?? 0} tag
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Xac nhan gop lead</h2>
        <p className="mt-2 text-base leading-7 text-slate-700">
          Lead chinh se duoc giu lai. Cac lead con lai se duoc luu tru va lien ket vao lead chinh,
          khong bi xoa vinh vien.
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm font-bold text-ink">
          <input
            checked={confirmSafeMerge}
            className="mt-1 h-5 w-5"
            onChange={(event) => setConfirmSafeMerge(event.target.checked)}
            type="checkbox"
          />
          Toi hieu ghi chu, lich nhac va tag se duoc chuyen sang lead chinh.
        </label>
        <button
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-base font-bold text-white hover:bg-ocean disabled:opacity-60 sm:w-auto"
          disabled={pending}
          onClick={submitMerge}
          type="button"
        >
          {pending ? (
            "Dang gop lead..."
          ) : (
            <>
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
              Gop lead
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </>
          )}
        </button>
        {message ? (
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-rose-700">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
