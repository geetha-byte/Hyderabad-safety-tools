import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Grid2X2, ShieldCheck } from "lucide-react";
import worker from "@/assets/worker-navy.jpg";
import fire from "@/assets/fire.jpg";
import hero from "@/assets/hero.jpg";
import { categories } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { categoryIcons } from "@/components/site/CategoryNav";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Hyderabad Safety Tools – PPE, Fire Safety & Industrial Safety Equipment" },
    { name: "description", content: "Shop premium PPE, fire safety, safety shoes and industrial safety tools. Bulk orders welcome, delivery across India." },
    { property: "og:title", content: "Hyderabad Safety Tools – Your Complete Partner in Industrial Safety" },
    { property: "og:description", content: "Premium safety equipment, industrial protection and workplace solutions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

const banners = [
  { image: worker, title: "Hyderabad Safety Tools", text: "Personal protection. Workplace safety. Everything you need.", cat: "ppe", position: "object-right" },
  { image: fire, title: "Fire Safety Equipment", text: "Extinguishers and emergency essentials for your workplace.", cat: "fire-safety", position: "object-center" },
  { image: hero, title: "Personal Protective Equipment", text: "Safety essentials for your team, from head to toe.", cat: "ppe", position: "object-center" },
];

function Home() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const [slide, setSlide] = useState(0);
  const banner = banners[slide] ?? banners[0];
  if (!banner) return null;
  const groups = categories.map((category) => ({ category, products: products.filter((p) => p.category === category.slug) })).filter((group) => group.products.length > 0);
  return <div className="px-4 pb-10 pt-4 md:px-6">
    <section aria-label="Featured safety products" className="relative h-56 overflow-hidden rounded-lg bg-navy-deep text-navy-deep-foreground md:h-72">
      <img src={banner.image} alt={banner.title} className={`absolute inset-0 h-full w-full object-cover ${banner.position}`} />
      <div className="absolute inset-0 bg-navy-deep/35" /><div className="absolute inset-y-0 left-0 w-3/4 bg-navy-deep/70 md:w-1/2" />
      <div className="relative flex h-full max-w-lg flex-col justify-center px-6 md:px-10"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Industrial safety supplies</p><h1 className="text-2xl font-bold leading-tight md:text-4xl">{banner.title}</h1><p className="mt-3 max-w-xs text-sm text-navy-deep-muted">{banner.text}</p><Button asChild className="mt-5 w-fit rounded-md bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/shop" search={{ cat: banner.cat }}>Explore Products<ArrowRight className="h-4 w-4" /></Link></Button></div>
      <div className="absolute bottom-3 right-3 flex gap-2"><Button size="icon" variant="outline" aria-label="Previous banner" onClick={() => setSlide((slide + banners.length - 1) % banners.length)} className="h-8 w-8 rounded-md border-navy-deep-foreground/30 bg-navy-deep/80 text-navy-deep-foreground"><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="outline" aria-label="Next banner" onClick={() => setSlide((slide + 1) % banners.length)} className="h-8 w-8 rounded-md border-navy-deep-foreground/30 bg-navy-deep/80 text-navy-deep-foreground"><ChevronRight className="h-4 w-4" /></Button></div>
    </section>
    <section aria-labelledby="category-heading" className="py-6"><h2 id="category-heading" className="mb-4 flex items-center gap-2 text-xl font-bold"><Grid2X2 className="h-5 w-5 text-accent" />Categories</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3 xl:grid-cols-5">{categories.map((category) => {
        const product = products.find((p) => p.category === category.slug);
        const Icon = categoryIcons[category.slug] ?? ShieldCheck;
        return <Link key={category.slug} to="/shop" search={{ cat: category.slug }} className="group flex min-h-32 flex-col items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-2 py-3 text-center transition-colors hover:border-accent hover:bg-accent/10 md:min-h-36 md:p-4">
          {product?.images[0] ? <img src={product.images[0]} alt="" loading="lazy" className="h-16 w-20 rounded-md object-contain mix-blend-multiply md:h-20 md:w-24" /> : <div className="grid h-16 place-items-center md:h-20"><Icon className="h-10 w-10 text-primary" /></div>}<span className="text-[11px] font-semibold leading-snug md:text-xs">{category.name}</span>
        </Link>;
      })}</div>
    </section>
    {groups.map(({ category, products: items }) => <section key={category.slug} className="border-t border-border py-6"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold md:text-xl">{category.name}</h2><Button asChild variant="link" className="h-auto shrink-0 p-0 text-xs text-primary"><Link to="/shop" search={{ cat: category.slug }}>View All<ArrowRight className="h-3 w-3" /></Link></Button></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{items.slice(0, 4).map((product) => <ProductCard key={product.id} p={product} />)}</div></section>)}
  </div>;
}
