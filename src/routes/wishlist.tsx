import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/site/ProductCard";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQueryOptions } from "@/lib/products";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist – Hyderabad Safety Tools" }, { name: "description", content: "Your saved safety products." },
    { property: "og:title", content: "Wishlist – Hyderabad Safety Tools" }, { property: "og:description", content: "Your saved safety products." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => {
    const { data: products } = useSuspenseQuery(productsQueryOptions);
    const { wishlist } = useStore();
    const items = products.filter((p) => wishlist.includes(p.id));
    return (
      <div className="container-x py-12">
        <h1 className="mb-8 text-3xl font-extrabold">Wishlist</h1>
        {items.length === 0 ? <p className="rounded-none bg-card p-16 text-center text-muted-foreground">Nothing saved yet. <Link to="/shop" className="font-bold text-accent">Browse products</Link></p>
          : <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    );
  },
});
