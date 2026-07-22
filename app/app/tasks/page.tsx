import { TaskCenterPage } from "@/components/tasks/TaskCenterPage";
import {
  getLeadsWithoutTasks,
  getTaskCounts,
  getTasksForUser,
  listTaskLeadOptions,
} from "@/lib/data/tasks";
import { taskTabSchema } from "@/lib/validators/tasks";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TasksPage(props: TasksPageProps) {
  const searchParams = await props.searchParams;
  const tabResult = taskTabSchema.safeParse(getString(searchParams?.tab) || "today");
  const activeTab = tabResult.success ? tabResult.data : "today";
  const [counts, leadOptions, leadsWithoutTasks, taskResult] = await Promise.all([
    getTaskCounts(),
    listTaskLeadOptions(),
    activeTab === "no_schedule" ? getLeadsWithoutTasks(50) : Promise.resolve([]),
    activeTab === "no_schedule"
      ? Promise.resolve({ items: [], limit: 30, page: 1, total: 0 })
      : getTasksForUser({ limit: 30, tab: activeTab }),
  ]);

  return (
    <TaskCenterPage
      activeTab={activeTab}
      counts={counts}
      leadOptions={leadOptions}
      leadsWithoutTasks={leadsWithoutTasks}
      tasks={taskResult.items}
    />
  );
}
