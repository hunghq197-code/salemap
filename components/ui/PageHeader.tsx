import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  children?: ReactNode;
  description?: string;
  eyebrow?: string;
  fullBleed?: boolean;
  title: string;
};

export function PageHeader({
  actions,
  children,
  description,
  eyebrow,
  fullBleed = false,
  title,
}: PageHeaderProps) {
  return (
    <section
      className={[
        "flex flex-col justify-between gap-5",
        fullBleed ? "" : "mx-auto max-w-6xl",
        actions ? "lg:flex-row lg:items-end" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
    </section>
  );
}
