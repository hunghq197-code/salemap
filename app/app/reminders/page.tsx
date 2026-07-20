import Link from "next/link";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { ReminderTabs } from "@/components/reminders/ReminderTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Toast } from "@/components/ui/Toast";
import { getReminders } from "@/lib/data/reminders";
import { reminderTabSchema } from "@/lib/validators/reminder";

export const dynamic = "force-dynamic";

type RemindersPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getEmptyCopy(tab: string) {
  if (tab === "overdue") {
    return {
      title: "Không có việc quá hạn. Rất tốt!",
      body: "Các việc follow-up quá hạn sẽ xuất hiện ở đây để bạn xử lý trước.",
    };
  }

  if (tab === "upcoming") {
    return {
      title: "Chưa có việc sắp tới.",
      body: "Tạo follow-up từ chi tiết lead để lên lịch chăm sóc khách.",
    };
  }

  if (tab === "done") {
    return {
      title: "Chưa có việc đã hoàn thành.",
      body: "Khi bạn đánh dấu follow-up đã xong, việc đó sẽ được lưu tại đây.",
    };
  }

  return {
    title: "Hôm nay bạn chưa có việc follow-up nào.",
    body: "Vào chi tiết lead để tạo lịch follow-up nhanh hoặc tạo lịch kèm theo khi lưu ghi chú.",
  };
}

export default async function RemindersPage(props: RemindersPageProps) {
  const searchParams = await props.searchParams;
  const tabResult = reminderTabSchema.safeParse(getString(searchParams?.tab) || "today");
  const activeTab = tabResult.success ? tabResult.data : "today";
  const reminders = await getReminders({ tab: activeTab });
  const emptyCopy = getEmptyCopy(activeTab);

  return (
    <div className="mx-auto max-w-5xl">
      <Toast code={getString(searchParams?.toast)} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
            Follow-up
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Nhắc việc
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Nhắc việc giúp bạn không quên gọi lại, nhắn lại hoặc ghé lại khách đúng thời điểm.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mint px-5 py-3 text-base font-bold text-ink shadow-soft hover:bg-[#5de0b3]"
          href="/app/leads"
        >
          Chọn lead để tạo lịch
        </Link>
      </div>

      <ReminderTabs activeTab={activeTab} />

      {reminders.length > 0 ? (
        <div className="mt-5 space-y-4">
          {reminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} tab={activeTab} />
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState description={emptyCopy.body} title={emptyCopy.title} />
        </div>
      )}
    </div>
  );
}
