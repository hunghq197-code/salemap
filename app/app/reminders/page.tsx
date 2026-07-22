import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type RemindersPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getString(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RemindersPage(props: RemindersPageProps) {
  const searchParams = await props.searchParams;
  const tab = getString(searchParams?.tab);
  const taskTab = tab === "done" ? "completed" : tab;
  const target = taskTab ? `/app/tasks?tab=${taskTab}` : "/app/tasks";

  redirect(target);
}
