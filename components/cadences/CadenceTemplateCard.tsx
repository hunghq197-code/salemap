import {
  ArrowRight,
  CalendarDays,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Quote,
  Repeat2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { CadenceTemplateActions } from "@/components/cadences/CadenceTemplateActions";
import { Badge } from "@/components/ui/Badge";
import {
  getCadenceCategoryLabel,
  getCadenceTaskTypeLabel,
} from "@/lib/constants/cadences";
import type { TaskLeadSummary } from "@/lib/data/tasks";
import type { CadenceTemplate } from "@/lib/types/cadences";

type CadenceTemplateCardProps = {
  leadOptions: TaskLeadSummary[];
  template: CadenceTemplate;
};

const taskTypeIcons = {
  call: Phone,
  check_in: Repeat2,
  email: Mail,
  follow_up: Repeat2,
  meeting: UsersRound,
  other: FileText,
  quote: Quote,
  zalo_message: MessageCircle,
} as const;

function getDurationDays(template: CadenceTemplate) {
  return Math.max(0, ...(template.steps ?? []).map((step) => step.dayOffset));
}

function getTaskTypes(template: CadenceTemplate) {
  return Array.from(new Set((template.steps ?? []).map((step) => step.taskType))).slice(0, 4);
}

export function CadenceTemplateCard({
  leadOptions,
  template,
}: CadenceTemplateCardProps) {
  const durationDays = getDurationDays(template);
  const taskTypes = getTaskTypes(template);

  return (
    <article className="rounded-card border border-border-soft bg-surface p-4 shadow-card transition hover:border-primary/40 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{getCadenceCategoryLabel(template.category)}</Badge>
            <Badge tone={template.isSystem ? "neutral" : "success"}>
              {template.isSystem ? "Hệ thống" : "Của tôi"}
            </Badge>
          </div>
          <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-7 text-text-primary sm:text-xl">
            {template.name}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
            {template.description || "Quy trình chăm sóc lead."}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
          <CalendarDays aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-control bg-surface-muted px-3 py-2">
          <p className="text-xs font-bold text-text-muted">Bước</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
            {template.stepsCount || template.steps?.length || 0}
          </p>
        </div>
        <div className="rounded-control bg-surface-muted px-3 py-2">
          <p className="text-xs font-bold text-text-muted">Thời lượng</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
            {durationDays} ngày
          </p>
        </div>
        <div className="rounded-control bg-surface-muted px-3 py-2">
          <p className="text-xs font-bold text-text-muted">Lead active</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
            {template.activeLeadsCount || 0}
          </p>
        </div>
      </div>

      {taskTypes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {taskTypes.map((taskType) => {
            const Icon = taskTypeIcons[taskType as keyof typeof taskTypeIcons] || FileText;

            return (
              <span
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border-soft bg-surface px-3 py-1 text-xs font-bold text-text-secondary"
                key={taskType}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                {getCadenceTaskTypeLabel(taskType)}
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:border-primary/40 hover:text-primary"
          href={`/app/cadences/${template.id}`}
        >
          Chi tiết
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <CadenceTemplateActions
        leadOptions={leadOptions}
        templateId={template.id}
        templateIsSystem={template.isSystem}
        variant="card"
      />
    </article>
  );
}
