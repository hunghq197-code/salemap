import Link from "next/link";
import { TASK_TABS, type TaskTab } from "@/lib/constants/tasks";
import type { TaskCounts } from "@/lib/data/tasks";

type TaskTabsProps = {
  activeTab: TaskTab;
  counts: TaskCounts;
};

function getTabCount(tab: TaskTab, counts: TaskCounts) {
  if (tab === "today") return counts.today;
  if (tab === "overdue") return counts.overdue;
  if (tab === "upcoming") return counts.upcoming;
  if (tab === "no_schedule") return counts.leadsWithoutTasks;
  return counts.completedToday;
}

export function TaskTabs({ activeTab, counts }: TaskTabsProps) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {TASK_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          const count = getTabCount(tab.value, counts);

          return (
            <Link
              className={[
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                isActive
                  ? "bg-ink text-white"
                  : "text-slate-600 hover:bg-cloud hover:text-ink",
              ].join(" ")}
              href={`/app/tasks?tab=${tab.value}`}
              key={tab.value}
            >
              {tab.label}
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
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
