import { createContext, useContext } from "react";
import type { CartLine } from "@/lib/product-options";

export type Store = {
  cart: CartLine[]; wishlist: string[];
  add: (id: string, qty?: number, size?: string, colour?: string) => void;
  setQty: (id: string, size: string | undefined, qty: number, colour?: string) => void;
  remove: (id: string, size?: string, colour?: string) => void;
  toggleWish: (id: string) => void;
  count: number;
};

// Keep context identity outside the hot-reloaded provider/component module.
export const StoreContext = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore outside provider");
  return store;
}