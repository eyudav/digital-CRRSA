import { useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { SERVICES } from "@/data/seed";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
const Services = () => {
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("all");
    const filtered = SERVICES.filter((s) => (cat === "all" || s.category === cat) &&
        (s.name.toLowerCase().includes(q.toLowerCase()) || s.description.toLowerCase().includes(q.toLowerCase())));
    const cats = [
        { id: "all", label: "All" },
        { id: "vital", label: "Vital records" },
        { id: "identity", label: "Identity" },
        { id: "residency", label: "Residency" },
    ];
    return (<>
      <PageHeader title="Available services" description="Choose a service to start a new application. Each card shows the documents you'll need and the typical processing time."/>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services..." className="pl-9"/>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (<Button key={c.id} variant={cat === c.id ? "default" : "outline"} size="sm" className={cat === c.id ? "bg-primary text-primary-foreground" : ""} onClick={() => setCat(c.id)}>{c.label}</Button>))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
            const Icon = Icons[s.icon] || Icons.FileText;
            return (<div key={s.id} className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-grad text-primary-foreground"><Icon className="h-5 w-5"/></span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{s.category}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-secondary/60 p-2.5">
                  <p className="text-muted-foreground">Processing</p>
                  <p className="mt-0.5 font-semibold">~{s.processingDays} days</p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-2.5">
                  <p className="text-muted-foreground">Fee</p>
                  <p className="mt-0.5 font-semibold">{s.fee} ETB</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Who can apply</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {(s.whoCanApply || []).slice(0, 3).map((w) => (<li key={w} className="flex gap-1.5"><span className="text-primary">•</span>{w}</li>))}
                </ul>
              </div>
              <Button asChild className="mt-5 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to={`/citizen/apply/${s.slug}`}>Start application</Link>
              </Button>
            </div>);
        })}
      </div>
    </>);
};
export default Services;
