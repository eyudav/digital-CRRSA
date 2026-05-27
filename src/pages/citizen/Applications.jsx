import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { FilterBar } from "@/components/FilterBar";
import { DataTable } from "@/components/DataTable";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { apiJson } from "@/lib/api";
import { mapApplicationListRow } from "@/lib/applicationMap";
const Applications = () => {
    const { user } = useAuth();
    const { data: apps = [], isLoading, isError, error } = useQuery({
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
        <SearchInput value={q} onChange={setQ} placeholder="Search by service or reference..." />
        <FilterBar 
          options={[["all", "All"], ...Object.entries(STATUS_LABELS)].map(([id, label]) => ({id, label}))}
          currentFilter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <DataTable 
        columns={[
          {
            header: "Application",
            cell: (row) => (
              <div className="min-w-0 flex-1 py-1">
                <p className="font-display text-base font-semibold text-foreground">{row.serviceName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{row.refNumber}</p>
              </div>
            )
          },
          {
            header: "Submitted",
            cell: (row) => <span className="text-sm text-muted-foreground">{format(new Date(row.submittedAt), "MMM d, yyyy")}</span>
          },
          {
            header: "Last updated",
            cell: (row) => <span className="text-sm text-muted-foreground">{format(new Date(row.updatedAt), "MMM d, yyyy")}</span>
          },
          {
            header: "Status",
            cell: (row) => <div className="text-right"><StatusBadge status={row.status} /></div>,
            cellClassName: "text-right"
          }
        ]}
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        error={error}
        emptyMessage={
          <EmptyState 
            title="No applications match" 
            description="Try clearing filters or starting a new application." 
            action={<Button asChild><Link to="/citizen/services">Browse services</Link></Button>}
          />
        }
        onRowClick={(row) => window.location.href = `/citizen/applications/${row.id}`}
      />
    </>);
};
export default Applications;
