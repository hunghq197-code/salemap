import {
  CalendarPlus,
  MapPinned,
  Plus,
  Search,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { TaskCounts } from "@/lib/data/tasks";

type DashboardHeaderProps = {
  fullName?: string;
  taskCounts: TaskCounts;
};

function getFirstName(fullName?: string) {
  return fullName?.trim().split(/\s+/).at(-1) || "bạn";
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 11) {
    return {
      icon: Sunrise,
      label: "Chào buổi sáng",
    };
  }

  if (hour < 18) {
    return {
      icon: Sun,
      label: "Chào buổi chiều",
    };
  }

  return {
    icon: Sunset,
    label: "Chào buổi tối",
  };
}

function getSubtitle(taskCounts: TaskCounts) {
  if (taskCounts.today === 0 && taskCounts.overdue === 0) {
    return "Hôm nay chưa có việc nào được lên lịch. Bạn có thể bắt đầu bằng cách tìm khách mới.";
  }

  if (taskCounts.overdue > 0) {
    return `Hôm nay bạn có ${taskCounts.today} việc cần làm và ${taskCounts.overdue} khách đang quá hạn chăm sóc.`;
  }

  return `Hôm nay bạn có ${taskCounts.today} việc cần làm. Giữ nhịp follow-up để không bỏ lỡ khách đang quan tâm.`;
}

export function DashboardHeader({ fullName, taskCounts }: DashboardHeaderProps) {
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <section className="relative overflow-hidden rounded-shell bg-sidebar p-4 text-white shadow-floating sm:p-7 lg:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:40px_40px]"
      />
      <div
        aria-hidden="true"
        className="absolute right-6 top-6 hidden h-28 w-28 rounded-full border border-cyan-300/20 lg:block"
      >
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        <span className="absolute inset-6 rounded-full border border-cyan-300/15" />
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <Badge className="border-white/10 bg-white/10 text-white" tone="outline">
            <GreetingIcon aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
            Tổng quan hôm nay
          </Badge>
          <h1 className="mt-4 text-2xl font-bold leading-tight tracking-normal sm:text-4xl">
            {greeting.label}, {getFirstName(fullName)}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            {getSubtitle(taskCounts)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone={taskCounts.overdue > 0 ? "danger" : "success"}>
              {taskCounts.overdue} quá hạn
            </Badge>
            <Badge tone="primary">{taskCounts.today} việc hôm nay</Badge>
            <Badge tone="warning">{taskCounts.leadsWithoutTasks} lead chưa có lịch</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3">
          <Link
            className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-primary-hover sm:col-span-1 sm:px-5"
            href="/app/discover"
            prefetch={false}
          >
            <Search aria-hidden="true" className="h-5 w-5" />
            Tìm khách mới
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/15 bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/15 sm:px-5"
            href="/app/leads?create=1"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Thêm lead
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-white/15 bg-white/10 px-3 py-3 text-sm font-bold text-white transition hover:bg-white/15 sm:px-5"
            href="/app/tasks"
          >
            <CalendarPlus aria-hidden="true" className="h-4 w-4" />
            Follow-up
          </Link>
        </div>
      </div>

      <div className="relative mt-6 grid gap-2 sm:grid-cols-3">
        {[
          { icon: MapPinned, label: "Tìm quanh khu vực", value: "Map Discovery" },
          { icon: CalendarPlus, label: "Ưu tiên", value: "Task hôm nay" },
          { icon: Search, label: "Hành động tiếp theo", value: "Quét khách mới" },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="rounded-card border border-white/10 bg-white/[0.06] px-3 py-3"
              key={item.label}
            >
              <div className="flex items-center gap-2 text-slate-300">
                <Icon aria-hidden="true" className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-[0.14em]">
                  {item.label}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">{item.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
