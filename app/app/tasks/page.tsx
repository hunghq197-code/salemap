import { TaskCenterPage } from "@/components/tasks/TaskCenterPage";
import {
  getLeadsWithoutTasks,
  getTaskCounts,
  getTasksForUser,
  listTaskLeadOptions,
} from "@/lib/data/tasks";
import { getTasksQuerySchema } from "@/lib/validators/tasks";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TasksPage(props: TasksPageProps) {
  const searchParams = (await props.searchParams) ?? {};
  const queryResult = getTasksQuerySchema.safeParse({
    limit: getString(searchParams.limit) || "20",
    page: getString(searchParams.page) || "1",
    priority: getString(searchParams.priority) || undefined,
    status: getString(searchParams.status) || undefined,
    tab: getString(searchParams.tab) || "today",
    taskType: getString(searchParams.taskType) || undefined,
  });
  const taskQuery = queryResult.success
    ? queryResult.data
    : {
        limit: 20,
        page: 1,
        priority: undefined,
        status: undefined,
        tab: "today" as const,
        taskType: undefined,
      };
  const activeTab = taskQuery.tab;
  const [counts, leadOptions, leadsWithoutTasks, taskResult] = await Promise.all([
    getTaskCounts(),
    listTaskLeadOptions(),
    activeTab === "no_schedule" ? getLeadsWithoutTasks(30) : Promise.resolve([]),
    activeTab === "no_schedule"
      ? Promise.resolve({ items: [], limit: 20, page: 1, total: 0 })
      : getTasksForUser(taskQuery),
  ]);

  return (
    <TaskCenterPage
      activeTab={activeTab}
      counts={counts}
      filters={{
        priority: taskQuery.priority || "",
        status: taskQuery.status || "",
        taskType: taskQuery.taskType || "",
      }}
      leadOptions={leadOptions}
      leadsWithoutTasks={leadsWithoutTasks}
      taskResult={taskResult}
    />
  );
}
