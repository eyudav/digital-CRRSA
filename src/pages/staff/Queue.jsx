import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { apiJson } from "@/lib/api";
import { mapStaffSearchRow } from "@/lib/applicationMap";
const Queue = () => {
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("pending");
    const searchQ = q.trim() || "%";
    const { data: searchRows = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ["staff", "applications", "search", searchQ],
        queryFn: () => apiJson(`/api/records/search?q=${encodeURIComponent(searchQ)}`),
        refetchOnWindowFocus: true,
    });
    const apps = searchRows.map(mapStaffSearchRow);
    const filtered = apps.filter((a) => {
        const matchesQ = a.serviceName.toLowerCase().includes(q.toLowerCase()) || a.refNumber.toLowerCase().includes(q.toLowerCase()) || a.citizenName.toLowerCase().includes(q.toLowerCase());
        if (filter === "all")
            return matchesQ;
        if (filter === "pending")
            return matchesQ && ["submitted", "under_review", "additional_documents_required", "approved"].includes(a.status);
        return matchesQ && a.status === filter;
    });
    return (<>
      <PageHeader title="Review queue" description="Open an application to verify documents and take action."/>

      {isLoading && <p className="text-sm text-muted-foreground">Loading queue…</p>}
      {isError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message || "Could not load applications."}{" "}
          <Button variant="outline" size="sm" className="ml-2 align-middle" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, citizen, or service..." className="pl-9"/>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={filter === "pending" ? "default" : "outline"} className={filter === "pending" ? "bg-primary text-primary-foreground" : ""} onClick={() => setFilter("pending")}>Pending</Button>
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} className={filter === "all" ? "bg-primary text-primary-foreground" : ""} onClick={() => setFilter("all")}>All</Button>
          {Object.entries(STATUS_LABELS).map(([id, label]) => (<Button key={id} size="sm" variant={filter === id ? "default" : "outline"} className={filter === id ? "bg-primary text-primary-foreground" : ""} onClick={() => setFilter(id)}>{label}</Button>))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Reference</th>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Citizen</th>
              <th className="hidden px-4 py-3 text-left md:table-cell">Submitted</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!isLoading && filtered.length === 0 && (<tr><td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">No applications match.</td></tr>)}
            {filtered.map((a) => (<tr key={a.id} className="transition-colors hover:bg-secondary/30">
                <td className="px-4 py-3 font-mono text-xs">{a.refNumber}</td>
                <td className="px-4 py-3 font-medium">{a.serviceName}</td>
                <td className="px-4 py-3">{a.citizenName}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{format(new Date(a.submittedAt), "MMM d, yyyy")}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status}/></td>
                <td className="px-4 py-3 text-right">
                  <Button asChild size="sm" variant="outline"><Link to={`/staff/queue/${a.id}`}>Review</Link></Button>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </>);
};
export default Queue;
