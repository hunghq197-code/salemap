import { getTaskTypeOption } from "@/lib/constants/tasks";

type TaskTypeBadgeProps = {
  type?: string | null;
};

export function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  const option = getTaskTypeOption(type);

  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-ocean/20 bg-ocean/10 px-3 py-1 text-xs font-bold text-ocean">
      {option.label}
    </span>
  );
}
