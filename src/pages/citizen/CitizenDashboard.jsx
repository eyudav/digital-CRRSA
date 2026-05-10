import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, FileText, ScrollText, Sparkles, Calendar, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiJson } from "@/lib/api";
import { mapApplicationListRow } from "@/lib/applicationMap";
const CitizenDashboard = () => {
    const { user } = useAuth();
    const { data: myApps = [] } = useQuery({
        queryKey: ["applications", "my", user?.id],
        queryFn: async () => {
            const rows = await apiJson("/api/applications/my");
            return rows.map((r) => mapApplicationListRow(r));
        },
        enabled: !!user?.id,
    });
    const { data: announcements = [] } = useQuery({
        queryKey: ["announcements"],
        queryFn: () => apiJson("/api/announcements"),
    });
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications", "my", user?.id],
        queryFn: () => apiJson("/api/notifications/my"),
        enabled: !!user?.id,
    });
    const ann = announcements.map((a) => ({
        id: String(a.id),
        title: a.title,
        body: a.body,
        category: a.category || "general",
        createdAt: a.created_at,
        author: "CRRSA",
    }));
    const readIds = (() => {
        try {
            return new Set(JSON.parse(localStorage.getItem("crrsa-notif-read") || "[]"));
        }
        catch {
            return new Set();
        }
    })();
    const notifs = notifications.map((n) => ({
        id: String(n.id),
        read: readIds.has(String(n.id)),
    }));
    const unread = notifs.filter((n) => !n.read).length;
    const certs = myApps.filter((a) => a.status === "ready_for_collection").map((a) => ({
        id: `cert-${a.id}`,
        applicationId: a.id,
        certificateType: a.serviceName,
        citizenName: user?.fullName || "",
        issuedDate: a.updatedAt,
        serial: `CRC-${a.refNumber.split("-").pop()}`,
    }));
    const inProgress = myApps.filter((a) => !["completed", "rejected"].includes(a.status)).length;
    const ready = myApps.filter((a) => a.status === "ready_for_collection").length;
    const upcoming = myApps.filter((a) => a.appointment).slice(0, 1)[0];
    const kpis = [
        { label: "In progress", value: inProgress, icon: FileText, tone: "bg-info/10 text-info" },
        { label: "Ready to collect", value: ready, icon: CheckCircle2, tone: "bg-success/10 text-success" },
        { label: "Certificates issued", value: certs.length, icon: ScrollText, tone: "bg-accent/15 text-accent-foreground" },
        { label: "Unread alerts", value: unread, icon: Bell, tone: "bg-primary/10 text-primary" },
    ];
    return (<>
      <PageHeader eyebrow={`Hello, ${user?.fullName.split(" ")[0]}`} title="Your civil services at a glance" description="Track applications, manage appointments and stay in the loop on every notification." actions={<Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/citizen/services"><Sparkles className="mr-1.5 h-4 w-4"/> Start a new application</Link>
          </Button>}/>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (<div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{k.label}</p>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${k.tone}`}><k.icon className="h-4 w-4"/></span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold">{k.value}</p>
          </div>))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent applications</h2>
            <Link to="/citizen/applications" className="text-sm font-medium text-primary hover:underline">View all <ArrowRight className="inline h-3.5 w-3.5"/></Link>
          </div>
          {myApps.length === 0 ? (<EmptyState title="No applications yet" description="Start your first application to see real-time status updates here." cta={<Button asChild><Link to="/citizen/services">Browse services</Link></Button>}/>) : (<ul className="mt-4 divide-y divide-border">
              {myApps.slice(0, 5).map((a) => (<li key={a.id}>
                  <Link to={`/citizen/applications/${a.id}`} className="flex items-center justify-between py-3 transition-colors hover:bg-secondary/40 -mx-3 px-3 rounded-lg">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.serviceName}</p>
                      <p className="text-xs text-muted-foreground">{a.refNumber} · Updated {format(new Date(a.updatedAt), "MMM d")}</p>
                    </div>
                    <StatusBadge status={a.status}/>
                  </Link>
                </li>))}
            </ul>)}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Next appointment</h2>
            {upcoming?.appointment ? (<div className="mt-3">
                <p className="font-display text-base font-semibold">{upcoming.appointment.office}</p>
                <p className="mt-1 text-sm text-muted-foreground">{format(new Date(upcoming.appointment.date), "EEEE, MMMM d")} · {upcoming.appointment.timeSlot}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  <Calendar className="h-3.5 w-3.5"/> Queue #{upcoming.appointment.queueNumber}
                </div>
              </div>) : (<p className="mt-3 text-sm text-muted-foreground">No appointments scheduled.</p>)}
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Latest announcement</h2>
            {ann[0] ? (<div className="mt-3">
                <p className="font-medium">{ann[0].title}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{ann[0].body}</p>
                <Link to="/citizen/announcements" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Read more</Link>
              </div>) : (<p className="mt-3 text-sm text-muted-foreground">No announcements yet.</p>)}
          </div>
        </div>
      </div>
    </>);
};
export function EmptyState({ title, description, cta }) {
    return (<div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-secondary/30 p-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>);
}
export default CitizenDashboard;
