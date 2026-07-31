"use client";

import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Loader2,
  ListChecks,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants/lead-status";
import { getTaskTypeOption } from "@/lib/constants/tasks";
import type { PipelineColumn, PipelineLeadCard } from "@/lib/data/lead-pipeline";
import {
  getLeadStatusPresentation,
  statusToneClasses,
} from "@/lib/design-system/status";

type PipelineBoardProps = {
  columns: PipelineColumn[];
  selectedStage?: string;
};

type BoardMessage = {
  leadId?: string;
  tone: "error" | "success";
  text: string;
};

const statusSelectClass =
  "min-h-10 w-full appearance-none rounded-control border border-border-soft bg-surface py-2 pl-3 pr-9 text-sm font-bold text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-muted";

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function formatShortDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getFollowUpCopy(value?: string | null) {
  const label = formatShortDate(value);

  if (!value || !label) {
    return {
      text: "Chưa có follow-up",
      tone: "neutral" as const,
    };
  }

  const followUpDate = new Date(value);
  const todayStart = startOfToday();
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (followUpDate < todayStart) {
    return {
      text: `Quá hạn ${label}`,
      tone: "danger" as const,
    };
  }

  if (followUpDate < tomorrowStart) {
    return {
      text: `Hôm nay ${label}`,
      tone: "warning" as const,
    };
  }

  return {
    text: `Follow-up ${label}`,
    tone: "primary" as const,
  };
}

function formatSource(value?: string | null) {
  const labels: Record<string, string> = {
    import_csv: "Import CSV",
    import_excel: "Import Excel",
    manual: "Thủ công",
    map_area: "Bản đồ khu vực",
    map_near_me: "Bản đồ gần tôi",
    route_search: "Tuyến đường",
  };

  if (!value) return null;
  return labels[value] || value.replaceAll("_", " ");
}

function isInteractiveElement(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("a,button,input,select,textarea,label"))
    : false;
}

