import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({ label, value, icon: Icon, toneClass }) {
  return (
    <Card className="rounded-2xl border-border shadow-soft overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
