import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";
import { apiJson } from "@/lib/api";
const StaffAnnouncements = () => {
    const qc = useQueryClient();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [category, setCategory] = useState("general");
    const { data: rows = [] } = useQuery({
        queryKey: ["announcements"],
        queryFn: () => apiJson("/api/announcements"),
    });
    const list = rows.map((a) => ({
        id: String(a.id),
        title: a.title,
        body: a.body,
        category: a.category || "general",
        createdAt: a.created_at,
        author: "CRRSA",
    }));
    const postMutation = useMutation({
        mutationFn: () =>
            apiJson("/api/announcements", {
                method: "POST",
                body: { title: title.trim(), body: body.trim(), category },
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["announcements"] });
            setTitle("");
            setBody("");
            toast({ title: "Announcement published" });
        },
        onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    });
    const post = () => {
        if (title.trim().length < 3 || body.trim().length < 10)
            return toast({ title: "Title and body are required", variant: "destructive" });
        postMutation.mutate();
    };
    return (<>
      <PageHeader title="Announcements" description="Publish notices, service updates and scheduled interruptions for citizens."/>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-1">
          <h2 className="font-display text-lg font-semibold">New announcement</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}/>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="service_update">Service update</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="interruption">Interruption</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" rows={6} value={body} onChange={(e) => setBody(e.target.value)}/>
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={post} disabled={postMutation.isPending}>Publish</Button>
          </div>
        </div>
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Recent</h2>
          {list.map((a) => (<article key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-grad text-primary-foreground"><Megaphone className="h-4 w-4"/></span>
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">By {a.author} · {format(new Date(a.createdAt), "MMM d, yyyy")}</p>
                  <p className="mt-2 text-sm">{a.body}</p>
                </div>
              </div>
            </article>))}
        </div>
      </div>
    </>);
};
export default StaffAnnouncements;
