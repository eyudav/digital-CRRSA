import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Bell, CalendarCheck, FileText, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { apiJson } from "@/lib/api";

const READ_KEY = "crrsa-notif-read";

function readSet() {
    try {
        return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
    }
    catch {
        return new Set();
    }
}

function saveReadSet(set) {
    localStorage.setItem(READ_KEY, JSON.stringify([...set]));
}

const ICONS = { status: FileText, appointment: CalendarCheck, document: FileText, announcement: Megaphone };
const Notifications = () => {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [, setTick] = useState(0);
    const { data: raw = [] } = useQuery({
        queryKey: ["notifications", "my", user?.id],
        queryFn: () => apiJson("/api/notifications/my"),
        enabled: !!user?.id,
    });
    const readIds = readSet();
    const list = raw.map((n) => ({
        id: String(n.id),
        title: n.title,
        message: n.body,
        type: n.channel === "in_app" ? "status" : "announcement",
        createdAt: n.created_at,
    }));
    const markAll = () => {
        const s = readSet();
        list.forEach((n) => s.add(n.id));
        saveReadSet(s);
        setTick((t) => t + 1);
        qc.invalidateQueries({ queryKey: ["notifications", "my", user?.id] });
    };
    return (<>
      <PageHeader title="Notifications" description="Status changes, document requests, appointment reminders and more." actions={<Button variant="outline" onClick={markAll}>Mark all as read</Button>}/>
      {list.length === 0 ? <EmptyState title="No notifications yet" description="You'll see status updates and reminders here."/> : (<div className="space-y-3">
          {list.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                const read = readIds.has(n.id);
                return (
                <Card key={n.id} className={`transition-all ${read ? "border-border shadow-sm" : "border-primary/30 bg-primary/5 shadow-soft"}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-grad text-primary-foreground shadow-soft"><Icon className="h-5 w-5"/></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">{format(new Date(n.createdAt), "MMM d, HH:mm")}</p>
                    </div>
                    {!read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]"/>}
                  </CardContent>
                </Card>);
            })}
        </div>)}
    </>);
};
export default Notifications;
