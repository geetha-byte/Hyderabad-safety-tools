import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { inr, priceOf } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cartLineKey } from "@/lib/product-options";
import { productsQueryOptions } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart – Hyderabad Safety Tools" }, { name: "description", content: "Review the safety products in your cart." },
    { property: "og:title", content: "Cart – Hyderabad Safety Tools" }, { property: "og:description", content: "Review your cart." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Cart,
});

function Cart() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const { cart, setQty, remove } = useStore();
  const lines = cart.flatMap((l) => { const p = products.find((p) => p.id === l.id); return p ? [{ ...l, p }] : []; });
  const sub = lines.reduce((n, l) => n + priceOf(l.p) * l.qty, 0);
  const gst = Math.round(sub * 0.18);
  return (
    <div className="container-x py-12">
      <h1 className="mb-8 text-3xl font-extrabold">Shopping Cart</h1>
      {lines.length === 0 ? <div className="rounded-none bg-card p-16 text-center"><p className="text-muted-foreground">Your cart is empty.</p><Link to="/shop" className="mt-4 inline-block rounded-none bg-accent px-6 py-3 font-bold text-accent-foreground">Start shopping</Link></div> : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">{lines.map((l) => (
            <div key={cartLineKey(l)} className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-4 rounded-none border border-border bg-card p-4 sm:flex">
              <img src={l.p.images[0]} alt="" className="h-20 w-20 rounded-none bg-product-surface object-contain p-2" />
              <div className="min-w-0 flex-1"><Link to="/product/$slug" params={{ slug: l.p.slug }} className="font-bold hover:text-accent">{l.p.name}</Link><p className="text-sm text-muted-foreground">{l.size ? `Size ${l.size} · ` : ""}{l.colour ? `Colour ${l.colour} · ` : ""}{inr(priceOf(l.p))}</p></div>
              <div className="col-start-1 row-start-2 flex w-fit items-center rounded-none border border-border"><button aria-label="Decrease" onClick={() => setQty(l.id, l.size, l.qty - 1, l.colour)} className="p-2"><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-bold">{l.qty}</span><button aria-label="Increase" onClick={() => setQty(l.id, l.size, l.qty + 1, l.colour)} className="p-2"><Plus className="h-4 w-4" /></button></div>
              <p className="col-span-2 col-start-2 row-start-2 text-right font-bold sm:w-24">{inr(priceOf(l.p) * l.qty)}</p>
              <button aria-label="Remove" onClick={() => remove(l.id, l.size, l.colour)} className="col-start-3 row-start-1 p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-5 w-5" /></button>
            </div>))}</div>
          <aside className="h-fit rounded-none border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
            <dl className="space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(sub)}</dd></div><div className="flex justify-between"><dt>GST (18%, estimated)</dt><dd>{inr(gst)}</dd></div><div className="flex justify-between text-muted-foreground"><dt>Shipping</dt><dd>At checkout</dd></div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-extrabold"><dt>Total</dt><dd>{inr(sub + gst)}</dd></div></dl>
            <button disabled className="mt-6 w-full rounded-none bg-accent py-3.5 font-bold text-accent-foreground opacity-50">Checkout — coming soon</button>
            <p className="mt-3 text-xs text-muted-foreground">Online payment isn't connected yet. Use a bulk quote or WhatsApp to place an order.</p>
            <Link to="/quote" className="mt-3 block w-full rounded-none border border-border py-3 text-center font-semibold">Request a quote for this cart</Link>
          </aside>
        </div>)}
    </div>
  );
}
