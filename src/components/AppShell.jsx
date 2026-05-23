import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, FileText, Inbox, LayoutDashboard, LogOut, Megaphone, MessageSquareWarning, ScrollText, Sparkles, Calendar, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/api";

function notificationReadSet() {
    try {
        return new Set(JSON.parse(localStorage.getItem("crrsa-notif-read") || "[]"));
    }
    catch {
        return new Set();
    }
}
const CITIZEN_NAV = [
    { to: "/citizen", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/citizen/services", label: "Services", icon: Sparkles },
    { to: "/citizen/applications", label: "My applications", icon: FileText },
    { to: "/citizen/appointments", label: "Appointments", icon: Calendar },
    { to: "/citizen/notifications", label: "Notifications", icon: Bell },
    { to: "/citizen/announcements", label: "Announcements", icon: Megaphone },
    { to: "/citizen/complaints", label: "Complaints", icon: MessageSquareWarning },
    { to: "/citizen/certificates", label: "My certificates", icon: ScrollText },
    { to: "/citizen/settings", label: "Settings", icon: Settings },
];
const STAFF_NAV = [
    { to: "/staff", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/staff/queue", label: "Review queue", icon: Inbox },
    { to: "/staff/announcements", label: "Announcements", icon: Megaphone },
    { to: "/staff/settings", label: "Settings", icon: Settings },
];
const ADMIN_NAV = [
    { to: "/staff/complaints", label: "Complaints", icon: MessageSquareWarning },
    { to: "/staff/settings", label: "Settings", icon: Settings },
    { to: "/staff/admin/users", label: "User management", icon: Settings },
];
const SUPER_ADMIN_NAV = [
    { to: "/super-admin", label: "Super Admin Home", icon: LayoutDashboard, end: true },
    { to: "/staff/admin/users", label: "Manage users", icon: Settings },
    { to: "/super-admin/settings", label: "System Settings", icon: Settings },
    { to: "/super-admin/logs", label: "System Logs", icon: FileText },
    { to: "/staff/queue", label: "Platform Access", icon: Inbox },
];
export function AppShell() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const nav = user?.role === "citizen" ? CITIZEN_NAV : user?.role === "super_admin" ? SUPER_ADMIN_NAV : user?.role === "staff" ? STAFF_NAV : ADMIN_NAV;
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications", "my", user?.id],
        queryFn: () => apiJson("/api/notifications/my"),
        enabled: !!user?.id && user?.role === "citizen",
    });
    const readIds = notificationReadSet();
    const unread = user?.role === "citizen"
        ? notifications.filter((n) => !readIds.has(String(n.id))).length
        : 0;
    if (!user)
        return null;
    return (<div className="min-h-screen bg-cream-grad">
      <div className="mx-auto flex max-w-[1400px] gap-6 p-4 md:p-6">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-2xl bg-sidebar p-5 text-sidebar-foreground shadow-elegant lg:flex">
          <Logo variant="light"/>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => (<NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground")}>
                <item.icon className="h-4 w-4"/>
                <span className="flex-1">{item.label}</span>
                {item.label === "Notifications" && unread > 0 && (<Badge className="bg-accent text-accent-foreground hover:bg-accent">{unread}</Badge>)}
              </NavLink>))}
          </nav>
          <div className="mt-4 rounded-xl bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-accent font-display text-sm font-semibold text-accent-foreground">
                {user.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{user.fullName}</p>
                <p className="truncate text-xs capitalize text-sidebar-foreground/60">{user.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-3 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="mr-2 h-4 w-4"/> Sign out
            </Button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <header className="mb-4 flex items-center justify-between rounded-2xl bg-card p-3 shadow-soft lg:hidden">
            <Logo />
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="h-4 w-4"/>
            </Button>
          </header>
          <Outlet />
          {/* Mobile bottom nav */}
          <nav className="fixed inset-x-2 bottom-2 z-40 flex items-center justify-around rounded-2xl bg-sidebar px-2 py-2 text-sidebar-foreground shadow-elegant lg:hidden">
            {nav.slice(0, 5).map((item) => (<NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cn("flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70")}>
                <item.icon className="h-4 w-4"/>
                <span className="leading-none">{item.label.split(" ")[0]}</span>
              </NavLink>))}
          </nav>
        </main>
      </div>
    </div>);
}
export function PageHeader({ title, description, actions, eyebrow }) {
    return (<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>);
}
