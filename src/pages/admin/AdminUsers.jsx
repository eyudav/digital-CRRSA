import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { ContentCard } from "@/components/ContentCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiJson } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Eye, Pencil, UserX, Search } from "lucide-react";

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

function UserRoleColumn({
  title,
  toneClass,
  users,
  isLoading,
  isError,
  error,
  search,
  onSearchChange,
  onView,
  onEdit,
  onDeactivate,
  canEditCitizen,
  currentUserId,
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        String(u.id).includes(q)
    );
  }, [users, search]);

  return (
    <section
      className={`flex min-h-[320px] flex-col rounded-2xl border border-border bg-card shadow-soft transition-all hover:shadow-elegant ${toneClass}`}
    >
      <div className="border-b border-border p-5">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{users.length} accounts</p>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, email, id…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="max-h-[480px] flex-1 overflow-y-auto p-3">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
        {isError && (
          <p className="p-4 text-sm text-destructive">{error?.message || "Failed to load."}</p>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">No users match.</p>
        )}
        <ul className="space-y-2">
          {filtered.map((u) => (
            <li
              key={u.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {u.is_active ? (
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {u.email_verified === false && (
                      <Badge variant="outline" className="text-[10px]">
                        Email unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button variant="outline" size="sm" className="h-8" onClick={() => onView(u)}>
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                {(canEditCitizen || u.role !== "citizen") && (
                  <Button variant="outline" size="sm" className="h-8" onClick={() => onEdit(u)}>
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                )}
                {u.is_active && Number(u.id) !== Number(currentUserId) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-destructive hover:bg-destructive/10"
                    onClick={() => onDeactivate(u)}
                  >
                    <UserX className="mr-1 h-3 w-3" />
                    Deactivate
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function AdminUsers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isSuper = user?.role === "super_admin";
  const [form, setForm] = useState(INITIAL);
  const [qCitizen, setQCitizen] = useState("");
  const [qStaff, setQStaff] = useState("");
  const [qAdmin, setQAdmin] = useState("");
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const { data: citizens = [], ...citizensMeta } = useQuery({
    queryKey: ["admin", "users", "citizen"],
    queryFn: () => apiJson("/api/admin/users?role=citizen"),
    enabled: isSuper,
  });

  const { data: staff = [], ...staffMeta } = useQuery({
    queryKey: ["admin", "users", "staff"],
    queryFn: () => apiJson("/api/admin/users?role=staff"),
    enabled: !!user,
  });

  const { data: adminsOnly = [], ...adminsMeta } = useQuery({
    queryKey: ["admin", "users", "admin"],
    queryFn: () => apiJson("/api/admin/users?role=admin"),
    enabled: !!user,
  });

  const { data: superOnly = [], ...superMeta } = useQuery({
    queryKey: ["admin", "users", "super_admin"],
    queryFn: () => apiJson("/api/admin/users?role=super_admin"),
    enabled: isSuper,
  });

  const adminRoster = useMemo(() => {
    const a = [...adminsOnly, ...(isSuper ? superOnly : [])];
    const byId = new Map();
    a.forEach((u) => byId.set(u.id, u));
    return Array.from(byId.values()).sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
  }, [adminsOnly, superOnly, isSuper]);

  const adminsLoading = adminsMeta.isLoading || (isSuper && superMeta.isLoading);
  const adminsError = adminsMeta.error || superMeta.error;

  const { data: logs = [] } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiJson("/api/admin/audit-logs"),
  });

  const invalidateUsers = () => {
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      apiJson("/api/admin/users", {
        method: "POST",
        body: form,
      }),
    onSuccess: () => {
      setForm(INITIAL);
      invalidateUsers();
      qc.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      toast({ title: "User created" });
    },
    onError: (e) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => apiJson(`/api/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateUsers();
      qc.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      toast({ title: "User deactivated" });
    },
    onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, body }) => apiJson(`/api/admin/users/${id}`, { method: "PATCH", body }),
    onSuccess: () => {
      setEditUser(null);
      invalidateUsers();
      qc.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
      toast({ title: "User updated" });
    },
    onError: (e) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  return (
    <>
      <PageHeader
        title={isSuper ? "Manage users" : "Admin & staff management"}
        description={
          isSuper
            ? "Citizens, staff, and administrators in one place. Search, review, edit, and deactivate accounts."
            : "Create staff accounts and manage operational users in your jurisdiction."
        }
      />

      <div className="mb-6">
        <ContentCard title="Create user">
          <div className="mt-2 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                {isSuper && <SelectItem value="admin">Admin</SelectItem>}
                {isSuper && <SelectItem value="super_admin">Super Admin</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sub-city</Label>
            <Input value={form.subCity} onChange={(e) => setForm((f) => ({ ...f, subCity: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !form.subCity.trim() || !form.phone.trim()}
        >
          Create user
        </Button>
        </ContentCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {isSuper ? (
          <UserRoleColumn
            title="Citizens"
            toneClass="border-l-4 border-l-teal-500"
            users={citizens}
            isLoading={citizensMeta.isLoading}
            isError={citizensMeta.isError}
            error={citizensMeta.error}
            search={qCitizen}
            onSearchChange={setQCitizen}
            onView={setViewUser}
            onEdit={setEditUser}
            onDeactivate={(u) => deactivateMutation.mutate(u.id)}
            canEditCitizen={isSuper}
            currentUserId={user?.id}
          />
        ) : (
          <section className="rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-sm text-muted-foreground">
            <h2 className="font-display text-lg font-semibold text-foreground">Citizens</h2>
            <p className="mt-2">
              Citizen directory and edits are restricted to super administrators. Contact a super admin for
              citizen account changes.
            </p>
          </section>
        )}

        <UserRoleColumn
          title="Staff"
          toneClass="border-l-4 border-l-amber-500"
          users={staff}
          isLoading={staffMeta.isLoading}
          isError={staffMeta.isError}
          error={staffMeta.error}
          search={qStaff}
          onSearchChange={setQStaff}
          onView={setViewUser}
          onEdit={setEditUser}
          onDeactivate={(u) => deactivateMutation.mutate(u.id)}
          canEditCitizen={isSuper}
          currentUserId={user?.id}
        />

        <UserRoleColumn
          title="Admins"
          toneClass="border-l-4 border-l-violet-500"
          users={adminRoster}
          isLoading={adminsLoading}
          isError={adminsMeta.isError || superMeta.isError}
          error={adminsError}
          search={qAdmin}
          onSearchChange={setQAdmin}
          onView={setViewUser}
          onEdit={setEditUser}
          onDeactivate={(u) => deactivateMutation.mutate(u.id)}
          canEditCitizen={isSuper}
          currentUserId={user?.id}
        />
      </div>

      <section className="mt-8">
        <ContentCard title="Audit logs">
          <div className="mt-1 max-h-64 space-y-3 overflow-y-auto pr-2">
          {logs.slice(0, 50).map((l) => (
            <div key={l.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{l.action}</p>
              <p className="text-muted-foreground">
                {l.actor_name || "System"} · {l.entity_type} #{l.entity_id || "-"} ·{" "}
                {new Date(l.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          </div>
        </ContentCard>
      </section>

      <Dialog open={!!viewUser} onOpenChange={(o) => !o && setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewUser?.full_name}</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">ID</dt>
                <dd>{viewUser.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd>{viewUser.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="capitalize">{viewUser.role?.replace("_", " ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd>{viewUser.is_active ? "Active" : "Inactive"}</dd>
              </div>
              {viewUser.phone && (
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd>{viewUser.phone}</dd>
                </div>
              )}
              {(viewUser.sub_city || viewUser.woreda) && (
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd>
                    {[viewUser.sub_city, viewUser.woreda].filter(Boolean).join(" · ")}
                  </dd>
                </div>
              )}
              {viewUser.address && (
                <div>
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd>{viewUser.address}</dd>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editUser && (
            <EditUserForm
              key={editUser.id}
              userRow={editUser}
              isSuper={isSuper}
              onSave={(body) => patchMutation.mutate({ id: editUser.id, body })}
              onCancel={() => setEditUser(null)}
              pending={patchMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditUserForm({ userRow, isSuper, onSave, onCancel, pending }) {
  const [fullName, setFullName] = useState(userRow.full_name || "");
  const [email, setEmail] = useState(userRow.email || "");
  const [phone, setPhone] = useState(userRow.phone || "");
  const [subCity, setSubCity] = useState(userRow.sub_city || "");
  const [woreda, setWoreda] = useState(userRow.woreda || "");
  const [address, setAddress] = useState(userRow.address || "");

  const citizenOnly = userRow.role === "citizen";
  const showLocation = !citizenOnly || isSuper;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Full name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {showLocation && (
        <>
          <div className="space-y-1.5">
            <Label>Sub-city</Label>
            <Input value={subCity} onChange={(e) => setSubCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Woreda</Label>
            <Input value={woreda} onChange={(e) => setWoreda(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </>
      )}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() =>
            onSave({
              fullName: fullName.trim(),
              email: email.trim(),
              phone: phone.trim() || null,
              subCity: showLocation ? subCity.trim() || null : undefined,
              woreda: showLocation ? woreda.trim() || null : undefined,
              address: showLocation ? address.trim() || null : undefined,
            })
          }
          disabled={pending || !fullName.trim() || !email.trim()}
        >
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}
