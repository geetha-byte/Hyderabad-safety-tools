import type { Product } from "@/lib/catalog";

export function colourOptions(product: Pick<Product, "colour">): string[] {
  return [...new Set(product.colour.split(",").map((value) => value.trim()).filter(Boolean))];
}

export type CartLine = { id: string; qty: number; size?: string | undefined; colour?: string | undefined };

export const cartLineKey = (line: Pick<CartLine, "id" | "size" | "colour">) => JSON.stringify([line.id, line.size ?? null, line.colour ?? null]);

export function addCartLine(lines: CartLine[], line: CartLine): CartLine[] {
  const key = cartLineKey(line);
  return lines.some((item) => cartLineKey(item) === key)
    ? lines.map((item) => cartLineKey(item) === key ? { ...item, qty: item.qty + line.qty } : item)
    : [...lines, line];
}