function StageBadge({ status }: { status?: string | null }) {
  const presentation = getLeadStatusPresentation(status);
  const Icon = presentation.icon;

  return (
    <span
      className={joinClasses(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
        statusToneClasses[presentation.badgeVariant],
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {presentation.label}
    </span>
  );
}

function StatusSelect({
  disabled,
  lead,
  onStatusChange,
  value,
}: {
  disabled: boolean;
  lead: PipelineLeadCard;
  onStatusChange: (leadId: string, fromStatus: string | null, toStatus: string) => void;
  value: string;
}) {
  return (
    <label className="block text-xs font-bold text-text-muted">
      Chuyển stage
      <span className="relative mt-1 block">
        <select
          className={statusSelectClass}
          disabled={disabled}
          onChange={(event) => onStatusChange(lead.id, lead.status, event.target.value)}
          value={value}
        >
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        />
      </span>
    </label>
  );
}

function PipelineLeadCardView({
  lead,
  onOpen,
  onStatusChange,
  pending,
  statusValue,
}: {
  lead: PipelineLeadCard;
  onOpen: (leadId: string) => void;
  onStatusChange: (leadId: string, fromStatus: string | null, toStatus: string) => void;
  pending: boolean;
  statusValue: string;
}) {
  const followUp = getFollowUpCopy(lead.next_follow_up_at);
  const source = formatSource(lead.source);
  const meta = [lead.category, source].filter(Boolean).join(" · ");
  const visibleTags = lead.tags.slice(0, 2);
  const extraTagCount = Math.max(0, lead.tags.length - visibleTags.length);
  const hasOverdueTask = lead.overdueTasksCount > 0;
  const taskCopy = hasOverdueTask
    ? `${lead.overdueTasksCount} task quá hạn`
    : lead.openTasksCount > 0
      ? `${lead.openTasksCount} task đang mở`
      : "Chưa có task mở";
  const cadenceProgress =
    lead.activeCadence && lead.activeCadence.totalSteps > 0
      ? `${lead.activeCadence.completedSteps}/${lead.activeCadence.totalSteps}`
      : null;

  return (
    <article
      className="group cursor-pointer rounded-card border border-border-soft bg-surface p-3 shadow-sm transition hover:border-primary/40 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-primary/25"
      onClick={(event) => {
        if (!isInteractiveElement(event.target)) {
          onOpen(lead.id);
        }
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
          event.preventDefault();
          onOpen(lead.id);
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StageBadge status={statusValue} />
          <h3 className="mt-3 line-clamp-2 text-base font-bold leading-6 text-text-primary group-hover:text-primary">
            {lead.name}
          </h3>
          <p className="mt-1 truncate text-sm font-semibold text-text-secondary">
            {meta || "Chưa phân loại"}
          </p>
        </div>
        <Link
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border-soft bg-surface text-text-secondary transition hover:border-primary/40 hover:text-primary"
          href={`/app/leads/${lead.id}`}
          title="Xem lead"
        >
          <Eye aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Xem lead {lead.name}</span>
        </Link>
      </div>

      <div className="mt-3 grid gap-2 text-xs font-bold">
        <span
          className={joinClasses(
            "inline-flex min-h-8 items-center gap-1.5 rounded-control border px-2.5 py-1",
            statusToneClasses[followUp.tone],
          )}
        >
          <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
          {followUp.text}
        </span>
        <span
          className={joinClasses(
            "inline-flex min-h-8 items-center gap-1.5 rounded-control border px-2.5 py-1",
            hasOverdueTask ? statusToneClasses.danger : statusToneClasses.neutral,
          )}
        >
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          {taskCopy}
          {lead.nextTaskType ? ` · ${getTaskTypeOption(lead.nextTaskType).label}` : ""}
        </span>
        {lead.activeCadence ? (
          <span className="inline-flex min-h-8 min-w-0 items-center gap-1.5 rounded-control border border-accent/20 bg-accent-soft px-2.5 py-1 text-cyan-700">
            <ListChecks aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{lead.activeCadence.templateName}</span>
            {cadenceProgress ? <span className="shrink-0">· {cadenceProgress}</span> : null}
          </span>
        ) : null}
      </div>

      {visibleTags.length > 0 ? (
        <div className="mt-3 flex min-w-0 flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-full border border-border-soft bg-surface-muted px-2.5 py-1 text-xs font-bold text-text-secondary"
              key={tag.id}
            >
              <Tags aria-hidden="true" className="h-3 w-3 shrink-0" />
              <span className="truncate">{tag.name}</span>
            </span>
          ))}
          {extraTagCount > 0 ? (
            <span className="inline-flex min-h-7 items-center rounded-full border border-border-soft bg-surface-muted px-2.5 py-1 text-xs font-bold text-text-muted">
              +{extraTagCount}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <StatusSelect
            disabled={pending}
            lead={lead}
            onStatusChange={onStatusChange}
            value={statusValue}
          />
        </div>
        {pending ? (
          <Loader2 aria-hidden="true" className="mt-5 h-4 w-4 animate-spin text-primary" />
        ) : null}
      </div>
    </article>
  );
}

function EmptyColumn({ text }: { text: string }) {
  return (
    <div className="rounded-card border border-dashed border-border-soft bg-surface-muted p-4 text-sm font-semibold leading-6 text-text-secondary">
      {text}
    </div>
  );
}

export function PipelineBoard({ columns, selectedStage }: PipelineBoardProps) {
  const router = useRouter();
  const safeInitialStage =
    columns.find((column) => column.key === selectedStage)?.key ?? columns[0]?.key ?? "";
  const [activeStage, setActiveStage] = useState(safeInitialStage);
  const [message, setMessage] = useState<BoardMessage | null>(null);
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [statusByLeadId, setStatusByLeadId] = useState<Record<string, string>>({});

  const activeColumn = useMemo(
    () => columns.find((column) => column.key === activeStage) ?? columns[0],
    [activeStage, columns],
  );

  async function updateStatus(leadId: string, fromStatus: string | null, toStatus: string) {
    if (!toStatus || toStatus === fromStatus) {
      return;
    }

    setPendingLeadId(leadId);
    setMessage(null);
    setStatusByLeadId((current) => ({ ...current, [leadId]: toStatus }));

    try {
      const response = await fetch("/api/leads/pipeline/update-status", {
        body: JSON.stringify({ fromStatus, leadId, toStatus }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as
        | { data?: { next_follow_up_at?: string | null }; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "Không thể cập nhật trạng thái.");
      }

      setMessage({
        leadId: toStatus === "follow_up" && !body?.data?.next_follow_up_at ? leadId : undefined,
        text:
          toStatus === "won"
            ? "Đã chuyển lead sang Đã chốt."
            : "Đã cập nhật stage lead.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setStatusByLeadId((current) => {
        const next = { ...current };

        if (fromStatus) {
          next[leadId] = fromStatus;
        } else {
          delete next[leadId];
        }

        return next;
      });
      setMessage({
        text: error instanceof Error ? error.message : "Không thể cập nhật trạng thái.",
        tone: "error",
      });
    } finally {
      setPendingLeadId(null);
    }
  }

  function openLead(leadId: string) {
    router.push(`/app/leads/${leadId}`);
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div
          className={joinClasses(
            "rounded-card border bg-surface px-4 py-3 text-sm font-bold shadow-sm",
            message.tone === "error"
              ? "border-danger/20 text-danger"
              : "border-success/20 text-text-primary",
          )}
          role={message.tone === "error" ? "alert" : "status"}
        >
          <div className="flex flex-wrap items-center gap-2">
            {message.tone === "error" ? null : (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-success" />
            )}
            <span>{message.text}</span>
            {message.leadId ? (
              <Link
                className="inline-flex items-center gap-1 text-primary hover:text-text-primary"
                href={`/app/leads/${message.leadId}#create-follow-up`}
              >
                <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                Tạo follow-up
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="lg:hidden">
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-max gap-2">
            {columns.map((column) => {
              const active = column.key === activeStage;
              const presentation = getLeadStatusPresentation(column.key);

              return (
                <button
                  aria-pressed={active}
                  className={joinClasses(
                    "inline-flex min-h-11 items-center gap-2 rounded-control border px-3 py-2 text-sm font-bold transition",
                    active
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border-soft bg-surface text-text-secondary",
                  )}
                  key={column.key}
                  onClick={() => setActiveStage(column.key)}
                  type="button"
                >
                  {presentation.label}
                  <span
                    className={joinClasses(
                      "rounded-full px-2 py-0.5 text-xs",
                      active ? "bg-white/20 text-white" : "bg-surface-muted text-text-muted",
                    )}
                  >
                    {column.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeColumn ? (
          <section className="mt-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-text-primary">{activeColumn.label}</h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {activeColumn.description}
                </p>
              </div>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
                {activeColumn.count}
              </span>
            </div>
            <div className="grid gap-3">
              {activeColumn.leads.length > 0 ? (
                activeColumn.leads.map((lead) => (
                  <PipelineLeadCardView
                    key={lead.id}
                    lead={lead}
                    onOpen={openLead}
                    onStatusChange={updateStatus}
                    pending={pendingLeadId === lead.id}
                    statusValue={statusByLeadId[lead.id] ?? lead.status ?? activeColumn.key}
                  />
                ))
              ) : (
                <EmptyColumn text={activeColumn.emptyText} />
              )}
            </div>
          </section>
        ) : null}
      </div>

      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-card border border-border-soft bg-background-subtle p-3 shadow-card">
          <div className="flex min-w-full gap-4">
            {columns.map((column) => {
              const presentation = getLeadStatusPresentation(column.key);
              const Icon = presentation.icon;

              return (
                <section
                  className="flex max-h-[calc(100vh-220px)] w-[304px] shrink-0 flex-col rounded-card border border-border-soft bg-surface shadow-sm"
                  key={column.key}
                >
                  <div className="sticky top-0 z-10 rounded-t-card border-b border-border-soft bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={joinClasses(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-control",
                              statusToneClasses[presentation.badgeVariant],
                            )}
                          >
                            <Icon aria-hidden="true" className="h-4 w-4" />
                          </span>
                          <h2 className="truncate font-bold text-text-primary">
                            {column.label}
                          </h2>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-text-secondary">
                          {column.description}
                        </p>
                      </div>
                      <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-primary-soft px-2 text-sm font-bold text-primary">
                        {column.count}
                      </span>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                    {column.leads.length > 0 ? (
                      column.leads.map((lead) => (
                        <PipelineLeadCardView
                          key={lead.id}
                          lead={lead}
                          onOpen={openLead}
                          onStatusChange={updateStatus}
                          pending={pendingLeadId === lead.id}
                          statusValue={statusByLeadId[lead.id] ?? lead.status ?? column.key}
                        />
                      ))
                    ) : (
                      <EmptyColumn text={column.emptyText} />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
