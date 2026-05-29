import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiJson } from "@/lib/api";
import { complaintApiToUi, complaintUiToApi } from "@/lib/statusMap";
const TONE = {
    pending:
      "bg-amber-500/15 text-amber-900 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/40",
    in_progress:
      "bg-sky-500/15 text-sky-900 border border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-400/40",
    resolved:
      "bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/40",
};
const StaffComplaints = () => {
    const qc = useQueryClient();
    const [responses, setResponses] = useState({});
    const { data: rows = [] } = useQuery({
        queryKey: ["complaints", "staff"],
        queryFn: () => apiJson("/api/complaints"),
    });
    const list = rows.map((c) => ({
        id: String(c.id),
        citizenName: c.citizen_name || "",
        subject: c.category,
        message: c.message,
        status: complaintApiToUi(c.status),
        response: c.resolution_comment,
        createdAt: c.created_at,
    }));
    const patchMutation = useMutation({
        mutationFn: ({ id, statusUi, resolutionComment }) =>
            apiJson(`/api/complaints/${id}/status`, {
                method: "PATCH",
                body: {
                    status: complaintUiToApi(statusUi),
                    resolutionComment: resolutionComment || undefined,
                },
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["complaints", "staff"] });
            qc.invalidateQueries({ queryKey: ["complaints", "my"] });
            toast({ title: "Complaint updated" });
        },
        onError: (e) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });
    const respond = (id, statusUi) => {
        const resolutionComment = responses[id];
        patchMutation.mutate({ id, statusUi, resolutionComment });
    };
    return (<>
      <PageHeader title="Complaints" description="Respond to citizen feedback and track resolution status."/>
      <div className="space-y-4">
        {list.length === 0 ? <p className="text-sm text-muted-foreground">No complaints yet.</p> : list.map((c) => (<article key={c.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-elegant">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold">{c.subject}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{c.citizenName} · {format(new Date(c.createdAt), "MMM d, yyyy")}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ${TONE[c.status]}`}>{c.status.replace("_", " ")}</span>
            </div>
            <p className="mt-4 text-sm text-foreground/90">{c.message}</p>
            {c.response && <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-sm shadow-inner"><span className="font-semibold text-foreground mb-1 block">Response:</span> <span className="text-muted-foreground">{c.response}</span></div>}
            {c.status !== "resolved" && (<div className="mt-5 space-y-3 pt-3 border-t border-border">
                <Textarea rows={3} placeholder="Write a response to the citizen..." value={responses[c.id] || ""} onChange={(e) => setResponses({ ...responses, [c.id]: e.target.value })}/>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => respond(c.id, "in_progress")} disabled={patchMutation.isPending}>Mark in progress</Button>
                  <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => respond(c.id, "resolved")} disabled={patchMutation.isPending}>Resolve</Button>
                </div>
              </div>)}
          </article>))}
      </div>
    </>);
};
export default StaffComplaints;
