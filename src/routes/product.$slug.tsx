import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoryName, discountOf, inr, priceOf, productPriceLabel } from "@/lib/catalog";
import { useStore, WHATSAPP } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { colourOptions } from "@/lib/product-options";
import { ProductCard } from "@/components/site/ProductCard";
import { productsQueryOptions } from "@/lib/products";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const products = await context.queryClient.ensureQueryData(productsQueryOptions);
    const product = products.find((item) => item.slug === params.slug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData: p }) => {
    const image = p?.images[0]?.startsWith("https://") ? p.images[0] : undefined;
    return { meta: p ? [
      { title: `${p.name} – Hyderabad Safety Tools` }, { name: "description", content: p.description },
      { property: "og:title", content: p.name }, { property: "og:description", content: p.description }, { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
    ] : [{ title: "Product unavailable" }, { name: "robots", content: "noindex" }],
      scripts: p ? [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, brand: p.brand, description: p.description,
        ...(!p.priceOnRequest ? { offers: { "@type": "Offer", priceCurrency: "INR", price: priceOf(p), availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } } : {}) }) }] : [] };
  },
  notFoundComponent: () => <div className="container-x py-24 text-center"><h1 className="text-2xl font-bold">Product not found</h1><Link to="/shop" className="mt-4 inline-block text-accent">Back to shop</Link></div>,
  component: ProductPage,
});

function ProductPage() {
  const p = Route.useLoaderData();
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const { add, toggleWish, wishlist } = useStore();
  const nav = useNavigate();
  const [size, setSize] = useState(p.sizes?.[0]);
  const colours = colourOptions(p);
  const [colour, setColour] = useState(colours[0]);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).concat(products.filter((x) => x.category !== p.category && x.id !== p.id)).slice(0, 4);
  const out = p.stock === 0;
  return (
    <div className="container-x py-10">
      <nav className="mb-6 text-sm text-muted-foreground"><Link to="/" className="hover:text-accent">Home</Link> / <Link to="/shop" search={{ cat: p.category }} className="hover:text-accent">{categoryName(p.category)}</Link> / {p.name}</nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="min-w-0"><div className="relative aspect-square overflow-hidden border border-border bg-product-surface">
          <img src={p.images[imageIndex] ?? p.images[0]} alt={p.name} className="h-full w-full object-contain p-6 md:p-8" />
          {discountOf(p) > 0 && <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">-{discountOf(p)}%</span>}
        </div>{p.images.length > 1 && <div className="mt-3 flex flex-wrap gap-2">{p.images.map((image, index) => <Button key={image} variant="outline" aria-label={`View product photo ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)} className={`h-20 w-20 bg-product-surface p-2 ${imageIndex === index ? "border-accent" : "border-border"}`}><img src={image} alt="" className="h-full w-full object-contain" /></Button>)}</div>}</div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-accent">{p.brand}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">{p.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">SKU: {p.sku} {p.isDemo && <>· <span className="rounded bg-muted px-1.5">Demo product</span></>}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-extrabold">{productPriceLabel(p)}</span>{!p.priceOnRequest && p.salePrice && <span className="text-xl text-muted-foreground line-through">{inr(p.price)}</span>}</div>
          {!p.priceOnRequest && <p className="text-xs text-muted-foreground">Prices shown exclude GST</p>}
          <p className={`mt-3 font-semibold ${p.priceOnRequest ? "text-muted-foreground" : out ? "text-destructive" : "text-success"}`}>{p.priceOnRequest ? "Availability on enquiry" : out ? "Out of stock" : `In stock (${p.stock} available)`}</p>
          <p className="mt-6 leading-relaxed text-muted-foreground">{p.description}</p>
          {p.sizes && p.sizes.length > 0 && <div className="mt-6"><p className="mb-2 font-bold">Size</p><div className="flex flex-wrap gap-2">{p.sizes.map((s) => (
            <Button type="button" variant="outline" key={s} aria-pressed={size === s} onClick={() => setSize(s)} className={`min-w-12 rounded-none border px-4 py-2 font-semibold ${size === s ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}>{s}</Button>))}</div></div>}
          {colours.length > 0 && <div className="mt-6"><p className="mb-2 font-bold">Colour</p><div className="flex flex-wrap gap-2">{colours.map((c) => (
            <Button type="button" variant="outline" key={c} aria-pressed={colour === c} onClick={() => { setColour(c); if (p.images.length === colours.length) setImageIndex(colours.indexOf(c)); }} className={`min-w-12 rounded-none border px-4 py-2 font-semibold ${colour === c ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}>{c}</Button>))}</div></div>}
          {p.priceOnRequest ? <Button asChild className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/quote" search={{ product: `${p.name}${size ? ` · Size ${size}` : ""}${colour ? ` · Colour ${colour}` : ""}` }}><MessageCircle />Request price</Link></Button> : <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-none border border-border bg-card">
              <button aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))} className="p-3"><Minus className="h-4 w-4" /></button><span className="w-10 text-center font-bold">{qty}</span>
              <button aria-label="Increase" onClick={() => setQty(qty + 1)} className="p-3"><Plus className="h-4 w-4" /></button>
            </div>
            <button disabled={out} onClick={() => { add(p.id, qty, size, colour); toast.success("Added to cart"); }} className="flex flex-1 items-center justify-center gap-2 rounded-none bg-primary px-6 py-3.5 font-bold text-primary-foreground hover:bg-accent disabled:opacity-40"><ShoppingCart className="h-5 w-5" /> Add to Cart</button>
            <button disabled={out} onClick={() => { add(p.id, qty, size, colour); nav({ to: "/cart" }); }} className="bg-accent-gradient flex-1 rounded-none px-6 py-3.5 font-bold text-accent-foreground shadow-glow disabled:opacity-40">Buy Now</button>
          </div>
          </>}
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <button onClick={() => toggleWish(p.id)} className="flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2.5"><Heart className={`h-4 w-4 ${wishlist.includes(p.id) ? "fill-accent text-accent" : ""}`} /> Wishlist</button>
            <a href={`${WHATSAPP}?text=${encodeURIComponent(`Enquiry: ${p.name} (${p.sku})${size ? ` · Size: ${size}` : ""}${colour ? ` · Colour: ${colour}` : ""}`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2.5"><MessageCircle className="h-4 w-4 text-success" /> WhatsApp Enquiry</a>
            <Link to="/quote" search={{ product: p.name }} className="rounded-none border border-border bg-card px-4 py-2.5">Request Bulk Quote</Link>
          </div>
          <div className="mt-8 grid gap-6 rounded-none border border-border bg-card p-6 sm:grid-cols-2">
            <div><h2 className="mb-2 font-bold">Features</h2><ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">{p.features.map((f) => <li key={f}>{f}</li>)}</ul></div>
            <div><h2 className="mb-2 font-bold">Specifications</h2><dl className="space-y-1 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Material</dt><dd>{p.material}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Colours</dt><dd className="max-w-[60%] text-right">{colours.join(", ") || "—"}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Category</dt><dd>{categoryName(p.category)}</dd></div></dl></div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2"><Truck className="h-4 w-4 text-accent" /> Delivery across India. Shipping charges calculated at checkout.</p>
          </div>
        </div>
      </div>
      <section className="mt-20"><h2 className="mb-8 text-2xl font-extrabold">Related Products</h2><div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>
    </div>
  );
}
