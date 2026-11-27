import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { localLogin, localCurrentSession } from "@/lib/local-auth-api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof search["redirect"] === "string" && search["redirect"].startsWith("/") ? search["redirect"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Admin Sign In – Hyderabad Safety Tools" },
    { name: "description", content: "Secure sign in for the Hyderabad Safety Tools product manager." },
    { property: "og:title", content: "Admin Sign In – Hyderabad Safety Tools" },
    { property: "og:description", content: "Secure store administration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manojenterprisesinfo@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
  localCurrentSession().then((user) => {
    if (user) navigate({ to: redirect && redirect.startsWith("/admin") ? redirect : "/admin", replace: true });
  });
}, [navigate, redirect]);
async function signIn(event: FormEvent) {
  event.preventDefault();
  setLoading(true);
  setError("");

  try {
    const result = await localLogin({ data: { email, password } });
    setLoading(false);

    if (!result?.id) {
    setError("Email or password is incorrect. Please try again.");
    return;
    }
    navigate({ to: redirect && redirect.startsWith("/admin") ? redirect : "/admin", replace: true });
  } catch {
    setLoading(false);
    setError("Email or password is incorrect. Please try again.");
  }
}
  return (
    <div className="grid min-h-screen place-items-center bg-navy-deep px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center bg-accent-gradient shadow-glow"><ShieldCheck className="h-7 w-7 text-accent-foreground" /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-accent">Hyderabad Safety Tools</p>
          <h1 className="mt-2 text-3xl font-extrabold">Admin sign in</h1>
          <p className="mt-3 text-sm text-muted-foreground">Manage the products shown on your storefront.</p>
        </div>
        <form onSubmit={signIn} className="space-y-5 border border-border bg-card p-6 shadow-lift sm:p-8">
          <div className="space-y-2"><Label htmlFor="email">Admin email</Label><Input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-none bg-background" /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-none bg-background" /></div>
          {error && <p role="alert" className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-none bg-accent font-bold text-accent-foreground hover:bg-accent/90"><LockKeyhole />{loading ? "Signing in…" : "Sign in to product manager"}</Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">Only the approved store administrator can manage products. There is no public admin registration.</p>
        </form>
      </div>
    </div>
  );
}
