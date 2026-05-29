import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildMonthlySubmissions } from "@/lib/dashboardAnalytics";

const chartConfig = {
  count: { label: "Submissions", color: "#27272a" },
};

export function SubmissionsTrendChart({ apps = [] }) {
  const gradientId = useId().replace(/:/g, "");
  const data = buildMonthlySubmissions(apps);

  if (!apps.length) {
    return (
      <p className="flex h-[220px] items-center justify-center text-sm text-zinc-400">
        No submission history yet
      </p>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[220px] w-full [&_.recharts-responsive-container]:!h-full aspect-auto"
    >
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f3f46" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3f3f46" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          stroke="#e4e4e7"
          className="dark:stroke-zinc-800"
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#71717a" }}
          allowDecimals={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent className="rounded-xl border-zinc-200 bg-white shadow-lg" />
          }
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#27272a"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: "#27272a", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#18181b" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
