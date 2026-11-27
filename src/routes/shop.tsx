import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Grid2X2, List, SlidersHorizontal, X } from "lucide-react";
import { categoryName, filterProducts, type SortKey } from "@/lib/catalog";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLocalCategories } from "@/lib/local-categories.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/products";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; cat?: string | undefined } => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    cat: typeof s["cat"] === "string" && s["cat"] ? s["cat"] : undefined,
  }),
  head: () => ({ meta: [
    { title: "Shop All Safety Products – Hyderabad Safety Tools" },
    { name: "description", content: "Browse PPE, fire safety, safety shoes and respiratory protection with filters by brand, price and availability." },
    { property: "og:title", content: "Shop Safety Products – Hyderabad Safety Tools" },
    { property: "og:description", content: "Filter and shop industrial safety equipment online." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Shop,
});

const PER_PAGE = 9;

function Shop() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const fetchCategories = useServerFn(listLocalCategories);
const { data: categories = [] } = useQuery({
  queryKey: ["storefront-categories"],
  queryFn: () => fetchCategories(),
});
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const { q: q0, cat } = Route.useSearch();
  const [q, setQ] = useState(q0 ?? "");
  const [cats, setCats] = useState<string[]>(cat ? [cat] : []);
  const [bs, setBs] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [max, setMax] = useState(6000);
  const [sort, setSort] = useState<SortKey>("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [shown, setShown] = useState(PER_PAGE);
  const [drawer, setDrawer] = useState(false);
  const [lastKey, setLastKey] = useState(`${q0}|${cat}`);
  if (`${q0}|${cat}` !== lastKey) { setLastKey(`${q0}|${cat}`); setQ(q0 ?? ""); setCats(cat ? [cat] : []); }

  const list = useMemo(() => filterProducts(products, { q, cats, brands: bs, inStock, max, sort }), [products, q, cats, bs, inStock, max, sort]);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clear = () => { setQ(""); setCats([]); setBs([]); setInStock(false); setMax(6000); };
  const chips = [...cats.map((c) => ({ l: categoryName(c), x: () => toggle(cats, setCats, c) })), ...bs.map((b) => ({ l: b, x: () => toggle(bs, setBs, b) })),
    ...(inStock ? [{ l: "In stock", x: () => setInStock(false) }] : []), ...(max < 6000 ? [{ l: `Under ₹${max}`, x: () => setMax(6000) }] : []), ...(q ? [{ l: `"${q}"`, x: () => setQ("") }] : [])];

  const filters = (
    <div className="space-y-7">
      <div><h3 className="mb-3 font-bold">Category</h3><div className="max-h-72 space-y-2 overflow-y-auto pr-2">{categories.map((c) => (
        <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="accent-accent" checked={cats.includes(c.slug)} onChange={() => toggle(cats, setCats, c.slug)} />{c.name}</label>))}</div></div>
      <div><h3 className="mb-3 font-bold">Brand</h3><div className="space-y-2">{brands.map((b) => (
        <label key={b} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="accent-accent" checked={bs.includes(b)} onChange={() => toggle(bs, setBs, b)} />{b}</label>))}</div></div>
      <div><h3 className="mb-3 font-bold">Max price: ₹{max}</h3><input type="range" min={200} max={6000} step={100} value={max} onChange={(e) => setMax(+e.target.value)} className="w-full accent-accent" /></div>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-accent" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only</label>
    </div>
  );

  return (
    <div className="container-x py-6">
      <nav className="mb-4 text-sm text-muted-foreground"><Link to="/" className="hover:text-accent">Home</Link> / Shop</nav>
      <h1 className="mb-6 text-2xl font-bold">{cats.length === 1 ? categoryName(cats[0] ?? "") : "All Safety Products"}</h1>
      <div className="flex gap-8">
        <aside className="sticky top-24 hidden h-fit w-48 shrink-0 border-r border-border pr-4 lg:block">{filters}</aside>
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button onClick={() => setDrawer(true)} className="flex items-center gap-2 rounded-none border border-border bg-card px-4 py-2.5 text-sm font-semibold lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in results…" className="h-11 min-w-0 flex-1 rounded-none border border-input bg-card px-4 text-sm outline-none focus:border-accent" />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort" className="h-11 rounded-none border border-input bg-card px-3 text-sm">
              <option value="featured">Featured</option><option value="best">Best Selling</option><option value="newest">Newest First</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option>
            </select>
            <div className="flex rounded-none border border-border bg-card p-1">
              <button aria-label="Grid view" onClick={() => setView("grid")} className={`rounded-none p-2 ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`}><Grid2X2 className="h-4 w-4" /></button>
              <button aria-label="List view" onClick={() => setView("list")} className={`rounded-none p-2 ${view === "list" ? "bg-primary text-primary-foreground" : ""}`}><List className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{list.length} products</span>
            {chips.map((c) => <button key={c.l} onClick={c.x} className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 font-medium text-accent">{c.l} <X className="h-3 w-3" /></button>)}
            {chips.length > 0 && <button onClick={clear} className="font-semibold underline">Clear all</button>}
          </div>
          {list.length === 0 ? <p className="rounded-none bg-card p-12 text-center text-muted-foreground">No products match these filters.</p> : (
            <div className={view === "grid" ? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-4"}>
              {list.slice(0, shown).map((p) => <ProductCard key={p.id} p={p} list={view === "list"} />)}
            </div>)}
          {shown < list.length && <div className="mt-10 text-center"><button onClick={() => setShown(shown + PER_PAGE)} className="rounded-none bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-accent">Load more</button></div>}
        </div>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-50 bg-foreground/40 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="ml-auto h-full w-80 overflow-y-auto bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex justify-between"><h2 className="text-lg font-bold">Filters</h2><button aria-label="Close filters" onClick={() => setDrawer(false)}><X /></button></div>
            {filters}
            <button onClick={() => setDrawer(false)} className="mt-8 w-full rounded-none bg-accent py-3 font-bold text-accent-foreground">Show {list.length} results</button>
          </div>
        </div>)}
    </div>
  );
}
