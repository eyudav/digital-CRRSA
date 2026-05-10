import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";
import { apiJson } from "@/lib/api";
const TONE = {
    service_update: "bg-info/10 text-info",
    deadline: "bg-warning/15 text-warning-foreground",
    interruption: "bg-destructive/10 text-destructive",
    general: "bg-secondary text-secondary-foreground",
};
const Announcements = () => {
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
    return (<>
      <PageHeader title="Announcements" description="Official notices, service updates and scheduled interruptions."/>
      <div className="space-y-4">
        {list.map((a) => (<article key={a.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-grad text-primary-foreground"><Megaphone className="h-4 w-4"/></span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">By {a.author} · {format(new Date(a.createdAt), "MMM d, yyyy")}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] ${TONE[a.category] || TONE.general}`}>{a.category.replace("_", " ")}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">{a.body}</p>
          </article>))}
      </div>
    </>);
};
export default Announcements;
