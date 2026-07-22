import { CalendarClock, Clock3, UsersRound } from "lucide-react";
import type { TaskCounts as TaskCountsData } from "@/lib/data/tasks";

type TaskCountsProps = {
  counts: TaskCountsData;
};

const items = [
  { icon: CalendarClock, key: "today", label: "Hôm nay" },
  { icon: Clock3, key: "overdue", label: "Quá hạn" },
  { icon: CalendarClock, key: "upcoming", label: "Sắp tới" },
  { icon: UsersRound, key: "leadsWithoutTasks", label: "Chưa có lịch" },
] as const;

export function TaskCounts({ counts }: TaskCountsProps) {
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const value = counts[item.key];

        return (
          <article
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            key={item.key}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-500">{item.label}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/15 text-ocean">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
          </article>
        );
      })}
    </section>
  );
}
