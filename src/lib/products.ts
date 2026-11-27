import { queryOptions } from "@tanstack/react-query";
import { listLocalProducts } from "@/lib/local-products.functions";

export const productsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => listLocalProducts(),
  staleTime: 30_000,
});
