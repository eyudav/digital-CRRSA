import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, FileText, MessageSquare, ScrollText, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { ContentCard } from "@/components/ContentCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { apiJson } from "@/lib/api";
import { mapApplicationDetail } from "@/lib/applicationMap";
const ApplicationDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const qc = useQueryClient();
    const { data: app, isLoading, isError } = useQuery({
        queryKey: ["application", id],
        queryFn: async () => {
            const payload = await apiJson(`/api/applications/${id}`);
            return mapApplicationDetail(payload);
        },
        enabled: !!id,
    });
    const uploadMutation = useMutation({
        mutationFn: async (files) => {
            const fd = new FormData();
            Array.from(files).forEach((f) => fd.append("documents", f));
            return apiJson(`/api/applications/${id}/documents`, { method: "POST", body: fd });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["application", id] });
            qc.invalidateQueries({ queryKey: ["applications", "my"] });
            toast({ title: "Documents uploaded" });
        },
        onError: (e) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
    });
    if (isLoading || !app)
        return <p className="p-8">Loading…</p>;
    if (isError)
        return <p className="p-8">Application not found. <Link to="/citizen/applications" className="text-primary underline">Back</Link></p>;
    if (app.citizenId !== user.id)
        return <p className="p-8">You don't have access to this application.</p>;
    const onFiles = (files) => {
        if (!files?.length)
            return;
        for (const f of Array.from(files)) {
            if (f.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", variant: "destructive" });
                return;
            }
        }
        uploadMutation.mutate(files);
    };
    return (<>
      <Link to="/citizen/applications" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4"/> All applications</Link>
      <PageHeader eyebrow={app.refNumber} title={app.serviceName} description={`Submitted ${format(new Date(app.submittedAt), "MMMM d, yyyy")}`} actions={<StatusBadge status={app.status} className="text-sm"/>}/>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <ContentCard title="Submitted details" icon={FileText}>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              {Object.entries(app.formData).map(([k, v]) => (<div key={k}>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</dt>
                  <dd className="font-medium">{String(v)}</dd>
                </div>))}
            </dl>
          </ContentCard>

          <ContentCard title="Documents" icon={Upload}>
            {app.documents.length === 0 ? <p className="text-sm text-muted-foreground">No documents yet.</p> : (<ul className="divide-y divide-border">
                {app.documents.map((d) => (<li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.sizeKb} KB · uploaded {format(new Date(d.uploadedAt), "MMM d")}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${d.verified ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"}`}>{d.verified ? "Verified" : "Pending"}</span>
                  </li>))}
              </ul>)}
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5">
              <Upload className="h-4 w-4"/> Upload more
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} accept=".jpg,.jpeg,.png,.pdf" disabled={uploadMutation.isPending}/>
            </label>
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
          {app.appointment && (<ContentCard title="Appointment" icon={CalendarCheck}>
              <p className="font-display text-base font-semibold">{app.appointment.office}</p>
              <p className="mt-1 text-sm text-muted-foreground">{format(new Date(app.appointment.date), "EEEE, MMMM d")} · {app.appointment.timeSlot}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium">Queue #{app.appointment.queueNumber}</div>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link to="/citizen/appointments">Reschedule</Link>
              </Button>
            </ContentCard>)}
          <ContentCard title="Fee" icon={MessageSquare}>
            <p className="font-display text-2xl font-semibold">{app.fee} <span className="text-base font-normal text-muted-foreground">ETB</span></p>
            <p className="mt-1 text-xs text-muted-foreground">Payable at the office on collection.</p>
          </ContentCard>
        </div>
      </div>
    </>);
};

export default ApplicationDetail;
