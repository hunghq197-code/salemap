import { CalendarClock, PlusCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { TaskLeadSummary, TaskRecord } from "@/lib/data/tasks";

type RecentLead = {
  address: string | null;
  category: string | null;
  id: string;
  name: string;
  status: string | null;
};

type RecentActivityProps = {
  recentLeads: RecentLead[];
  tasks: TaskRecord[];
};

type ActivityItem = {
  href: string;
  icon: LucideIcon;
  id: string;
  label: string;
  title: string;
};

function getLead(lead?: TaskLeadSummary | TaskLeadSummary[] | null) {
  return Array.isArray(lead) ? lead[0] : lead;
}

function buildActivities(recentLeads: RecentLead[], tasks: TaskRecord[]) {
  const leadItems: ActivityItem[] = recentLeads.slice(0, 5).map((lead) => ({
    href: `/app/leads/${lead.id}`,
    icon: PlusCircle,
    id: `lead-${lead.id}`,
    label: "Lead được lưu",
    title: lead.name,
  }));

  const taskItems: ActivityItem[] = tasks.slice(0, 5).map((task) => {
    const lead = getLead(task.leads);

    return {
      href: lead?.id ? `/app/leads/${lead.id}` : "/app/tasks",
      icon: CalendarClock,
      id: `task-${task.id}`,
      label: "Follow-up đã lên lịch",
      title: task.title,
    };
  });

  return [...leadItems, ...taskItems].slice(0, 8);
}

export function RecentActivity({ recentLeads, tasks }: RecentActivityProps) {
  const items = buildActivities(recentLeads, tasks);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Gần đây
          </p>
          <h2 className="mt-1 text-lg font-bold text-text-primary sm:text-xl">
            Hoạt động mới
          </h2>
        </div>
        <Link className="text-sm font-bold text-primary hover:text-primary-hover" href="/app/leads">
          Mở lead
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 divide-y divide-border-soft">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                href={item.href}
                key={item.id}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-muted text-primary">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-text-primary">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-text-muted">
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-dashed border-border-strong bg-surface-muted p-4">
          <p className="font-bold text-text-primary">Chưa có hoạt động mới.</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Khi bạn lưu lead hoặc tạo follow-up, SaleMap sẽ hiển thị nhịp làm việc gần đây tại đây.
          </p>
        </div>
      )}
    </Card>
  );
}
