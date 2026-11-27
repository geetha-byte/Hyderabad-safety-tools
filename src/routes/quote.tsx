
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/products";
import { submitLocalQuote } from "@/lib/local-quotes.functions";
import { downloadQuotePdf } from "@/lib/quote-pdf";

export const Route = createFileRoute("/quote")({
  validateSearch: (s: Record<string, unknown>): { product?: string } => {
  const product = s["product"];

  return typeof product === "string" ? { product } : {};
},
  head: () => ({
    meta: [
      { title: "Request a Bulk Quote – Hyderabad Safety Tools" },
      { name: "description", content: "Get bulk and corporate pricing on PPE and industrial safety equipment." },
    ],
  }),
  component: Quote,
});

const field =
  "h-12 w-full rounded-none border border-input bg-card px-4 text-sm outline-none focus:border-accent";

function Quote() {
  const { product } = Route.useSearch();
  const { cart } = useStore();
  const { data: products } = useSuspenseQuery(productsQueryOptions);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    mobile: "",
    notes: "",
  });

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedQuote, setSavedQuote] = useState("");

  const cartItems = cart
    .map((line) => {
      const p = products.find((item) => item.id === line.id);
      if (!p) return null;

      return {
        id: line.id,
        name: p.name,
        sku: p.sku,
        qty: line.qty,
        size: line.size,
        colour: line.colour,
      };
    })
    .filter((item) => item !== null);

  const selectedProduct = product
    ? products.find((p) => p.slug === product || p.name === product)
    : undefined;

  const items =
    cartItems.length > 0
      ? cartItems
      : selectedProduct
        ? [{
            id: selectedProduct.id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            qty: 1,
            size: undefined,
            colour: undefined,
          }]
        : [];

  useEffect(() => {
    setSavedQuote("");
  }, [cart]);

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value }));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setErr("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (items.length === 0) {
      setErr("Please add products to your cart before requesting a quote.");
      return;
    }

    try {
      setSaving(true);

      const result = await submitLocalQuote({
        data: {
          customerName: form.name,
          companyName: form.company,
          email: form.email,
          mobile: form.mobile,
          notes: form.notes,
          items: items.map((item) => ({
            id: item.id,
            qty: item.qty,
            ...(item.size ? { size: item.size } : {}),
            ...(item.colour ? { colour: item.colour } : {}),
          })),
        },
      });
      await downloadQuotePdf(result);
      setSavedQuote(result.id);
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : "Unable to submit your quotation request. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <section className="bg-hero border-b border-border py-16 text-foreground">
        <div className="container-x">
          <h1 className="text-4xl font-extrabold md:text-5xl">
            Request a Bulk Quote
          </h1>
          <p className="mt-3 max-w-xl opacity-80">
            Tell us what your team needs. We'll reply with pricing and availability.
          </p>
        </div>
      </section>

      <form
        onSubmit={send}
        className="container-x -mt-8 mb-20 grid max-w-3xl gap-5 rounded-none bg-card p-8 shadow-lift"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <input required minLength={2} placeholder="Full Name" className={field}
            value={form.name} onChange={set("name")} />
          <input placeholder="Company Name" className={field}
            value={form.company} onChange={set("company")} />
          <input required type="email" placeholder="Email" className={field}
            value={form.email} onChange={set("email")} />
          <input required inputMode="numeric" maxLength={10}
            placeholder="Mobile Number" className={field}
            value={form.mobile} onChange={set("mobile")} />
        </div>

        <div>
          <p className="mb-3 font-bold">Products requested</p>

          {items.length === 0 ? (
            <p className="rounded border border-border p-4 text-sm text-muted-foreground">
              Your cart is empty. Please add products before requesting a quote.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`}
                  className="flex items-start justify-between gap-3 border border-border p-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    {item.size && <p className="text-xs">Size: {item.size}</p>}
                    {item.colour && <p className="text-xs">Colour: {item.colour}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-semibold">Qty: {item.qty}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <textarea
          placeholder="Additional requirements"
          rows={4}
          className="w-full rounded-none border border-input bg-card p-4 text-sm outline-none focus:border-accent"
          value={form.notes}
          onChange={set("notes")}
        />

        {err && <p className="text-sm font-semibold text-destructive">{err}</p>}

        {savedQuote && (
          <div className="border border-green-600 p-4 text-sm">
            <p className="font-bold text-green-700">Quotation request submitted successfully!</p>
            <p className="mt-1">Reference: {savedQuote}</p>
            <p className="mt-1">Your request has been saved. We will contact you with the quotation.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || items.length === 0 || !!savedQuote}
          className="bg-accent-gradient flex items-center justify-center gap-2 rounded-none py-4 font-bold text-accent-foreground shadow-glow disabled:opacity-50"
        >
          <MessageCircle className="h-5 w-5" />
          {saving ? "Submitting..." : savedQuote ? "Request Submitted" : "Submit Quote Request"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Your cart products, quantities, sizes and colours are included automatically.
        </p>
      </form>
    </div>
  );
}
