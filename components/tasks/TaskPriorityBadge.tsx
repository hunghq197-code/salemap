import { getTaskPriorityOption } from "@/lib/constants/tasks";
import { getPriorityTone, statusToneClasses } from "@/lib/design-system/status";

type TaskPriorityBadgeProps = {
  priority?: string | null;
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const option = getTaskPriorityOption(priority);

  return (
    <span
      className={[
        "inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold",
        statusToneClasses[getPriorityTone(priority)],
      ].join(" ")}
    >
      {option.label}
    </span>
  );
}
