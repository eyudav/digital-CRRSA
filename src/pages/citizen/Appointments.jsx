import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/AppShell";
import { CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "./CitizenDashboard";
import { apiJson } from "@/lib/api";
import { mapApplicationListRow } from "@/lib/applicationMap";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

const Appointments = () => {
    const { user } = useAuth();
    const { data: apps = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ["applications", "my", user?.id],
        queryFn: async () => {
            const rows = await apiJson("/api/applications/my");
            return rows.map((r) => mapApplicationListRow(r));
        },
        enabled: !!user?.id,
        refetchOnWindowFocus: true,
    });
    const withAppt = apps.filter((a) => a.appointment);
    const approvedAwaiting = apps.filter((a) => a.status === "approved" && !a.appointment);

    return (<>
      <PageHeader title="Appointments" description="Office visits linked to your applications: date, time window, and queue number after staff approval."/>

      {isLoading && <p className="text-sm text-muted-foreground">Loading appointments…</p>}
      {isError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message || "Could not load your applications."}{" "}
          <Button variant="outline" size="sm" className="ml-2 align-middle" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {approvedAwaiting.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="font-display text-sm font-semibold text-amber-900 dark:text-amber-100">Scheduling in progress</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {approvedAwaiting.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/80 px-3 py-2">
                <span className="font-medium">{a.serviceName}</span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Your application was approved. An appointment slot will appear here as soon as it is assigned (or if no public slots are available, staff will follow up).
          </p>
        </div>
      )}

      {withAppt.length === 0 && approvedAwaiting.length === 0 && !isLoading && !isError ? (
        <EmptyState
          title="No appointments yet"
          description="When staff approves your application, your visit date and queue number appear here. If you chose a slot when applying, it will stay linked after approval."
        />
      ) : withAppt.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {withAppt.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{a.serviceName}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{a.appointment.office}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{a.refNumber}</p>
                </div>
                <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium">
                  #{a.appointment.queueNumber}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {format(new Date(a.appointment.date), "EEEE, MMMM d")} · {a.appointment.timeSlot}
                </span>
              </div>
              <Link
                to={`/citizen/applications/${a.id}`}
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                View application
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </>);
};
export default Appointments;
