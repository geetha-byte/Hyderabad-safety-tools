import { queryOptions } from "@tanstack/react-query";
import { listPublicProducts } from "@/lib/products.functions";

export const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => listPublicProducts(),
  staleTime: 30_000,
});
