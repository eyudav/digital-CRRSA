import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/AppShell";
import { ScrollText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { EmptyState } from "./CitizenDashboard";
import { apiJson } from "@/lib/api";
import { mapApplicationListRow } from "@/lib/applicationMap";
const Certificates = () => {
    const { user } = useAuth();
    const { data: apps = [] } = useQuery({
        queryKey: ["applications", "my", user?.id],
        queryFn: async () => {
            const rows = await apiJson("/api/applications/my");
            return rows.map((r) => mapApplicationListRow(r));
        },
        enabled: !!user?.id,
    });
    const certs = apps
        .filter((a) => a.status === "ready_for_collection")
        .map((a) => ({
            id: `cert-${a.id}`,
            certificateType: a.serviceName,
            serial: `CRC-${a.refNumber.split("-").pop()}`,
            issuedDate: a.updatedAt,
        }));
    return (<>
      <PageHeader title="My certificates" description="Issued certificates and digital records linked to your account."/>
      {certs.length === 0 ? <EmptyState title="No certificates yet" description="Once a service is approved and marked ready for collection, it will appear here."/> : (<div className="grid gap-4 md:grid-cols-2">
          {certs.map((c) => (<div key={c.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-grad text-primary-foreground"><ScrollText className="h-5 w-5"/></span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold">{c.certificateType}</p>
                <p className="text-xs text-muted-foreground">{c.serial} · Issued {format(new Date(c.issuedDate), "MMM d, yyyy")}</p>
                <p className="mt-1 text-xs font-medium text-primary">Certificate must be collected physically.</p>
              </div>
            </div>))}
        </div>)}
    </>);
};
export default Certificates;
