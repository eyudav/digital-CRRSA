import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, FileCheck2, Users, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { ContentCard } from "@/components/ContentCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { apiJson } from "@/lib/api";
import { mapStaffSearchRow } from "@/lib/applicationMap";
import { complaintApiToUi } from "@/lib/statusMap";
const StaffDashboard = () => {
    const { user } = useAuth();
    const { data: searchRows = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ["staff", "applications", "search", "%"],
        queryFn: () => apiJson(`/api/records/search?q=${encodeURIComponent("%")}`),
        refetchOnWindowFocus: true,
    });
    const apps = searchRows.map(mapStaffSearchRow);
    const { data: complaintsRaw = [] } = useQuery({
        queryKey: ["complaints", "staff"],
        queryFn: () => apiJson("/api/complaints"),
    });
    const complaints = complaintsRaw.map((c) => ({
        ...c,
        statusUi: complaintApiToUi(c.status),
    }));
    const pending = apps.filter((a) =>
      ["submitted", "additional_documents_required", "approved"].includes(a.status)
    );
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = apps.filter((a) => a.appointment?.date === today).length;
    const approvedThisWeek = apps.filter((a) =>
        ["approved", "scheduled", "ready_for_collection"].includes(a.status)
    ).length;
    const kpis = [
        { label: "Awaiting review", value: pending.length, icon: ClipboardList, tone: "bg-warning/15 text-warning-foreground" },
        { label: "Today's appointments", value: todayCount, icon: Clock, tone: "bg-info/10 text-info" },
        { label: "Approved / ready", value: approvedThisWeek, icon: FileCheck2, tone: "bg-success/10 text-success" },
        { label: "Open complaints", value: complaints.filter((c) => c.statusUi !== "resolved").length, icon: Users, tone: "bg-accent/15 text-accent-foreground" },
    ];
    return (<>
      <PageHeader eyebrow={`Officer · ${user?.fullName.split(" ")[0]}`} title="Operations overview" description="Triage incoming applications, manage today's queue and respond to citizens quickly."/>

      {isLoading && <p className="text-sm text-muted-foreground">Loading overview…</p>}
      {isError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message || "Could not load applications."}{" "}
          <Button variant="outline" size="sm" className="ml-2 align-middle" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} toneClass={k.tone} />
        ))}
      </div>

      <div className="mt-6">
        <ContentCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Pending review</h2>
            <Link to="/staff/queue" className="text-sm font-medium text-primary hover:underline">Open queue <ArrowRight className="inline h-3.5 w-3.5"/></Link>
          </div>
        {pending.length === 0 ? (<p className="p-8 text-center text-sm text-muted-foreground">All caught up — no pending applications.</p>) : (<ul className="divide-y divide-border">
            {pending.slice(0, 6).map((a) => (<li key={a.id}>
                <Link to={`/staff/queue/${a.id}`} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/40">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{a.refNumber} · {a.citizenName}</p>
                  </div>
                  <p className="hidden text-xs text-muted-foreground md:block">Submitted {format(new Date(a.submittedAt), "MMM d")}</p>
                  <StatusBadge status={a.status}/>
                </Link>
              </li>))}
          </ul>)}
        </ContentCard>
      </div>
    </>);
};
export default StaffDashboard;
