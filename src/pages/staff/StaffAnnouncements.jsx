import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Megaphone, Pencil, Trash2, Eye, Send, FileEdit } from "lucide-react";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function StaffAnnouncements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [editRow, setEditRow] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: rows = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["announcements", "manage"],
    queryFn: () => apiJson("/api/announcements/manage"),
  });

  const list = rows.map((a) => ({
    id: String(a.id),
    title: a.title,
    body: a.body,
    category: a.category || "general",
    createdAt: a.created_at,
    postedBy: a.posted_by != null ? String(a.posted_by) : null,
    published: a.published !== false,
  }));

  const canEditItem = (item) =>
    user?.role === "staff" ? item.postedBy === String(user?.id) : true;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["announcements", "manage"] });
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };

  const postMutation = useMutation({
    mutationFn: ({ published }) =>
      apiJson("/api/announcements", {
        method: "POST",
        body: { title: title.trim(), body: body.trim(), category, published },
      }),
    onSuccess: () => {
      invalidateAll();
      setTitle("");
      setBody("");
      toast({ title: "Saved" });
    },
    onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, body: b }) => apiJson(`/api/announcements/${id}`, { method: "PATCH", body: b }),
    onSuccess: () => {
      invalidateAll();
      setEditRow(null);
      toast({ title: "Updated" });
    },
    onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiJson(`/api/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateAll();
      setDeleteId(null);
      toast({ title: "Removed" });
    },
    onError: (e) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const publish = () => {
    if (title.trim().length < 3 || body.trim().length < 10) {
      toast({ title: "Title and body are required", variant: "destructive" });
      return;
    }
    postMutation.mutate({ published: true });
  };

  const saveDraft = () => {
    if (title.trim().length < 3 || body.trim().length < 10) {
      toast({ title: "Title and body are required", variant: "destructive" });
      return;
    }
    postMutation.mutate({ published: false });
  };

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Create, edit, publish, or remove notices visible to citizens on their Announcements page."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-1">
          <h2 className="font-display text-lg font-semibold">New announcement</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="service_update">Service update</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="interruption">Interruption</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Body</Label>
              <Textarea id="body" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={publish}
                disabled={postMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish
              </Button>
              <Button variant="outline" className="w-full" onClick={saveDraft} disabled={postMutation.isPending}>
                <FileEdit className="mr-2 h-4 w-4" />
                Save as draft
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">All announcements</h2>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              Refresh
            </Button>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error?.message || "Could not load announcements."}
            </div>
          )}
          {!isLoading && !isError && list.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No announcements yet. Publish one using the form on the left.
            </p>
          )}
          {list.map((a) => (
            <article key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-grad text-primary-foreground">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold">{a.title}</h3>
                      <Badge variant="outline" className="text-[10px]">
                        {a.category}
                      </Badge>
                      {a.published ? (
                        <Badge className="bg-success/15 text-success hover:bg-success/20">Live</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(a.createdAt), "MMM d, yyyy")}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm">{a.body}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewRow(a)}>
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                  {canEditItem(a) && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditRow(a)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          patchMutation.mutate({
                            id: a.id,
                            body: { published: !a.published },
                          })
                        }
                        disabled={patchMutation.isPending}
                      >
                        {a.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(a.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Dialog open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewRow?.title}</DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div className="space-y-2 text-sm">
              <p className="text-xs text-muted-foreground">
                {format(new Date(viewRow.createdAt), "PPP")} · {viewRow.category} ·{" "}
                {viewRow.published ? "Published" : "Draft"}
              </p>
              <p className="whitespace-pre-wrap">{viewRow.body}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
          </DialogHeader>
          {editRow && (
            <EditForm
              key={editRow.id}
              initial={editRow}
              onSave={(payload) => patchMutation.mutate({ id: editRow.id, body: payload })}
              onCancel={() => setEditRow(null)}
              pending={patchMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the announcement permanently. Citizens will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditForm({ initial, onSave, onCancel, pending }) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [category, setCategory] = useState(initial.category);
  const [published, setPublished] = useState(initial.published);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="service_update">Service update</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="interruption">Interruption</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Body</Label>
        <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="pub"
          className="h-4 w-4 rounded border"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        <Label htmlFor="pub" className="font-normal">
          Published (visible to citizens)
        </Label>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => onSave({ title: title.trim(), body: body.trim(), category, published })}
          disabled={pending || title.trim().length < 3 || body.trim().length < 10}
        >
          Save changes
        </Button>
      </DialogFooter>
    </div>
  );
}
