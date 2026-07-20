type AdminPageHeaderProps = {
  description: string;
  eyebrow?: string;
  title: string;
};

export function AdminPageHeader({
  description,
  eyebrow = "SaleMap Admin",
  title,
}: AdminPageHeaderProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
        {description}
      </p>
    </div>
  );
}
