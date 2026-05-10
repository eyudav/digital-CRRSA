import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/AppShell";
import { CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "./CitizenDashboard";
import { apiJson } from "@/lib/api";
import { mapApplicationListRow } from "@/lib/applicationMap";
const Appointments = () => {
    const { user } = useAuth();
    const { data: apps = [] } = useQuery({
        queryKey: ["applications", "my", user?.id],
        queryFn: async () => {
            const rows = await apiJson("/api/applications/my");
            return rows.map((r) => mapApplicationListRow(r));
        },
        enabled: !!user?.id,
    });
    const withAppt = apps.filter((a) => a.appointment);
    return (<>
      <PageHeader title="Appointments" description="Your scheduled office visits linked to submitted applications."/>
      {withAppt.length === 0 ? (<EmptyState title="No appointments yet" description="When you submit an application and book a slot, it will appear here."/>) : (<div className="grid gap-4 md:grid-cols-2">
          {withAppt.map((a) => (<div key={a.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{a.serviceName}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{a.appointment.office}</h3>
                </div>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium">#{a.appointment.queueNumber}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <CalendarCheck className="h-4 w-4 text-primary"/>
                {format(new Date(a.appointment.date), "EEEE, MMMM d")} · {a.appointment.timeSlot}
              </div>
            </div>))}
        </div>)}
    </>);
};
export default Appointments;
