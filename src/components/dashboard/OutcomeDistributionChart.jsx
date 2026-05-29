import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildOutcomeCounts } from "@/lib/dashboardAnalytics";

const chartConfig = {
  Approved: { label: "Approved", color: "#3f3f46" },
  "In progress": { label: "In progress", color: "#a1a1aa" },
  Rejected: { label: "Rejected", color: "#d4d4d8" },
};

export function OutcomeDistributionChart({ apps = [] }) {
  const data = buildOutcomeCounts(apps);

  if (!apps.length || data.length === 0) {
    return (
      <p className="flex h-[220px] items-center justify-center text-sm text-zinc-400">
        No outcome data yet
      </p>
    );
  }

  return (
    <div className="flex h-[220px] flex-col">
      <ChartContainer
        config={chartConfig}
        className="mx-auto min-h-0 flex-1 w-full max-w-[240px] [&_.recharts-responsive-container]:!h-full aspect-auto"
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent className="rounded-xl border-zinc-200 bg-white shadow-lg" />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={76}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            {entry.name} ({entry.value})
          </li>
        ))}
      </ul>
    </div>
  );
}
