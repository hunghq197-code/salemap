import { getTaskPriorityOption } from "@/lib/constants/tasks";

type TaskPriorityBadgeProps = {
  priority?: string | null;
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const option = getTaskPriorityOption(priority);

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold",
        option.badgeClass,
      ].join(" ")}
    >
      {option.label}
    </span>
  );
}
