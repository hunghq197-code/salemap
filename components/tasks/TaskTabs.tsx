import Link from "next/link";
import { TASK_TABS, type TaskTab } from "@/lib/constants/tasks";
import type { TaskCounts } from "@/lib/data/tasks";

type TaskTabsProps = {
  activeTab: TaskTab;
  counts: TaskCounts;
  filters?: {
    priority?: string;
    status?: string;
    taskType?: string;
  };
};

function getTabCount(tab: TaskTab, counts: TaskCounts) {
  if (tab === "today") return counts.today;
  if (tab === "overdue") return counts.overdue;
  if (tab === "upcoming") return counts.upcoming;
  if (tab === "no_schedule") return counts.leadsWithoutTasks;
  return counts.completedToday;
}

function getTabHref(
  tab: TaskTab,
  filters: NonNullable<TaskTabsProps["filters"]> = {},
) {
  const params = new URLSearchParams({ tab });

  if (filters.priority) params.set("priority", filters.priority);
  if (filters.status) params.set("status", filters.status);
  if (filters.taskType) params.set("taskType", filters.taskType);

  return `/app/tasks?${params.toString()}`;
}

export function TaskTabs({ activeTab, counts, filters }: TaskTabsProps) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-card border border-border-soft bg-surface p-1.5 shadow-card">
        {TASK_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const count = getTabCount(tab.value, counts);

          return (
            <Link
              className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-bold transition duration-150",
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-text-secondary hover:bg-primary-soft hover:text-primary",
              ].join(" ")}
              href={getTabHref(tab.value, filters)}
              key={tab.value}
            >
              {tab.label}
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive ? "bg-white/15 text-white" : "bg-surface-muted text-text-muted",
                ].join(" ")}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
