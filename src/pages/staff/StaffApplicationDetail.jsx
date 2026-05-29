import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, FileText, MessageSquare, ScrollText, ShieldX, Upload, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ContentCard } from "@/components/ContentCard";
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

    // document verification mutation removed; verification actions removed from UI

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

    // verify handler removed

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
          <ContentCard title="Submitted details" icon={FileText}>
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
          </ContentCard>

          {app.formData.appointmentMetadata && (
            <ContentCard title="Appointment Confirmations" icon={UserCheck}>
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
            </ContentCard>
          )}

          <ContentCard title="Documents" icon={Upload}>
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
                    </div>
                  </li>))}
              </ul>)}
          </ContentCard>

          <ContentCard title="Add comment / request documents" icon={MessageSquare}>
            <Textarea rows={3} placeholder="Write a note to the citizen or an internal review comment..." value={comment} onChange={(e) => setComment(e.target.value)}/>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={addComment} disabled={patchStatus.isPending}>Add comment</Button>
              <Button onClick={requestDocs} className="bg-warning text-warning-foreground hover:bg-warning/90" disabled={patchStatus.isPending}>Request more documents</Button>
            </div>
          </ContentCard>

          <ContentCard title="Status timeline" icon={ScrollText}>
            <ol className="relative ml-3 space-y-5 border-l border-border pl-6">
              {app.timeline.map((t) => (<li key={t.id} className="relative">
                  <span className="absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">●</span>
                  <p className="text-sm font-medium">{t.message}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.at), "MMM d, yyyy · HH:mm")} · {t.by}</p>
                </li>))}
            </ol>
          </ContentCard>
        </div>

        <div className="space-y-5">
          <ContentCard title="Decision" icon={Check}>
            <p className="text-sm text-muted-foreground">Mark this application's outcome. Citizens are notified automatically.</p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => setStatus("approved", "Application approved.")} className="bg-success text-success-foreground hover:bg-success/90" disabled={patchStatus.isPending}>Approve</Button>
              <Button onClick={issueCertificate} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={patchStatus.isPending}>Issue & mark ready</Button>
              <Button onClick={() => setStatus("rejected", "Application rejected.")} variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" disabled={patchStatus.isPending}>
                <ShieldX className="mr-1 h-4 w-4"/> Reject
              </Button>
            </div>
          </ContentCard>
          {app.appointment && (<ContentCard title="Appointment" icon={ScrollText}>
              <p className="font-display text-base font-semibold">{app.appointment.office}</p>
              <p className="mt-1 text-sm text-muted-foreground">{format(new Date(app.appointment.date), "EEEE, MMMM d")} · {app.appointment.timeSlot}</p>
              <p className="mt-2 text-xs text-muted-foreground">Queue #{app.appointment.queueNumber}</p>
            </ContentCard>)}
        </div>
      </div>
    </>);
};

export default StaffApplicationDetail;
