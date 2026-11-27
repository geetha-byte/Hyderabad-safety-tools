import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Grid2X2, HardHat, ShieldCheck, Glasses, Hand, Footprints, Wind, Flame, Anchor, Zap, TrafficCone, HeartPulse, Wrench, Forklift, Signpost, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLocalCategories } from "@/lib/local-categories.functions";
export const categoryIcons: Record<string, LucideIcon> = {
  ppe: ShieldCheck, "head-protection": HardHat, "eye-face": Glasses,
  "hand-protection": Hand, "safety-shoes": Footprints, respiratory: Wind,
  "fire-safety": Flame, "fall-protection": Anchor, "electrical-safety": Zap,
  "road-safety": TrafficCone, "first-aid": HeartPulse, "industrial-tools": Wrench,
  lifting: Forklift, signs: Signpost,
};

export function CategoryNav({ onSelect }: { onSelect?: () => void }) {
  const location = useLocation();
  const fetchCategories = useServerFn(listLocalCategories);
  const { data: categories = [] } = useQuery({
    queryKey: ["storefront-categories"],
    queryFn: () => fetchCategories(),
  });
  const selected = new URLSearchParams(location.searchStr).get("cat");
  return <nav aria-label="Product categories">
    <Link to="/shop" onClick={onSelect} className="flex h-12 items-center gap-3 bg-primary px-4 text-sm font-bold text-primary-foreground"><Grid2X2 className="h-4 w-4" />All Categories</Link>
    <div className="py-2">{categories.map((category) => {
      const Icon = categoryIcons[category.slug] ?? ShieldCheck;
      return <Link key={category.slug} to="/shop" search={{ cat: category.slug }} onClick={onSelect} className={`flex min-h-11 items-center gap-3 border-l-2 px-3 py-2.5 text-xs font-semibold transition-colors ${selected === category.slug ? "border-accent bg-accent/10 text-primary" : "border-transparent hover:bg-muted"}`}>
        <Icon className="h-4 w-4 shrink-0 text-accent" /><span className="flex-1 leading-relaxed">{category.name}</span><ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
      </Link>;
    })}</div>
  </nav>;
}
