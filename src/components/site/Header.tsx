import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Menu, MessageCircle, Search, ShieldCheck, ShoppingCart, X } from "lucide-react";
import { useStore, WHATSAPP } from "@/lib/store";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { CategoryNav } from "@/components/site/CategoryNav";

export function Logo() {
  return <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Hyderabad Safety Tools home"><span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground"><ShieldCheck className="h-6 w-6" /></span><span className="leading-tight"><span className="block text-base font-bold">Hyderabad</span><span className="block text-[10px] font-bold uppercase tracking-widest text-accent">Safety Tools</span></span></Link>;
}

function SearchBox() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const hits = q.length > 1 ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  return <form className="relative w-full" onSubmit={(event) => { event.preventDefault(); setOpen(false); navigate({ to: "/shop", search: { q } }); }}>
    <input value={q} onChange={(event) => { setQ(event.target.value); setOpen(true); }} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Search safety products…" aria-label="Search products" className="h-10 w-full rounded-md border border-input bg-background pl-3 pr-12 text-sm outline-none focus:border-accent" />
    <Button type="submit" size="icon" aria-label="Search" className="absolute right-0 top-0 h-10 w-11 rounded-l-none rounded-r-md bg-primary text-primary-foreground"><Search className="h-4 w-4" /></Button>
    {open && hits.length > 0 && <div className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-md border border-border bg-popover shadow-card">{hits.map((p) => <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} className="flex items-center gap-3 px-3 py-2 hover:bg-muted"><img src={p.images[0]} alt="" className="h-10 w-10 bg-product-surface object-contain p-1" /><span className="text-sm">{p.name}</span></Link>)}</div>}
  </form>;
}

export function Header() {
  const { count, wishlist } = useStore();
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  return <header className="sticky top-0 z-40 border-b border-border bg-card shadow-card">
    <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:h-20 lg:flex-nowrap lg:gap-5 lg:py-0">
      <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMobile(true)} className="h-9 w-9 lg:hidden"><Menu /></Button><Logo />
      <div className="order-last w-full lg:order-none lg:min-w-40 lg:max-w-md lg:flex-1"><SearchBox /></div>
      <nav aria-label="Main navigation" className="hidden items-center gap-5 text-xs font-semibold lg:flex">
        <Link to="/" className={location.pathname === "/" ? "text-accent" : "hover:text-accent"}>Home</Link><Link to="/shop" className="hover:text-accent">All Products</Link><Link to="/wishlist" className="whitespace-nowrap hover:text-accent">Saved Products</Link>
      </nav>
      <Button asChild className="ml-auto hidden rounded-md bg-accent text-accent-foreground hover:bg-accent/90 xl:inline-flex"><Link to="/quote"><MessageCircle className="h-4 w-4" />Bulk Quote</Link></Button>
      <div className="ml-auto flex shrink-0 gap-1 lg:ml-0">
        <Button asChild variant="ghost" size="icon" className="relative" aria-label="Wishlist"><Link to="/wishlist"><Heart className="h-5 w-5" />{wishlist.length > 0 && <Badge n={wishlist.length} />}</Link></Button>
        <Button asChild variant="ghost" size="icon" className="relative" aria-label="Cart"><Link to="/cart"><ShoppingCart className="h-5 w-5" />{count > 0 && <Badge n={count} />}</Link></Button>
      </div>
    </div>
    {mobile && <div className="fixed inset-0 z-50 bg-foreground/40 lg:hidden" onClick={() => setMobile(false)}><aside className="h-full w-[min(320px,90vw)] overflow-y-auto bg-card" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between p-4"><Logo /><Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMobile(false)}><X /></Button></div><div className="flex gap-4 border-y border-border p-4 text-sm font-semibold"><Link to="/" onClick={() => setMobile(false)}>Home</Link><Link to="/quote" onClick={() => setMobile(false)} className="text-accent">Bulk Quote</Link><a href={WHATSAPP} target="_blank" rel="noreferrer">Contact</a></div><CategoryNav onSelect={() => setMobile(false)} /></aside></div>}
  </header>;
}
function Badge({ n }: { n: number }) {
  return <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{n}</span>;
}
