import { useEffect, useState, type ReactNode } from "react";

import { addCartLine, cartLineKey, type CartLine } from "@/lib/product-options";
export type { CartLine } from "@/lib/product-options";
import { StoreContext, type Store } from "@/lib/store-context";
export { useStore } from "@/lib/store-context";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWish] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("hst-cart") || "[]"));
      setWish(JSON.parse(localStorage.getItem("hst-wish") || "[]"));
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("hst-cart", JSON.stringify(cart)); }, [cart, ready]);
  useEffect(() => { if (ready) localStorage.setItem("hst-wish", JSON.stringify(wishlist)); }, [wishlist, ready]);
  const same = (l: CartLine, id: string, size?: string, colour?: string) => cartLineKey(l) === cartLineKey({ id, size, colour });
  const value: Store = {
    cart, wishlist,
    add: (id, qty = 1, size, colour) => setCart((c) => addCartLine(c, { id, qty, size, colour })),
    setQty: (id, size, qty, colour) => setCart((c) => c.map((l) => same(l, id, size, colour) ? { ...l, qty: Math.max(1, qty) } : l)),
    remove: (id, size, colour) => setCart((c) => c.filter((l) => !same(l, id, size, colour))),
    toggleWish: (id) => setWish((w) => w.includes(id) ? w.filter((x) => x !== id) : [...w, id]),
    count: cart.reduce((n, l) => n + l.qty, 0),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export const WHATSAPP = "https://wa.me/910000000000"; // placeholder until real number is provided
