import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { WHATSAPP } from "@/lib/store";

export const Route = createFileRoute("/quote")({
  validateSearch: (s: Record<string, unknown>): { product?: string | undefined } => ({ product: typeof s["product"] === "string" ? s["product"] : undefined }),
  head: () => ({ meta: [{ title: "Request a Bulk Quote – Hyderabad Safety Tools" }, { name: "description", content: "Get bulk and corporate pricing on PPE and industrial safety equipment." },
    { property: "og:title", content: "Request a Bulk Quote – Hyderabad Safety Tools" }, { property: "og:description", content: "Bulk and corporate safety supply pricing." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Quote,
});

const field = "h-12 w-full rounded-none border border-input bg-card px-4 text-sm outline-none focus:border-accent";

function Quote() {
  const { product } = Route.useSearch();
  const [items, setItems] = useState([{ name: product ?? "", qty: "" }]);
  const [form, setForm] = useState({ name: "", company: "", email: "", mobile: "", notes: "" });
  const [err, setErr] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setErr("Enter a valid 10-digit Indian mobile number.");
    if (!items.some((i) => i.name.trim())) return setErr("Add at least one product.");
    setErr("");
    const text = `Bulk quote request\nName: ${form.name}\nCompany: ${form.company}\nEmail: ${form.email}\nMobile: ${form.mobile}\n\nProducts:\n${items.filter((i) => i.name).map((i) => `- ${i.name} x ${i.qty || "?"}`).join("\n")}\n\nNotes: ${form.notes}`;
    window.open(`${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <div>
      <section className="bg-hero py-16 text-foreground border-b border-border"><div className="container-x"><h1 className="text-4xl font-extrabold md:text-5xl">Request a Bulk Quote</h1><p className="mt-3 max-w-xl opacity-80">Tell us what your team needs. We'll reply with pricing and availability.</p></div></section>
      <form onSubmit={send} className="container-x -mt-8 mb-20 grid max-w-3xl gap-5 rounded-none bg-card p-8 shadow-lift">
        <div className="grid gap-4 sm:grid-cols-2">
          <input required placeholder="Full Name" className={field} value={form.name} onChange={set("name")} />
          <input placeholder="Company Name" className={field} value={form.company} onChange={set("company")} />
          <input required type="email" placeholder="Email" className={field} value={form.email} onChange={set("email")} />
          <input required inputMode="numeric" placeholder="Mobile Number" className={field} value={form.mobile} onChange={set("mobile")} />
        </div>
        <div><p className="mb-2 font-bold">Products required</p><div className="space-y-3">{items.map((it, i) => (
          <div key={i} className="flex gap-3">
            <input placeholder="Product name" className={field} value={it.name} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <input placeholder="Qty" inputMode="numeric" className={`${field} w-28`} value={it.qty} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} />
            {items.length > 1 && <button type="button" aria-label="Remove product" onClick={() => setItems(items.filter((_, j) => j !== i))} className="px-2 text-muted-foreground"><Trash2 className="h-5 w-5" /></button>}
          </div>))}</div>
          <button type="button" onClick={() => setItems([...items, { name: "", qty: "" }])} className="mt-3 flex items-center gap-1 text-sm font-bold text-accent"><Plus className="h-4 w-4" /> Add another product</button></div>
        <textarea placeholder="Additional requirements" rows={4} className="w-full rounded-none border border-input bg-card p-4 text-sm outline-none focus:border-accent" value={form.notes} onChange={set("notes")} />
        {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
        <button className="bg-accent-gradient flex items-center justify-center gap-2 rounded-none py-4 font-bold text-accent-foreground shadow-glow"><MessageCircle className="h-5 w-5" /> Send enquiry via WhatsApp</button>
        <p className="text-center text-xs text-muted-foreground">File uploads and email delivery will be enabled once the store backend is connected.</p>
      </form>
    </div>
  );
}
