import { Bell, Clock3, Target, UsersRound } from "lucide-react";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import type { TaskCounts } from "@/lib/data/tasks";

type DashboardStatGridProps = {
  newLeadsThisWeek: number;
  taskCounts: TaskCounts;
  totalLeads: number;
};

export function DashboardStatGrid({
  newLeadsThisWeek,
  taskCounts,
  totalLeads,
}: DashboardStatGridProps) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <DashboardStatCard
        description="Toàn bộ khách hàng tiềm năng chưa lưu trữ."
        href="/app/leads"
        icon={UsersRound}
        label="Lead đang quản lý"
        value={totalLeads}
      />
      <DashboardStatCard
        description="Những việc đã lên lịch trong ngày."
        href="/app/tasks"
        icon={Bell}
        label="Việc hôm nay"
        tone="warning"
        value={taskCounts.today}
      />
      <DashboardStatCard
        description="Cần xử lý trước khi mở rộng tìm kiếm."
        href="/app/tasks?tab=overdue"
        icon={Clock3}
        label="Việc quá hạn"
        tone={taskCounts.overdue > 0 ? "danger" : "success"}
        value={taskCounts.overdue}
      />
      <DashboardStatCard
        description="Lead mới phát sinh trong tuần này."
        href="/app/leads"
        icon={Target}
        label="Lead mới tuần này"
        tone="success"
        value={newLeadsThisWeek}
      />
    </section>
  );
}
