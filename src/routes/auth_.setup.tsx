import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth_/setup")({
  head: () => ({ meta: [
    { title: "Set Your Password – Hyderabad Safety Tools" }, { name: "description", content: "Complete your invited Hyderabad Safety Tools account." },
    { property: "og:title", content: "Set Your Password – Hyderabad Safety Tools" }, { property: "og:description", content: "Secure invited account setup." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" },
  ] }), component: SetupPage,
});
function SetupPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setReady(Boolean(data.user)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setReady(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    const { error: saveError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (saveError) { setError("Could not set your password. Try a stronger password or request a new invitation."); return; }
    setPassword(""); setConfirm(""); setDone(true);
  }
  return <main className="container-x grid min-h-[70vh] place-items-center py-12"><div className="w-full max-w-md"><h1 className="mb-6 text-3xl font-bold">{done ? "Account ready" : "Set your password"}</h1>{done ? <p>Your password is saved. Contact your store administrator if you need admin access.</p> : !ready ? <p className="text-muted-foreground">Open the invitation link from your email to complete your account.</p> : <form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" minLength={8} required autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></div>{error && <p role="alert" className="text-destructive">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button></form>}</div></main>;
}