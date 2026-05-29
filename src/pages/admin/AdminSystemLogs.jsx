import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { apiJson } from "@/lib/api";
import { Input } from "@/components/ui/input";

export default function AdminSystemLogs() {
  const [logEmailSearch, setLogEmailSearch] = useState("");

  const { data: logs = [] } = useQuery({
    queryKey: ["admin", "audit-logs", logEmailSearch],
    queryFn: () =>
      apiJson(
        `/api/admin/audit-logs?email=${encodeURIComponent(logEmailSearch)}`,
      ),
  });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="System Logs"
        description="Activity by staff and citizens in your jurisdiction (admin and super admin actions are excluded)."
      />

      <div className="mt-6 max-w-sm">
        <Input
          type="email"
          placeholder="Search logs by actor email..."
          value={logEmailSearch}
          onChange={(e) => setLogEmailSearch(e.target.value)}
          className="w-full text-sm"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Actor</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-secondary/20"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="px-6 py-4">
                    {log.actor_name || `User #${log.actor_user_id}`}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {log.action}
                  </td>
                  <td className="px-6 py-4">
                    {log.entity_type}{" "}
                    {log.entity_id ? `#${log.entity_id}` : ""}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
