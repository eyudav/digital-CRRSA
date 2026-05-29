import { cn } from "@/lib/utils";
import { DashboardChartCard } from "./DashboardChartCard";
import { ApplicationStatusChart } from "./ApplicationStatusChart";
import { OutcomeDistributionChart } from "./OutcomeDistributionChart";
import { SubmissionsTrendChart } from "./SubmissionsTrendChart";

export function DashboardAnalytics({ apps = [], className }) {
  return (
    <section
      className={cn(
        "mt-8 rounded-[20px] border border-zinc-200/80 bg-zinc-50/90 p-6 md:p-8",
        "dark:border-zinc-800 dark:bg-zinc-900/50",
        className,
      )}
    >
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Analytics
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Overview
        </h2>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <DashboardChartCard
          title="Applications by status"
          subtitle="Current pipeline breakdown"
        >
          <ApplicationStatusChart apps={apps} />
        </DashboardChartCard>

        <DashboardChartCard
          title="Outcome distribution"
          subtitle="Approved, in progress, and rejected"
        >
          <OutcomeDistributionChart apps={apps} />
        </DashboardChartCard>

        <DashboardChartCard
          title="Submissions over time"
          subtitle="Last 6 months"
        >
          <SubmissionsTrendChart apps={apps} />
        </DashboardChartCard>
      </div>
    </section>
  );
}

export default DashboardAnalytics;
