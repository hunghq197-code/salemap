import Link from "next/link";
import type { ReminderTab } from "@/lib/validators/reminder";

const tabs: Array<{ label: string; value: ReminderTab }> = [
  { label: "Hôm nay", value: "today" },
  { label: "Quá hạn", value: "overdue" },
  { label: "Sắp tới", value: "upcoming" },
  { label: "Đã xong", value: "done" },
];

type ReminderTabsProps = {
  activeTab: ReminderTab;
};

export function ReminderTabs({ activeTab }: ReminderTabsProps) {
  return (
    <div className="mt-6 overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <Link
              className={[
                "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition",
                isActive ? "bg-ink text-white" : "text-slate-600 hover:bg-cloud hover:text-ink",
              ].join(" ")}
              href={`/app/reminders?tab=${tab.value}`}
              key={tab.value}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
