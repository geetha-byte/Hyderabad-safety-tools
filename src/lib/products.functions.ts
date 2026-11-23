import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify, type Product } from "@/lib/catalog";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

import { productInput, type ProductInput } from "@/lib/product-input";
export { productInput, type ProductInput } from "@/lib/product-input";
import { parseProductCsv, findImportDuplicates } from "@/lib/product-csv";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

async function withSignedImages(rows: ProductRow[]): Promise<Product[]> {
  const paths = Array.from(new Set(rows.flatMap((row) => row.images).filter((image) => !image.startsWith("/") && !image.startsWith("http"))));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage.from("product-images").createSignedUrls(paths, 60 * 60 * 24 * 7);
    if (error) throw error;
    data.forEach((item) => { if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl); });
  }
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    description: row.description,
    price: Number(row.price),
    priceOnRequest: row.price_on_request,
    ...(row.sale_price === null ? {} : { salePrice: Number(row.sale_price) }),
    images: row.images.map((image) => signed.get(image) ?? image),
    stock: row.stock,
    sizes: row.sizes,
    material: row.material,
    colour: row.colour,
    features: row.features,
    addedDays: row.added_days,
    sold: row.sold,
    featured: row.featured,
    isDemo: row.is_demo,
    imagePaths: row.images,
  }));
}

async function requireAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Admin access required");
}

export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient().from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return withSignedImages(data);
});

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return withSignedImages(data);
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProductInput) => productInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const values = {
      slug: slugify(data.slug || data.name),
      name: data.name,
      sku: data.sku,
      category: data.category,
      brand: data.brand,
      description: data.description,
      price: data.price,
      price_on_request: data.priceOnRequest ?? false,
      sale_price: data.salePrice,
      images: data.images,
      stock: data.stock,
      sizes: data.sizes,
      material: data.material,
      colour: data.colour,
      features: data.features,
      added_days: data.addedDays,
      sold: data.sold,
      featured: data.featured,
      is_demo: false,
      updated_at: new Date().toISOString(),
    };
    const query = data.id
      ? context.supabase.from("products").update(values).eq("id", data.id)
      : context.supabase.from("products").insert(values);
    const { error } = await query;
    if (error) throw error;
    return { success: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: existing, error: readError } = await context.supabase.from("products").select("images").eq("id", data.id).single();
    if (readError) throw readError;
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw error;
    const paths = existing.images.filter((image) => !image.startsWith("/") && !image.startsWith("http"));
    if (paths.length) await context.supabase.storage.from("product-images").remove(paths);
    return { success: true };
  });

export const importProductCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { csv: string }) => z.object({ csv: z.string().min(1).max(5 * 1024 * 1024) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const preview = parseProductCsv(data.csv);
    if (preview.errors.length) return { count: 0, errors: preview.errors };
    const { data: existing, error: readError } = await context.supabase.from("products").select("sku,slug");
    if (readError) throw new Error("Could not check existing products. Nothing was imported.");
    const errors = findImportDuplicates(preview.rows, existing);
    if (errors.length) return { count: 0, errors };
    const values = preview.rows.map(({ product }) => ({
      slug: slugify(product.slug || product.name), name: product.name, sku: product.sku,
      category: product.category, brand: product.brand, description: product.description,
      price: product.price, sale_price: product.salePrice, images: product.images,
      price_on_request: product.priceOnRequest ?? false,
      stock: product.stock, sizes: product.sizes, material: product.material, colour: product.colour,
      features: product.features, added_days: product.addedDays, sold: product.sold,
      featured: product.featured, is_demo: false,
    }));
    const { error } = await context.supabase.from("products").insert(values);
    if (error) throw new Error("Import could not be saved. Nothing was imported; check for duplicate SKUs or product links.");
    return { count: values.length, errors: [] };
  });
