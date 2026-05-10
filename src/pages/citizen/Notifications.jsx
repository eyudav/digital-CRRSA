import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Bell, CalendarCheck, FileText, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "./CitizenDashboard";
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
      {list.length === 0 ? <EmptyState title="No notifications yet" description="You'll see status updates and reminders here."/> : (<ul className="space-y-2">
          {list.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                const read = readIds.has(n.id);
                return (<li key={n.id} className={`flex items-start gap-3 rounded-2xl border p-4 ${read ? "border-border bg-card" : "border-primary/30 bg-primary/5"}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-grad text-primary-foreground"><Icon className="h-4 w-4"/></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{format(new Date(n.createdAt), "MMM d, HH:mm")}</p>
                </div>
                {!read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary"/>}
              </li>);
            })}
        </ul>)}
    </>);
};
export default Notifications;
