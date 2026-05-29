import { Link } from "react-router-dom";
import { Users, FileText, Settings } from "lucide-react";
import { PageHeader } from "@/components/AppShell";

const SuperAdminDashboard = () => {
    return (
        <>
            <PageHeader
                eyebrow="Super Admin"
                title="System Overview"
                description="Manage administrator accounts, view global system logs, and configure platform settings."
            />

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link to="/staff/admin/users" className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:border-primary">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold group-hover:text-primary">Manage administrators</h3>
                        <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Create and activate or deactivate city-wide administrator accounts.</p>
                </Link>

                <Link to="/super-admin/logs" className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:border-primary">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold group-hover:text-primary">System Logs</h3>
                        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Audit auth, profile, and administrative actions.</p>
                </Link>

                <Link to="/super-admin/settings" className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:border-primary">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold group-hover:text-primary">System Settings</h3>
                        <Settings className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Configure max file sizes, limits, and maintenance modes.</p>
                </Link>
            </div>
        </>
    );
};

export default SuperAdminDashboard;
