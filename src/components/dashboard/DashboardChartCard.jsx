import { cn } from "@/lib/utils";

export function DashboardChartCard({
  title,
  subtitle,
  children,
  className,
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-[20px] border border-zinc-200/90 bg-white p-6",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]",
        "dark:border-zinc-800 dark:bg-zinc-950/80",
        "dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <header className="mb-5 shrink-0">
        <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </header>
      <div className="min-h-[220px] flex-1">{children}</div>
    </article>
  );
}
