import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiJson } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const INITIAL = {
  fullName: "",
  email: "",
  password: "",
  role: "staff",
  subCity: "",
  woreda: "",
  phone: "",
  address: "",
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const [form, setForm] = useState(INITIAL);
  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiJson("/api/admin/users"),
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiJson("/api/admin/audit-logs"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiJson("/api/admin/users", {
        method: "POST",
        body: form,
      }),
    onSuccess: () => {
      setForm(INITIAL);
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      toast({ title: "User created" });
    },
    onError: (e) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => apiJson(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      toast({ title: "User deactivated" });
    },
    onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <>
      <PageHeader
        title="Admin & Staff Management"
        description="Create staff/admin users and review audit events."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Create user</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full">
              Create user
            </Button>
          </div>
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Users</h2>
          <div className="mt-3 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="text-muted-foreground">{u.email} · {u.role} · {u.is_active ? "active" : "inactive"}</p>
                </div>
                {u.is_active && (
                  <Button variant="outline" size="sm" onClick={() => deactivateMutation.mutate(u.id)}>
                    Deactivate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Audit logs</h2>
        <div className="mt-3 space-y-2">
          {logs.slice(0, 50).map((l) => (
            <div key={l.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{l.action}</p>
              <p className="text-muted-foreground">
                {l.actor_name || "System"} · {l.entity_type} #{l.entity_id || "-"} · {new Date(l.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
