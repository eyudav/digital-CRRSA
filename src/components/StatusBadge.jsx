import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
const LABELS = {
    submitted: "Submitted",
    under_review: "Under review",
    additional_documents_required: "Docs required",
    approved: "Approved",
    rejected: "Rejected",
    ready_for_collection: "Ready for collection",
    completed: "Completed",
};
const STYLES = {
    submitted: "bg-info/10 text-info border-info/20",
    under_review: "bg-accent/15 text-accent-foreground border-accent/30",
    additional_documents_required: "bg-warning/15 text-warning-foreground border-warning/30",
    approved: "bg-success/15 text-success border-success/30",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
    ready_for_collection: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-muted text-muted-foreground border-border",
};
export function StatusBadge({ status, className }) {
    const label = LABELS[status] || String(status || "").replace(/_/g, " ");
    const style = STYLES[status] || "bg-muted text-muted-foreground border-border";
    return (<Badge variant="outline" className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", style, className)}>
      {label}
    </Badge>);
}
export const STATUS_LABELS = LABELS;
