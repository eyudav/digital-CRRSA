import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildStatusCounts } from "@/lib/dashboardAnalytics";

const chartConfig = {
  value: { label: "Applications", color: "#3f3f46" },
};

export function ApplicationStatusChart({ apps = [] }) {
  const data = buildStatusCounts(apps);

  if (!apps.length) {
    return (
      <p className="flex h-[220px] items-center justify-center text-sm text-zinc-400">
        No application data yet
      </p>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[220px] w-full [&_.recharts-responsive-container]:!h-full aspect-auto"
    >
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          stroke="#e4e4e7"
          className="dark:stroke-zinc-800"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
          interval={0}
          angle={-18}
          textAnchor="end"
          height={52}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          content={
            <ChartTooltipContent className="rounded-xl border-zinc-200 bg-white shadow-lg" />
          }
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
