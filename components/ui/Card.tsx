import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type CardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  padded?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Card<T extends ElementType = "section">({
  as,
  children,
  className,
  interactive = false,
  padded = true,
  ...props
}: CardProps<T>) {
  const Component = as || "section";

  return (
    <Component
      className={joinClasses(
        "rounded-card border border-border-soft bg-surface shadow-card",
        padded && "p-4 sm:p-5 lg:p-6",
        interactive &&
          "transition duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-floating",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
