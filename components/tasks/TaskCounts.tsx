import { CalendarClock, Clock3, UsersRound } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { TaskCounts as TaskCountsData } from "@/lib/data/tasks";

type TaskCountsProps = {
  counts: TaskCountsData;
};

const items = [
  { icon: CalendarClock, key: "today", label: "Hôm nay", tone: "warning" },
  { icon: Clock3, key: "overdue", label: "Quá hạn", tone: "danger" },
  { icon: CalendarClock, key: "upcoming", label: "Sắp tới", tone: "primary" },
  { icon: UsersRound, key: "leadsWithoutTasks", label: "Chưa có lịch", tone: "neutral" },
] as const;

export function TaskCounts({ counts }: TaskCountsProps) {
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const value = counts[item.key];

        return (
          <StatCard
            icon={Icon}
            key={item.key}
            label={item.label}
            tone={item.tone}
            value={value}
          />
        );
      })}
    </section>
  );
}
