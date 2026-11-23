import { createFileRoute, Link } from "@tanstack/react-router";

const docs = {
  shipping: { t: "Shipping & Returns", b: "We deliver across India. Shipping charges and timelines are shown at checkout. Contact us within 7 days of delivery for damaged or incorrect items." },
  privacy: { t: "Privacy Policy", b: "We only use your details to process enquiries and orders. We never sell your personal information." },
  terms: { t: "Terms & Conditions", b: "Prices and availability may change without notice. Product images are representative. Bulk pricing is subject to written quotation." },
} as const;
type Key = keyof typeof docs;

export const Route = createFileRoute("/policies")({
  validateSearch: (s: Record<string, unknown>): { p?: Key | undefined } => { const v = s["p"]; return { p: v === "privacy" || v === "terms" || v === "shipping" ? v : undefined }; },
  head: () => ({ meta: [{ title: "Policies – Hyderabad Safety Tools" }, { name: "description", content: "Shipping, returns, privacy and terms." },
    { property: "og:title", content: "Policies – Hyderabad Safety Tools" }, { property: "og:description", content: "Shipping, returns, privacy and terms." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => {
    const { p = "shipping" } = Route.useSearch();
    return (
      <div className="container-x max-w-3xl py-16">
        <div className="mb-8 flex flex-wrap gap-2">{(Object.keys(docs) as Key[]).map((k) => <Link key={k} to="/policies" search={{ p: k }} className={`rounded-full px-4 py-2 text-sm font-semibold ${k === p ? "bg-primary text-primary-foreground" : "bg-card"}`}>{docs[k].t}</Link>)}</div>
        <h1 className="text-3xl font-extrabold">{docs[p].t}</h1><p className="mt-4 leading-relaxed text-muted-foreground">{docs[p].b}</p>
        <p className="mt-6 text-xs text-muted-foreground">Draft text — replace with your final policy.</p>
      </div>
    );
  },
});
