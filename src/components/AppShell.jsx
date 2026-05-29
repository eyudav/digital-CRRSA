import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareWarning,
  ScrollText,
  Sparkles,
  Users,
  Calendar,
  Settings,
  Menu,
  User,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiJson } from "@/lib/api";

function notificationReadSet() {
  try {
    return new Set(
      JSON.parse(localStorage.getItem("crrsa-notif-read") || "[]"),
    );
  } catch {
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
  {
    to: "/citizen/complaints",
    label: "Complaints",
    icon: MessageSquareWarning,
  },
  { to: "/citizen/settings", label: "Profile information", icon: User },
  {
    to: "/citizen/settings/password",
    label: "Change password",
    icon: Lock,
  },
];

const STAFF_NAV = [
  { to: "/staff", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/staff/queue", label: "Review queue", icon: Inbox },
  { to: "/staff/announcements", label: "Announcements", icon: Megaphone },
  { to: "/staff/settings", label: "Profile information", icon: User },
  {
    to: "/staff/settings/password",
    label: "Change password",
    icon: Lock,
  },
];

const ADMIN_NAV = [
  { to: "/staff/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/staff/admin/users", label: "User management", icon: Users },
  { to: "/staff/admin/logs", label: "System Logs", icon: ScrollText },
  { to: "/staff/settings", label: "Profile information", icon: User },
  {
    to: "/staff/settings/password",
    label: "Change password",
    icon: Lock,
  },
];

const SUPER_ADMIN_NAV = [
  {
    to: "/super-admin",
    label: "Super Admin Home",
    icon: LayoutDashboard,
    end: true,
  },
  { to: "/staff/admin/users", label: "Manage administrators", icon: Users },
  { to: "/super-admin/settings", label: "System Settings", icon: Settings },
  { to: "/super-admin/logs", label: "System Logs", icon: FileText },
  // Platform Access removed from super-admin navigation
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nav =
    user?.role === "citizen"
      ? CITIZEN_NAV
      : user?.role === "super_admin"
        ? SUPER_ADMIN_NAV
        : user?.role === "staff"
          ? STAFF_NAV
          : ADMIN_NAV;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "my", user?.id],
    queryFn: () => apiJson("/api/notifications/my"),
    enabled: !!user?.id && user?.role === "citizen",
  });

  const readIds = notificationReadSet();
  const unread =
    user?.role === "citizen"
      ? notifications.filter((n) => !readIds.has(String(n.id))).length
      : 0;

  if (!user) return null;

  const userInitials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
        <Sidebar
          collapsible="icon"
          variant="inset"
          className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-elegant"
        >
          <SidebarRail />
          <SidebarHeader className="p-4 flex items-center justify-center">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink to={item.to} end={item.end}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                      {item.label === "Notifications" && unread > 0 && (
                        <SidebarMenuBadge className="bg-primary text-primary-foreground">
                          {unread}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-12 justify-start gap-3 px-2 hover:bg-sidebar-accent"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                    <span className="text-sm font-medium truncate w-full">
                      {user.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize truncate w-full">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    navigate(
                      `/${user.role === "citizen" ? "citizen" : "staff"}/settings`,
                    )
                  }
                >
                  <User className="mr-2 h-4 w-4" /> Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur transition-colors duration-300">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1"></div>
            <ThemeToggle />
          </header>

          {/* Content Area */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Re-export PageHeader from here for backwards compatibility until all files are updated to import from src/components/PageHeader
export { PageHeader } from "./PageHeader";
