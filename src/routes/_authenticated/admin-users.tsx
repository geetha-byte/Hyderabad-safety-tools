import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { listLocalAdminUsers, changeLocalUserRole } from "@/lib/local-admin-users.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
export const Route = createFileRoute("/_authenticated/admin-users")({
  head: () => ({ meta: [
    { title: "Users & Roles – Hyderabad Safety Tools" },
    { name: "description", content: "Manage store user invitations and administrator access." },
    { property: "og:title", content: "Users & Roles – Hyderabad Safety Tools" },
    { property: "og:description", content: "Private store account management." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }), component: UsersPage,
});

function UsersPage() {
  const list = useServerFn(listLocalAdminUsers);
  const change = useServerFn(changeLocalUserRole);
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useQuery({ queryKey: ["admin-users", page], queryFn: () => list({ data: { page } }) });
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ userId: string; email: string; role: "user" | "admin" } | null>(null);
  async function saveRole() {
    if (!pending) return;
    setBusy(true);
    try {
      await change({ data: { userId: pending.userId, role: pending.role } });
      toast.success("User role updated"); setPending(null);
      await client.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update role"); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card"><div className="container-x flex flex-wrap items-center justify-between gap-4 py-5"><h1 className="flex items-center gap-3 text-2xl font-bold"><Users className="text-accent" />Users & roles</h1><Button variant="outline" asChild><Link to="/admin"><ArrowLeft />Products</Link></Button></div></header>
    <main className="container-x py-8">
      {isLoading ? <div className="grid min-h-48 place-items-center"><LoaderCircle className="animate-spin" /></div> : error ? <p role="alert" className="text-destructive">Admin access required. User accounts could not be loaded.</p> : <>
        <div className="divide-y divide-border border border-border bg-card">{data?.users.map(user => <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0"><p className="break-all font-semibold">{user.email}</p><p className="mt-1 text-sm text-muted-foreground">{user.verified ? "Verified" : "Invitation pending"} · {new Date(user.createdAt).toLocaleDateString()}</p></div>
          <Select value={user.role} disabled={busy || user.id === data.actorId || user.email.toLowerCase() === "manojenterprisesinfo@gmail.com"} onValueChange={role => { if (role === "user" || role === "admin") setPending({ userId: user.id, email: user.email, role }); }}><SelectTrigger aria-label={`Role for ${user.email}`} className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin" disabled={!user.verified}>Admin</SelectItem></SelectContent></Select>
        </div>)}</div>
        {!data?.users.length && <p className="py-8 text-center text-muted-foreground">No users found.</p>}
        <div className="mt-5 flex items-center justify-end gap-4"><Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft /></Button><span className="text-sm">Page {page}</span><Button variant="outline" size="icon" aria-label="Next page" disabled={!data?.hasNext} onClick={() => setPage(page + 1)}><ChevronRight /></Button></div>
      </>}
    </main>

    <AlertDialog open={pending !== null} onOpenChange={value => { if (!value && !busy) setPending(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Change user role?</AlertDialogTitle><AlertDialogDescription>{pending?.email} will become {pending?.role === "admin" ? "an admin with access to products, users and roles" : "a regular user without admin access"}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={event => { event.preventDefault(); void saveRole(); }}>{busy ? "Saving…" : "Save role"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
