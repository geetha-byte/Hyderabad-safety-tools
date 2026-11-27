import * as z from "zod";
export const productInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  sku: z.string().trim().min(2).max(60),
  category: z.string().trim().min(2).max(80),
  brand: z.string().trim().min(2).max(80),
  description: z.string().trim().min(10).max(3000),
  price: z.number().nonnegative().max(100000000),
  priceOnRequest: z.boolean().optional(),
  gstRate: z.number().min(0).max(100).default(18),
  salePrice: z.number().nonnegative().max(100000000).nullable(),
  images: z.array(z.string().min(1)).min(1).max(8),
  stock: z.number().int().nonnegative().max(100000000),
  sizes: z.array(z.string().trim().min(1).max(30)).max(30),
  material: z.string().trim().max(120),
  colour: z.string().trim().max(80),
  features: z.array(z.string().trim().min(1).max(200)).max(30),
  addedDays: z.number().int().nonnegative().max(100000),
  sold: z.number().int().nonnegative().max(100000000),
  featured: z.boolean(),
}).refine((value) => value.salePrice === null || value.salePrice <= value.price, {
  message: "Sale price must not be higher than the regular price",
  path: ["salePrice"],
});

export type ProductInput = z.infer<typeof productInput>;

