import hero from "@/assets/hero.jpg";
import fire from "@/assets/fire.jpg";
import shoes from "@/assets/shoes.jpg";
import respirator from "@/assets/respirator.jpg";

export type Category = { slug: string; name: string; description: string; image: string; subs: string[] };
export type Product = {
  id: string; slug: string; name: string; sku: string; category: string; brand: string;
  description: string; price: number; salePrice?: number; gstRate: number;
  images: string[]; stock: number;
  sizes?: string[]; material: string; colour: string; features: string[];
  addedDays: number; sold: number;
  featured?: boolean; isDemo?: boolean; imagePaths?: string[];
  priceOnRequest?: boolean;
};
export const categories: Category[] = [
  { slug: "ppe", name: "Personal Protective Equipment", description: "Complete PPE kits for every worksite.", image: hero, subs: ["PPE Kits", "Coveralls", "Hi-Vis Vests"] },
  { slug: "head-protection", name: "Head Protection", description: "Helmets and hard hats.", image: hero, subs: ["Hard Hats", "Bump Caps"] },
  { slug: "eye-face", name: "Eye & Face Protection", description: "Goggles, visors and shields.", image: hero, subs: ["Goggles", "Face Shields"] },
  { slug: "hand-protection", name: "Hand Protection", description: "Gloves for cut, heat and chemicals.", image: hero, subs: ["Cut Resistant", "Leather", "Nitrile"] },
  { slug: "safety-shoes", name: "Safety Shoes & Footwear", description: "Steel-toe and anti-slip footwear.", image: shoes, subs: ["Steel Toe", "Gumboots"] },
  { slug: "respiratory", name: "Respiratory Protection", description: "Masks, respirators and filters.", image: respirator, subs: ["Half Face", "Disposable"] },
  { slug: "fire-safety", name: "Fire Safety Equipment", description: "Extinguishers, blankets and alarms.", image: fire, subs: ["Extinguishers", "Fire Blankets"] },
  { slug: "fall-protection", name: "Fall Protection Equipment", description: "Harnesses and lanyards.", image: hero, subs: ["Harnesses", "Lanyards"] },
  { slug: "electrical-safety", name: "Electrical Safety", description: "Insulated gloves, mats and tools.", image: hero, subs: ["Insulated Gloves", "Mats"] },
  { slug: "road-safety", name: "Road Safety Equipment", description: "Cones, barriers and reflectors.", image: hero, subs: ["Cones", "Barricades"] },
  { slug: "first-aid", name: "First Aid & Emergency", description: "Kits and emergency supplies.", image: hero, subs: ["First Aid Kits", "Eye Wash"] },
  { slug: "industrial-tools", name: "Industrial Safety Tools", description: "Non-sparking and safety tools.", image: hero, subs: ["Hand Tools", "Lockout"] },
  { slug: "lifting", name: "Lifting & Material Handling", description: "Slings, hoists and trolleys.", image: hero, subs: ["Slings", "Hoists"] },
  { slug: "signs", name: "Safety Signs & Accessories", description: "Signage and tapes.", image: hero, subs: ["Signs", "Tapes"] },
];

export const priceOf = (p: Product) => p.salePrice ?? p.price;
export const discountOf = (p: Product) => (!p.priceOnRequest && p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0);
export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const productPriceLabel = (p: Product) => p.priceOnRequest ? "Price on request" : inr(priceOf(p));
export const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
export const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "best";
export type Filters = { q?: string; cats?: string[]; brands?: string[]; inStock?: boolean; max?: number; sort?: SortKey };

export function filterProducts(list: Product[], f: Filters) {
  const q = f.q?.trim().toLowerCase();
  let r = list.filter((p) =>
    (!q || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q)) &&
    (!f.cats?.length || f.cats.includes(p.category)) &&
    (!f.brands?.length || f.brands.includes(p.brand)) &&
    (!f.inStock || p.stock > 0) &&
    (f.max == null || p.priceOnRequest || priceOf(p) <= f.max));
  const s = f.sort ?? "featured";
  r = [...r].sort((a, b) =>
    s === "price-asc" ? priceOf(a) - priceOf(b) :
    s === "price-desc" ? priceOf(b) - priceOf(a) :
    s === "newest" ? a.addedDays - b.addedDays :
    s === "best" ? b.sold - a.sold :
    Number(!!b.featured) - Number(!!a.featured));
  return r;
}
