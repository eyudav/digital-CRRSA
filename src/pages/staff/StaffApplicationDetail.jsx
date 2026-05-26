import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, FileText, MessageSquare, ScrollText, ShieldX, Upload, UserCheck, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiJson } from "@/lib/api";
import { mapApplicationDetail } from "@/lib/applicationMap";
import { uiStatusToApi } from "@/lib/statusMap";
const StaffApplicationDetail = () => {
    const { id } = useParams();
    const qc = useQueryClient();
    const [comment, setComment] = useState("");
    const { data: app, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["application", id],
        queryFn: async () => {
            const payload = await apiJson(`/api/applications/${id}`);
            return mapApplicationDetail(payload);
        },
        enabled: !!id,
    });

    const patchStatus = useMutation({
        mutationFn: ({ statusUi, message }) =>
            apiJson(`/api/staff/applications/${id}/status`, {
                method: "PATCH",
                body: {
                    status: uiStatusToApi(statusUi),
                    comment: message || undefined,
                },
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["application", id] });
            qc.invalidateQueries({ queryKey: ["staff", "applications"] });
            toast({ title: "Updated" });
        },
        onError: (e) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
    });

    const verifyMutation = useMutation({
        mutationFn: ({ docId, verified }) =>
            apiJson(`/api/staff/applications/${id}/documents/${docId}`, {
                method: "PATCH",
                body: { verified },
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["application", id] });
            qc.invalidateQueries({ queryKey: ["staff", "applications"] });
            toast({ title: "Document updated" });
        },
        onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    });

    if (isLoading)
        return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
    if (isError)
        return (<div className="p-8">
          <p className="text-sm text-destructive">{error?.message || "Could not load application."}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Retry</Button>
        </div>);
    if (!app)
        return null;

    const setStatus = (statusUi, message) => {
        patchStatus.mutate({ statusUi, message });
    };

    const verify = (docId, value) => {
        verifyMutation.mutate({ docId, verified: value });
    };

    const requestDocs = () => {
        if (!comment.trim())
            return toast({ title: "Add a comment first", variant: "destructive" });
        patchStatus.mutate({ statusUi: "additional_documents_required", message: comment }, {
            onSuccess: () => setComment(""),
        });
    };

    const addComment = () => {
        if (!comment.trim())
            return;
        patchStatus.mutate({ statusUi: app.status, message: comment }, {
            onSuccess: () => setComment(""),
        });
    };

    const issueCertificate = () => {
        setStatus("ready_for_collection", "Certificate issued and ready for collection.");
    };

    return (<>
      <Link to="/staff/queue" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4"/> Queue</Link>
      <PageHeader eyebrow={app.refNumber} title={`${app.serviceName} — ${app.citizenName}`} description={`Submitted ${format(new Date(app.submittedAt), "MMMM d, yyyy")}`} actions={<StatusBadge status={app.status} className="text-sm"/>}/>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Submitted details" icon={FileText}>
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              {Object.entries(app.formData).map(([k, v]) => {
                if (k === "appointmentMetadata") return null;
                if (typeof v === "object" && v !== null) {
                  return (
                    <div key={k} className="md:col-span-2 bg-secondary/15 p-3 rounded-xl border border-border/40 mt-1">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {k.replace(/([A-Z])/g, " $1").trim()}
                      </dt>
                      <dd className="font-medium">
                        <pre className="text-xs overflow-auto whitespace-pre-wrap font-sans">{JSON.stringify(v, null, 2)}</pre>
                      </dd>
                    </div>
                  );
                }
                const label = k.replace(/([A-Z])/g, " $1").trim();
                const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
                return (
                  <div key={k} className="border-b border-border/45 pb-2">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{displayLabel}</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{String(v)}</dd>
                  </div>
                );
              })}
            </dl>
          </Card>

          {app.formData.appointmentMetadata && (
            <Card title="Appointment Confirmations" icon={UserCheck}>
              <dl className="grid gap-4 text-sm md:grid-cols-2">
                {Object.entries(app.formData.appointmentMetadata).map(([k, v]) => {
                  if (v === null || v === "") return null;
                  const label = k.replace(/([A-Z])/g, " $1").trim();
                  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
                  const displayValue = typeof v === "boolean" ? (v ? "Yes / Confirmed" : "No") : String(v);
                  return (
                    <div key={k} className="border-b border-border/45 pb-2">
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{displayLabel}</dt>
                      <dd className="font-semibold text-foreground mt-0.5">{displayValue}</dd>
                    </div>
                  );
                })}
              </dl>
            </Card>
          )}

          <Card title="Documents" icon={Upload}>
            {app.documents.length === 0 ? <p className="text-sm text-muted-foreground">Citizen has not uploaded documents yet.</p> : (<ul className="divide-y divide-border">
                {app.documents.map((d) => (<li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <a href={d.url} target="_blank" rel="noreferrer" className="truncate font-medium text-primary hover:underline">{d.name}</a>
                      <p className="text-xs text-muted-foreground">{d.sizeKb} KB · uploaded {format(new Date(d.uploadedAt), "MMM d")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={d.url} target="_blank" rel="noreferrer">View</a>
                      </Button>
                      {d.downloadUrl && (<Button asChild size="sm" variant="ghost">
                          <a href={d.downloadUrl} target="_blank" rel="noreferrer">Download</a>
                        </Button>)}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${d.verified ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"}`}>{d.verified ? "Verified" : "Pending"}</span>
                      {d.verified ? (<Button size="sm" variant="ghost" onClick={() => verify(d.id, false)}><X className="h-4 w-4"/></Button>) : (<Button size="sm" variant="outline" onClick={() => verify(d.id, true)}><Check className="mr-1 h-4 w-4"/> Verify</Button>)}
                    </div>
                  </li>))}
              </ul>)}
          </Card>

          <Card title="Add comment / request documents" icon={MessageSquare}>
            <Textarea rows={3} placeholder="Write a note to the citizen or an internal review comment..." value={comment} onChange={(e) => setComment(e.target.value)}/>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={addComment} disabled={patchStatus.isPending}>Add comment</Button>
              <Button onClick={requestDocs} className="bg-warning text-warning-foreground hover:bg-warning/90" disabled={patchStatus.isPending}>Request more documents</Button>
            </div>
          </Card>

          <Card title="Status timeline" icon={ScrollText}>
            <ol className="relative ml-3 space-y-5 border-l border-border pl-6">
              {app.timeline.map((t) => (<li key={t.id} className="relative">
                  <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">●</span>
                  <p className="text-sm font-medium">{t.message}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.at), "MMM d, yyyy · HH:mm")} · {t.by}</p>
                </li>))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Decision" icon={Check}>
            <p className="text-sm text-muted-foreground">Mark this application's outcome. Citizens are notified automatically.</p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => setStatus("under_review", "Application is now under officer review.")} variant="outline" disabled={patchStatus.isPending}>Mark under review</Button>
              <Button onClick={() => setStatus("approved", "Application approved.")} className="bg-success text-success-foreground hover:bg-success/90" disabled={patchStatus.isPending}>Approve</Button>
              <Button onClick={issueCertificate} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={patchStatus.isPending}>Issue & mark ready</Button>
              <Button onClick={() => setStatus("rejected", "Application rejected.")} variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" disabled={patchStatus.isPending}>
                <ShieldX className="mr-1 h-4 w-4"/> Reject
              </Button>
            </div>
          </Card>
          {app.appointment && (<Card title="Appointment" icon={ScrollText}>
              <p className="font-display text-base font-semibold">{app.appointment.office}</p>
              <p className="mt-1 text-sm text-muted-foreground">{format(new Date(app.appointment.date), "EEEE, MMMM d")} · {app.appointment.timeSlot}</p>
              <p className="mt-2 text-xs text-muted-foreground">Queue #{app.appointment.queueNumber}</p>
            </Card>)}
        </div>
      </div>
    </>);
};
function Card({ title, icon: Icon, children }) {
    return (<div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary"/>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>);
}
export default StaffApplicationDetail;
