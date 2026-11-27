import { z } from "zod";
import { localDb } from "./local-db.server";
import { requireLocalAdmin } from "./local-admin.server";
import { slugify, type Product } from "./catalog";
import { productInput, type ProductInput } from "./product-input";
import { parseProductCsv, findImportDuplicates } from "./product-csv";

type LocalProductRow = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  description: string;
  price: string | number;
  sale_price: string | number | null;
  images: string[];
  stock: number;
  sizes: string[];
  material: string;
  colour: string;
  features: string[];
  added_days: number;
  sold: number;
  featured: boolean;
  is_demo: boolean;
  price_on_request: boolean;
  gst_rate: string | number;
  is_published: boolean;
};

function mapLocalProduct(row: LocalProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    description: row.description,
    price: Number(row.price),
    gstRate: Number(row.gst_rate),
    priceOnRequest: row.price_on_request,
    ...(row.sale_price === null ? {} : { salePrice: Number(row.sale_price) }),
    images: row.images,
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
  };
}


export async function listLocalPublicProducts(): Promise<Product[]> {
  const rows = await localDb<LocalProductRow[]>`
    SELECT * FROM public.products
    WHERE is_published = TRUE
    ORDER BY created_at DESC
  `;
  return rows.map(mapLocalProduct);
}

export async function listLocalAdminProducts(): Promise<Product[]> {
  await requireLocalAdmin();
  const rows = await localDb<LocalProductRow[]>`
    SELECT * FROM public.products
    ORDER BY created_at DESC
  `;
  return rows.map(mapLocalProduct);
}

async function requireActiveCategory(slug: string) {
  const result = await localDb<{ slug: string }[]>`
    SELECT slug
    FROM public.categories
    WHERE slug = ${slug} AND is_active = TRUE
  `;

  if (result.length === 0) {
    throw new Error("Please choose an active product category.");
  }
}

export async function saveLocalProduct(input: ProductInput) {
  await requireLocalAdmin();
  const data = productInput.parse(input);
  await requireActiveCategory(data.category);
  const values = {
    slug: slugify(data.slug || data.name),
    name: data.name,
    sku: data.sku,
    category: data.category,
    brand: data.brand,
    description: data.description,
    price: data.price,
    gst_rate: data.gstRate,
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
    updated_at: new Date(),
  };
if (data.id) {
  const result = await localDb`
    UPDATE public.products SET
      slug = ${values.slug},
      name = ${values.name},
      sku = ${values.sku},
      category = ${values.category},
      brand = ${values.brand},
      description = ${values.description},
      price = ${values.price},
      gst_rate = ${values.gst_rate},
      price_on_request = ${values.price_on_request},
      sale_price = ${values.sale_price},
      images = ${values.images},
      stock = ${values.stock},
      sizes = ${values.sizes},
      material = ${values.material},
      colour = ${values.colour},
      features = ${values.features},
      added_days = ${values.added_days},
      sold = ${values.sold},
      featured = ${values.featured},
      is_demo = ${values.is_demo},
      updated_at = ${values.updated_at}
    WHERE id = ${data.id}
    RETURNING id
  `;

  if (result.length === 0) {
    throw new Error("Product not found");
  }
} else {
    await localDb`
      INSERT INTO public.products (
        slug, name, sku, category, brand, description, price, gst_rate,
        price_on_request, sale_price, images, stock, sizes, material,
        colour, features, added_days, sold, featured, is_demo, updated_at
      ) VALUES (
        ${values.slug}, ${values.name}, ${values.sku}, ${values.category},
        ${values.brand}, ${values.description}, ${values.price}, ${values.gst_rate},
        ${values.price_on_request}, ${values.sale_price}, ${values.images},
        ${values.stock}, ${values.sizes}, ${values.material}, ${values.colour},
        ${values.features}, ${values.added_days}, ${values.sold},
        ${values.featured}, ${values.is_demo}, ${values.updated_at}
      )
    `;
  }

  return { success: true };
}


export async function deleteLocalProduct(input: { id: string }) {
  await requireLocalAdmin();
  const data = z.object({ id: z.string().uuid() }).parse(input);
  const result = await localDb`
    DELETE FROM public.products
    WHERE id = ${data.id}
    RETURNING id
  `;
  if (result.length === 0) throw new Error("Product not found");
  return { success: true };
}


export async function importLocalProductCsv(csv: string) {
  await requireLocalAdmin();

  const activeCategories = await localDb<{ slug: string; name: string }[]>`
  SELECT slug, name FROM public.categories WHERE is_active = TRUE
`;
const preview = parseProductCsv(csv, activeCategories);

  if (preview.errors.length) {
    return { count: 0, errors: preview.errors };
  }

  const existing = await localDb<{ sku: string; slug: string }[]>`
    SELECT sku, slug FROM public.products
  `;

  const duplicates = findImportDuplicates(preview.rows, existing);

  if (duplicates.length) {
    return { count: 0, errors: duplicates };
  }

  const products = preview.rows.map(({ product }) =>
    productInput.parse(product)
  );

  await localDb.begin(async (tx) => {
    for (const data of products) {
      await tx`
        INSERT INTO public.products (
          slug, name, sku, category, brand, description, price, gst_rate,
price_on_request, sale_price, images, stock, sizes, material,
          colour, features, added_days, sold, featured, is_demo, updated_at
        ) VALUES (
          ${slugify(data.slug || data.name)}, ${data.name}, ${data.sku},
          ${data.category}, ${data.brand}, ${data.description}, ${data.price}, ${data.gstRate},
${data.priceOnRequest ?? false}, ${data.salePrice}, ${data.images},
          ${data.stock}, ${data.sizes}, ${data.material}, ${data.colour},
          ${data.features}, ${data.addedDays}, ${data.sold}, ${data.featured},
          false, NOW()
        )
      `;
    }
  });

  return { count: products.length, errors: [] };
}
