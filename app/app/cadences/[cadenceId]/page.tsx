import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  ListChecks,
  MessageSquareText,
} from "lucide-react";
import Link from "next/link";
import { CadenceTemplateActions } from "@/components/cadences/CadenceTemplateActions";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  getCadenceCategoryLabel,
  getCadencePriorityLabel,
  getCadenceTaskTypeLabel,
} from "@/lib/constants/cadences";
import { getCadenceTemplateById } from "@/lib/data/cadences";
import { listTaskLeadOptions } from "@/lib/data/tasks";
import {
  getLeadStatusPresentation,
  statusToneClasses,
} from "@/lib/design-system/status";

export const dynamic = "force-dynamic";

type CadenceDetailPageProps = {
  params: Promise<{
    cadenceId: string;
  }>;
};

function getDurationDays(dayOffsets: number[]) {
  return Math.max(0, ...dayOffsets);
}

export default async function CadenceDetailPage(props: CadenceDetailPageProps) {
  const params = await props.params;
  const [template, leadOptions] = await Promise.all([
    getCadenceTemplateById(params.cadenceId),
    listTaskLeadOptions(),
  ]);
  const steps = template.steps ?? [];
  const durationDays = getDurationDays(steps.map((step) => step.dayOffset));
  const firstStep = steps[0];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-bold text-primary hover:text-text-primary"
        href="/app/cadences"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Quay lại quy trình
      </Link>

      <PageHeader
        actions={
          <CadenceTemplateActions
            className="lg:mt-0"
            leadOptions={leadOptions}
            templateId={template.id}
            templateIsSystem={template.isSystem}
            variant="detail"
          />
        }
        description={template.description || "Quy trình chăm sóc lead."}
        eyebrow={getCadenceCategoryLabel(template.category)}
        fullBleed
        title={template.name}
      >
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={template.isSystem ? "neutral" : "success"}>
            {template.isSystem ? "Template hệ thống" : "Template của tôi"}
          </Badge>
          <Badge tone={template.isActive ? "primary" : "warning"}>
            {template.isActive ? "Cho phép áp dụng" : "Đang tắt"}
          </Badge>
        </div>
      </PageHeader>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Mỗi bước tạo một task theo ngày bắt đầu."
          icon={ListChecks}
          label="Số bước"
          tone="primary"
          value={steps.length}
        />
        <StatCard
          description="Tính từ ngày bắt đầu cadence."
          icon={CalendarDays}
          label="Thời lượng"
          tone="success"
          value={`${durationDays} ngày`}
        />
        <StatCard
          description="Lead đang active hoặc tạm dừng với template này."
          icon={ListChecks}
          label="Lead đang áp dụng"
          tone="warning"
          value={template.activeLeadsCount ?? 0}
        />
        <StatCard
          description={firstStep ? getCadenceTaskTypeLabel(firstStep.taskType) : "Chưa có bước"}
          icon={Clock3}
          label="Việc đầu tiên"
          tone="neutral"
          value={firstStep ? `Ngày +${firstStep.dayOffset}` : "Chưa có"}
        />
      </section>

      <section className="mt-6 rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Timeline chăm sóc</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
              Các mốc này tạo task trong Task Center. Nội dung gợi ý chỉ là preview để sale chủ động xử lý.
            </p>
          </div>
          <Badge tone="primary">{steps.length} bước</Badge>
        </div>

        <div className="mt-6 space-y-4">
          {steps.map((step) => {
            const suggestedStatus = step.suggestedLeadStatus
              ? getLeadStatusPresentation(step.suggestedLeadStatus)
              : null;
            const StatusIcon = suggestedStatus?.icon;

            return (
              <article
                className="relative rounded-card border border-border-soft bg-surface-muted p-4"
                key={step.id}
              >
                <div className="grid gap-4 md:grid-cols-[96px_minmax(0,1fr)]">
                  <div>
                    <p className="text-xs font-bold uppercase text-text-muted">Ngày</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
                      +{step.dayOffset}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary">
                          Bước {step.stepOrder} · {getCadenceTaskTypeLabel(step.taskType)}
                        </p>
                        <h3 className="mt-1 text-lg font-bold leading-7 text-text-primary">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-text-secondary">
                          Ưu tiên {getCadencePriorityLabel(step.priority)}
                        </p>
                      </div>
                      {suggestedStatus && StatusIcon ? (
                        <span
                          className={[
                            "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                            statusToneClasses[suggestedStatus.badgeVariant],
                          ].join(" ")}
                        >
                          <StatusIcon aria-hidden="true" className="h-3.5 w-3.5" />
                          Gợi ý: {suggestedStatus.label}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {step.suggestedMessage ? (
                        <div className="rounded-control border border-border-soft bg-surface px-3 py-2">
                          <p className="flex items-center gap-2 text-xs font-bold text-text-muted">
                            <MessageSquareText aria-hidden="true" className="h-3.5 w-3.5" />
                            Tin nhắn gợi ý
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
                            {step.suggestedMessage}
                          </p>
                        </div>
                      ) : null}
                      {step.suggestedNote ? (
                        <div className="rounded-control border border-border-soft bg-surface px-3 py-2">
                          <p className="flex items-center gap-2 text-xs font-bold text-text-muted">
                            <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                            Note nội bộ
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
                            {step.suggestedNote}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
