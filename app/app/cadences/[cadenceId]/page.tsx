import { ArrowLeft, Clock3, ListChecks } from "lucide-react";
import Link from "next/link";
import { CadenceTemplateActions } from "@/components/cadences/CadenceTemplateActions";
import {
  getCadenceCategoryLabel,
  getCadencePriorityLabel,
  getCadenceTaskTypeLabel,
} from "@/lib/constants/cadences";
import { getCadenceTemplateById } from "@/lib/data/cadences";
import { listTaskLeadOptions } from "@/lib/data/tasks";

export const dynamic = "force-dynamic";

type CadenceDetailPageProps = {
  params: Promise<{
    cadenceId: string;
  }>;
};

export default async function CadenceDetailPage(props: CadenceDetailPageProps) {
  const params = await props.params;
  const [template, leadOptions] = await Promise.all([
    getCadenceTemplateById(params.cadenceId),
    listTaskLeadOptions(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-ocean hover:text-ink"
        href="/app/cadences"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại quy trình
      </Link>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-7 items-center rounded-full bg-ocean/10 px-3 py-1 text-xs font-bold text-ocean">
                {getCadenceCategoryLabel(template.category)}
              </span>
              {template.isSystem ? (
                <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                  Hệ thống
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
              {template.name}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {template.description || "Quy trình chăm sóc lead."}
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-ocean">
            <ListChecks aria-hidden="true" className="h-6 w-6" />
          </span>
        </div>

        <CadenceTemplateActions
          leadOptions={leadOptions}
          templateId={template.id}
          templateIsSystem={template.isSystem}
        />
      </section>

      <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Các bước trong quy trình</h2>
        <div className="mt-5 space-y-3">
          {(template.steps ?? []).map((step) => (
            <article
              className="rounded-lg border border-slate-200 bg-cloud/60 p-4"
              key={step.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-ocean">Bước {step.stepOrder}</p>
                  <h3 className="mt-1 text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Clock3 aria-hidden="true" className="h-4 w-4 text-ocean" />
                    Ngày +{step.dayOffset} · {getCadenceTaskTypeLabel(step.taskType)} ·{" "}
                    {getCadencePriorityLabel(step.priority)}
                  </p>
                </div>
                {step.suggestedLeadStatus ? (
                  <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    Gợi ý status: {step.suggestedLeadStatus}
                  </span>
                ) : null}
              </div>

              {step.suggestedMessage ? (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-7 text-ink">
                  {step.suggestedMessage}
                </p>
              ) : null}
              {step.suggestedNote ? (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm leading-7 text-slate-600">
                  Note: {step.suggestedNote}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
