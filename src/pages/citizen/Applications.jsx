import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./CitizenDashboard";
import { apiJson } from "@/lib/api";
import { mapApplicationListRow } from "@/lib/applicationMap";
const Applications = () => {
    const { user } = useAuth();
    const { data: apps = [] } = useQuery({
        queryKey: ["applications", "my", user?.id],
        queryFn: async () => {
            const rows = await apiJson("/api/applications/my");
            return rows.map((r) => mapApplicationListRow(r));
        },
        enabled: !!user?.id,
    });
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const filtered = apps.filter((a) => (filter === "all" || a.status === filter) &&
        (a.serviceName.toLowerCase().includes(q.toLowerCase()) || a.refNumber.toLowerCase().includes(q.toLowerCase())));
    return (<>
      <PageHeader title="My applications" description="Every application you've submitted, with its current status."/>

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by service or reference..." className="pl-9"/>
        </div>
        <div className="flex flex-wrap gap-2">
          {[["all", "All"], ...Object.entries(STATUS_LABELS)].map(([id, label]) => (<Button key={id} size="sm" variant={filter === id ? "default" : "outline"} className={filter === id ? "bg-primary text-primary-foreground" : ""} onClick={() => setFilter(id)}>{label}</Button>))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        {filtered.length === 0 ? (<EmptyState title="No applications match" description="Try clearing filters or starting a new application." cta={<Button asChild><Link to="/citizen/services">Browse services</Link></Button>}/>) : (<ul className="divide-y divide-border">
            {filtered.map((a) => (<li key={a.id}>
                <Link to={`/citizen/applications/${a.id}`} className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/40">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold">{a.serviceName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.refNumber} · Submitted {format(new Date(a.submittedAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground md:block">
                    <p>Updated</p>
                    <p>{format(new Date(a.updatedAt), "MMM d")}</p>
                  </div>
                  <StatusBadge status={a.status}/>
                </Link>
              </li>))}
          </ul>)}
      </div>
    </>);
};
export default Applications;
