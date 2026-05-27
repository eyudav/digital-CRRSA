import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingSkeleton } from "./LoadingSkeleton";

export function DataTable({ 
  columns, 
  data, 
  isLoading, 
  isError, 
  error, 
  emptyMessage = "No results found.",
  onRowClick
}) {
  if (isLoading) {
    return (
      <div className="p-4 bg-card rounded-2xl border border-border shadow-soft">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive shadow-soft">
        {error?.message || "Failed to load data."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow className="hover:bg-transparent">
            {columns.map((col, i) => (
              <TableHead key={i} className={`text-xs uppercase tracking-wider text-muted-foreground ${col.className || ""}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border">
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow 
                key={row.id || rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-secondary/40" : "hover:bg-secondary/20"}`}
              >
                {columns.map((col, colIndex) => (
                  <TableCell key={colIndex} className={col.cellClassName || ""}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
