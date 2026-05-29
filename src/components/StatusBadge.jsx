import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
const LABELS = {
  submitted: "Submitted",
  additional_documents_required: "Docs required",
  approved: "Approved",
  scheduled: "Scheduled",
  rejected: "Rejected",
  ready_for_collection: "Ready for collection",
};
const STYLES = {
  submitted: "bg-info/10 text-info border-info/20",
  additional_documents_required:
    "bg-amber-500/15 text-amber-900 border-amber-500/35 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/40",
  approved: "bg-success/15 text-success border-success/30",
  scheduled: "bg-primary/15 text-primary border-primary/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  ready_for_collection: "bg-primary/10 text-primary border-primary/20",
};
export function StatusBadge({ status, className }) {
  const label = LABELS[status] || String(status || "").replace(/_/g, " ");
  const style =
    STYLES[status] || "bg-muted text-muted-foreground border-border";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1.5",
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </Badge>
  );
}
export const STATUS_LABELS = LABELS;
