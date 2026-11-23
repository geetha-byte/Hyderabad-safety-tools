import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { type Product, inr, productPriceLabel, discountOf } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { colourOptions } from "@/lib/product-options";
import { useStore } from "@/lib/store";

export function ProductCard({ p, list = false }: { p: Product; list?: boolean }) {
  const { add, toggleWish, wishlist } = useStore();
  const wished = wishlist.includes(p.id);
  const d = discountOf(p);
  const navigate = useNavigate();
  const colours = colourOptions(p);
  const hasOptions = Boolean(p.sizes?.length || colours.length > 1);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
      className={`group relative flex overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-card ${list ? "flex-row" : "flex-col"}`}>
      <Link to="/product/$slug" params={{ slug: p.slug }} className={`relative block overflow-hidden bg-product-surface ${list ? "w-32 shrink-0 sm:w-48" : "aspect-[4/3]"}`}>
        <img src={p.images[0]} alt={p.name} loading="lazy" width={720} height={720} className="h-full w-full object-contain p-3" />
        {d > 0 && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">-{d}%</span>}
      </Link>
      <Button variant="ghost" size="icon" aria-label="Toggle wishlist" onClick={() => toggleWish(p.id)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 shadow-card">
        <Heart className={`h-4 w-4 ${wished ? "fill-accent text-accent" : "text-foreground"}`} />
      </Button>
      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <p className="text-xs font-medium text-muted-foreground">Brand: {p.brand}</p>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug hover:text-accent">{p.name}</Link>
        {!!p.sizes?.length && <p className="text-xs text-muted-foreground">Sizes: {p.sizes.join(", ")}</p>}
        {colours.length > 1 && <p className="text-xs text-muted-foreground">Colours: {colours.join(", ")}</p>}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-extrabold">{productPriceLabel(p)}</span>
          {!p.priceOnRequest && p.salePrice && <span className="text-sm text-muted-foreground line-through">{inr(p.price)}</span>}
        </div>
        <p className={`text-xs font-medium ${p.priceOnRequest ? "text-muted-foreground" : p.stock > 0 ? "text-success" : "text-destructive"}`}>{p.priceOnRequest ? "Availability on enquiry" : p.stock > 0 ? "In stock" : "Out of stock"}</p>
        <Button disabled={!p.priceOnRequest && p.stock === 0} onClick={() => { if (hasOptions || p.priceOnRequest) { navigate({ to: "/product/$slug", params: { slug: p.slug } }); return; } add(p.id, 1, undefined, colours[0]); toast.success("Added to cart", { description: p.name }); }}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-2 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40">
          <ShoppingCart className="hidden h-4 w-4 sm:block" /> {hasOptions ? "Choose options" : p.priceOnRequest ? "View product" : "Add to Cart"}
        </Button>
      </div>
    </motion.div>
  );
}
