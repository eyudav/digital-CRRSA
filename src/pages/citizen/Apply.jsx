import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, FileUp, CalendarCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SERVICES, OFFICES } from "@/data/seed";
import { uid } from "@/data/store";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/api";
import { slotLabel } from "@/lib/applicationMap";

const detailsSchema = z.record(z.string().trim().min(1, "Required").max(500));

const Apply = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const qc = useQueryClient();
    const service = useMemo(() => SERVICES.find((s) => s.slug === slug), [slug]);

    const { data: formTemplate } = useQuery({
        queryKey: ["form-template", slug],
        queryFn: () => apiJson(`/api/form-templates/${slug}`),
        enabled: !!slug,
    });
    const fields = formTemplate?.fields ?? [];

    const [step, setStep] = useState(0);
    const [details, setDetails] = useState({});
    const [errors, setErrors] = useState({});
    /** @type {{ id: string, file: File, name: string, sizeKb: number, type: string }[]} */
    const [docs, setDocs] = useState([]);
    const [office, setOffice] = useState(OFFICES[0]);
    const [date, setDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
    const [slotId, setSlotId] = useState(null);

    const { data: slotRows = [] } = useQuery({
        queryKey: ["appointment-slots", office, date],
        queryFn: () =>
            apiJson(`/api/appointments/available?officeCode=${encodeURIComponent(office)}&date=${date}`),
        enabled: !!office && !!date && step >= 2,
    });

    useEffect(() => {
        if (!slotRows.length) {
            setSlotId(null);
            return;
        }
        setSlotId((prev) => {
            if (prev && slotRows.some((s) => Number(s.id) === Number(prev)))
                return prev;
            return slotRows[0].id;
        });
    }, [slotRows]);

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!service)
                throw new Error("Service not found.");
            const parsed = detailsSchema.safeParse(details);
            if (!parsed.success)
                throw new Error("Please complete all required fields.");
            const created = await apiJson("/api/applications", {
                method: "POST",
                body: {
                    serviceType: service.name,
                    officeCode: office,
                    formData: parsed.data,
                },
            });
            const appId = created.id;
            if (docs.length) {
                const fd = new FormData();
                docs.forEach((d) => fd.append("documents", d.file));
                await apiJson(`/api/applications/${appId}/documents`, { method: "POST", body: fd });
            }
            if (!slotId)
                throw new Error("Choose an available time slot.");
            await apiJson("/api/appointments", {
                method: "POST",
                body: {
                    applicationId: Number(appId),
                    slotId: Number(slotId),
                    officeCode: office,
                },
            });
            return appId;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["applications", "my", user?.id] });
            qc.invalidateQueries({ queryKey: ["staff", "applications"] });
            toast({ title: "Application submitted successfully." });
            navigate("/citizen/applications");
        },
        onError: (e) => toast({ title: "Submission failed", description: e.message, variant: "destructive" }),
    });

    const steps = ["Service details", "Upload documents", "Appointment", "Review & submit"];
    const validateDetails = () => {
        const empties = {};
        fields.forEach((f) => {
            if (!(details[f.name] || "").trim())
                empties[f.name] = "Required";
        });
        setErrors(empties);
        return Object.keys(empties).length === 0;
    };
    const onFiles = (files) => {
        if (!files)
            return;
        const next = [];
        Array.from(files).forEach((f) => {
            if (f.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: `${f.name} exceeds 5 MB.`, variant: "destructive" });
                return;
            }
            const allowed = ["image/jpeg", "image/png", "application/pdf"];
            if (!allowed.includes(f.type)) {
                toast({ title: "Unsupported type", description: `${f.name} must be JPG, PNG or PDF.`, variant: "destructive" });
                return;
            }
            next.push({
                id: uid("doc"),
                file: f,
                name: f.name,
                sizeKb: Math.round(f.size / 1024),
                type: f.type,
            });
        });
        setDocs((d) => [...d, ...next]);
    };

    const onSubmit = () => { submitMutation.mutate(); };
    const next = () => {
        if (step === 0 && !validateDetails())
            return;
        if (step === 2 && (!slotRows.length || !slotId)) {
            toast({ title: "No slots available", description: "Pick another office or date.", variant: "destructive" });
            return;
        }
        setStep((s) => Math.min(3, s + 1));
    };
    const selectedSlot = slotRows.find((s) => Number(s.id) === Number(slotId));
    const slotDisplay = selectedSlot ? slotLabel(selectedSlot) : "—";

    if (!service)
        return <p>Service not found. <Link to="/citizen/services" className="text-primary underline">Back to services</Link></p>;

    return (<>
      <PageHeader eyebrow={service.category} title={`Apply: ${service.name}`} description={service.description}/>

      <ol className="mb-8 flex flex-wrap gap-3">
        {steps.map((label, i) => (<li key={label} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium", i < step ? "border-success/40 bg-success/10 text-success" : i === step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-background/20 text-[10px]">{i < step ? <Check className="h-3 w-3"/> : i + 1}</span>
            {label}
          </li>))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
        {step === 0 && (<div className="grid gap-5 md:grid-cols-2">
            {fields.map((f) => (<div key={f.name} className={cn("space-y-1.5", f.type === "textarea" && "md:col-span-2")}>
                <Label htmlFor={f.name}>{f.label}</Label>
                {f.type === "textarea" ? (<Textarea id={f.name} value={details[f.name] || ""} onChange={(e) => setDetails({ ...details, [f.name]: e.target.value })} rows={3}/>) : (<Input id={f.name} type={f.type === "date" ? "date" : "text"} value={details[f.name] || ""} onChange={(e) => setDetails({ ...details, [f.name]: e.target.value })}/>)}
                {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
              </div>))}
          </div>)}

        {step === 1 && (<div>
            <h3 className="font-display text-lg font-semibold">Upload supporting documents</h3>
            <p className="mt-1 text-sm text-muted-foreground">Required: {service.requiredDocuments.join(", ")}. JPG, PNG or PDF. Max 5 MB each.</p>
            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-secondary/50">
              <FileUp className="h-6 w-6 text-primary"/>
              <p className="mt-2 font-medium">Click to upload or drag and drop</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Multiple files supported</p>
              <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => onFiles(e.target.files)}/>
            </label>
            {docs.length > 0 && (<ul className="mt-5 divide-y divide-border rounded-xl border border-border">
                {docs.map((d) => (<li key={d.id} className="flex items-center justify-between p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.sizeKb} KB · {d.type.split("/")[1].toUpperCase()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setDocs((arr) => arr.filter((x) => x.id !== d.id))}><Trash2 className="h-4 w-4"/></Button>
                  </li>))}
              </ul>)}
          </div>)}

        {step === 2 && (<div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} min={format(addDays(new Date(), 1), "yyyy-MM-dd")} onChange={(e) => setDate(e.target.value)}/>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Time slot</Label>
              {!slotRows.length ? (<p className="text-sm text-muted-foreground">No openings for this office and date. Try another date.</p>) : (<Select value={slotId != null ? String(slotId) : ""} onValueChange={(v) => setSlotId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Select a slot"/></SelectTrigger>
                  <SelectContent>{slotRows.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{slotLabel(s)} ({s.available ?? "?"} places)</SelectItem>))}</SelectContent>
                </Select>)}
            </div>
            <div className="md:col-span-2 rounded-xl bg-secondary/40 p-4 text-sm">
              <CalendarCheck className="mr-2 inline h-4 w-4 text-primary"/>
              You'll receive a queue number once submitted.
            </div>
          </div>)}

        {step === 3 && (<div className="space-y-5">
            <ReviewBlock title="Service">
              <p>{service.name} · <span className="text-muted-foreground">{service.fee} ETB · ~{service.processingDays} days</span></p>
            </ReviewBlock>
            <ReviewBlock title="Details">
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                {fields.map((f) => (<div key={f.name}>
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</dt>
                    <dd className="font-medium">{details[f.name] || "—"}</dd>
                  </div>))}
              </dl>
            </ReviewBlock>
            <ReviewBlock title="Documents">
              {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> : (<ul className="text-sm">{docs.map((d) => <li key={d.id}>• {d.name}</li>)}</ul>)}
            </ReviewBlock>
            <ReviewBlock title="Appointment">
              <p>{office}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(date), "EEEE, MMMM d")} · {slotDisplay}</p>
            </ReviewBlock>
          </div>)}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4"/> Back
          </Button>
          {step < 3 ? (<Button onClick={next} className="bg-primary text-primary-foreground hover:bg-primary/90">Next <ArrowRight className="ml-1 h-4 w-4"/></Button>) : (<Button onClick={onSubmit} disabled={submitMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">Submit application</Button>)}
        </div>
      </div>
    </>);
};
function ReviewBlock({ title, children }) {
    return (<div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
    </div>);
}
export default Apply;
