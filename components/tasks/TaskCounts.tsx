import { CalendarClock, Clock3, UsersRound } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { TaskCounts as TaskCountsData } from "@/lib/data/tasks";

type TaskCountsProps = {
  counts: TaskCountsData;
};

const items = [
  {
    description: "Việc cần làm trong ngày",
    icon: CalendarClock,
    key: "today",
    label: "Hôm nay",
    tone: "warning",
  },
  {
    description: "Nên xử lý trước các việc khác",
    icon: Clock3,
    key: "overdue",
    label: "Quá hạn",
    tone: "danger",
  },
  {
    description: "Đã có lịch cho các ngày tới",
    icon: CalendarClock,
    key: "upcoming",
    label: "Sắp tới",
    tone: "primary",
  },
  {
    description: "Lead active chưa có follow-up mở",
    icon: UsersRound,
    key: "leadsWithoutTasks",
    label: "Chưa có lịch",
    tone: "neutral",
  },
] as const;

export function TaskCounts({ counts }: TaskCountsProps) {
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const value = counts[item.key];
        const meta =
          item.key === "today" ? `${counts.completedToday} hoàn thành hôm nay` : undefined;

        return (
          <StatCard
            description={item.description}
            icon={Icon}
            key={item.key}
            label={item.label}
            meta={meta}
            tone={item.tone}
            value={value}
          />
        );
      })}
    </section>
  );
}
