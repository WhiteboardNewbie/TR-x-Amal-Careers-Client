export function StaffBanner({
  title,
  children,
  actions,
  footer,
  eyebrow = "Hiring",
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-r from-amal-staff-banner to-amal-red p-8 text-amal-white shadow-sm">
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amal-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-amal-white/10 blur-3xl" />
      <div
        className={
          actions
            ? "relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            : "relative"
        }
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amal-white/70">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-amal-white/80">{children}</p>
          {footer ? <div className="mt-5">{footer}</div> : null}
        </div>
        {actions}
      </div>
    </section>
  );
}
