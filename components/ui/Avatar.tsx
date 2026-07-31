type AvatarProps = {
  className?: string;
  imageAlt?: string;
  imageUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  lg: "h-12 w-12 text-base",
  md: "h-10 w-10 text-sm",
  sm: "h-8 w-8 text-xs",
} as const;

function getInitials(name?: string | null) {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("") || "SM"
  );
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Avatar({
  className,
  imageAlt,
  imageUrl,
  name,
  size = "md",
}: AvatarProps) {
  const baseClasses = joinClasses(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent font-black text-white",
    sizeClasses[size],
    className,
  );

  if (imageUrl) {
    return (
      <span
        aria-label={imageAlt || name || "Avatar"}
        className={joinClasses(baseClasses, "bg-cover bg-center")}
        role="img"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    );
  }

  return <span className={baseClasses}>{getInitials(name)}</span>;
}
