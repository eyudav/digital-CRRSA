import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { apiJson } from "@/lib/api";
import { complaintApiToUi } from "@/lib/statusMap";
const schema = z.object({
    subject: z.string().trim().min(3, "At least 3 characters").max(120),
    message: z.string().trim().min(10, "Tell us more").max(1000),
});
const TONE = {
    pending:
      "bg-amber-500/15 text-amber-900 border border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/40",
    in_progress:
      "bg-sky-500/15 text-sky-900 border border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-100 dark:border-sky-400/40",
    resolved:
      "bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-400/40",
};
const Complaints = () => {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState({});
    const { data: rows = [] } = useQuery({
        queryKey: ["complaints", "my", user?.id],
        queryFn: () => apiJson("/api/complaints/my"),
        enabled: !!user?.id,
    });
    const list = rows.map((c) => ({
        id: String(c.id),
        subject: c.category,
        message: c.message,
        status: complaintApiToUi(c.status),
        createdAt: c.created_at,
        response: c.resolution_comment,
    }));
    const submitMutation = useMutation({
        mutationFn: () =>
            apiJson("/api/complaints", {
                method: "POST",
                body: { category: subject.trim(), message: message.trim() },
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["complaints", "my", user?.id] });
            toast({ title: "Complaint submitted", description: "Our team will respond within 3 working days." });
            setSubject("");
            setMessage("");
            setErrors({});
        },
        onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    });
    const submit = () => {
        const parsed = schema.safeParse({ subject, message });
        if (!parsed.success) {
            const fe = parsed.error.flatten().fieldErrors;
            setErrors({ subject: fe.subject?.[0], message: fe.message?.[0] });
            return;
        }
        submitMutation.mutate();
    };
    return (<>
      <PageHeader title="Complaints & feedback" description="Report an issue or share feedback. We'll keep you updated on the response."/>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-1 h-fit">
          <h2 className="font-display text-lg font-semibold">Submit new</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}/>
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)}/>
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>
            <Button onClick={submit} disabled={submitMutation.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {submitMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
        <div className="space-y-4 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Your previous complaints</h2>
          {list.length === 0 ? <p className="text-sm text-muted-foreground">No complaints submitted yet.</p> : list.map((c) => (<article key={c.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-elegant">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-foreground">{c.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(c.createdAt), "MMM d, yyyy")}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ${TONE[c.status]}`}>{c.status.replace("_", " ")}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{c.message}</p>
              {c.response && <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-sm shadow-inner"><span className="font-semibold text-foreground mb-1 block">Response:</span> <span className="text-muted-foreground">{c.response}</span></div>}
            </article>))}
        </div>
      </div>
    </>);
};
export default Complaints;
