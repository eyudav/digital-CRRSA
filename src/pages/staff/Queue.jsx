import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, STATUS_LABELS } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { FilterBar } from "@/components/FilterBar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiJson } from "@/lib/api";
import { mapStaffSearchRow } from "@/lib/applicationMap";
const Queue = () => {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("pending");
  const searchQ = q.trim() || "%";
  const {
    data: searchRows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["staff", "applications", "search", searchQ],
    queryFn: () =>
      apiJson(`/api/records/search?q=${encodeURIComponent(searchQ)}`),
    refetchOnWindowFocus: true,
  });
  const apps = searchRows.map(mapStaffSearchRow);
  const filtered = apps.filter((a) => {
    const matchesQ =
      a.serviceName.toLowerCase().includes(q.toLowerCase()) ||
      a.refNumber.toLowerCase().includes(q.toLowerCase()) ||
      a.citizenName.toLowerCase().includes(q.toLowerCase());
    if (filter === "all") return matchesQ;
    if (filter === "pending")
      return (
        matchesQ &&
        ["submitted", "additional_documents_required", "approved"].includes(
          a.status,
        )
      );
    return matchesQ && a.status === filter;
  });
  return (
    <>
      <PageHeader
        title="Review queue"
        description="Open an application to verify documents and take action."
      />

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading queue…</p>
      )}
      {isError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message || "Could not load applications."}{" "}
          <Button
            variant="outline"
            size="sm"
            className="ml-2 align-middle"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search ref, citizen, or service..."
        />
        <FilterBar
          options={[
            { id: "pending", label: "Pending" },
            { id: "all", label: "All" },
            ...Object.entries(STATUS_LABELS).map(([id, label]) => ({
              id,
              label,
            })),
          ]}
          currentFilter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <DataTable
        columns={[
          {
            header: "Reference",
            cell: (row) => (
              <span className="font-mono text-xs">{row.refNumber}</span>
            ),
          },
          {
            header: "Service",
            cell: (row) => (
              <span className="font-medium text-foreground">
                {row.serviceName}
              </span>
            ),
          },
          {
            header: "Citizen",
            cell: (row) => <span>{row.citizenName}</span>,
          },
          {
            header: "Submitted",
            cell: (row) => (
              <span className="text-muted-foreground">
                {format(new Date(row.submittedAt), "MMM d, yyyy")}
              </span>
            ),
            headerClassName: "hidden md:table-cell",
            cellClassName: "hidden md:table-cell",
          },
          {
            header: "Status",
            cell: (row) => <StatusBadge status={row.status} />,
          },
          {
            header: "",
            cell: (row) => (
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link to={`/staff/queue/${row.id}`}>Review</Link>
              </Button>
            ),
            cellClassName: "text-right",
          },
        ]}
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        error={error}
        emptyMessage={
          <div className="p-10 text-center text-sm text-muted-foreground">
            No applications match.
          </div>
        }
        onRowClick={(row) => (window.location.href = `/staff/queue/${row.id}`)}
      />
    </>
  );
};
export default Queue;
