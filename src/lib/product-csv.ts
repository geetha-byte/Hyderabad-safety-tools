import Papa from "papaparse";
import { categories, slugify } from "@/lib/catalog";
import { productInput, type ProductInput } from "@/lib/product-input";

export type CsvError = { row: number; message: string };
export type CsvRow = { row: number; product: ProductInput };
export type CsvPreview = { rows: CsvRow[]; errors: CsvError[] };
const required = ["name", "sku", "category", "brand", "description", "price", "images"];
export const csvColumns = [...required, "sale_price","gst_rate", "stock", "sizes", "colours", "material", "features", "featured", "slug", "price_on_request"];
const list = (value: string) => value.split(/[|,]/).map((v) => v.trim()).filter(Boolean);
const imageList = (value: string) => value.split("|").map((v) => v.trim()).filter(Boolean);
const imageValid = (value: string) => {
  if (/^\/images\/(catalogue\/)?[a-zA-Z0-9._-]+$/.test(value)) return true;
  if (/^\/__l5e\/assets-v1\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
};

export function findImportDuplicates(rows: CsvRow[], existing: { sku: string; slug: string }[]): CsvError[] {
  const skus = new Set(existing.map((p) => p.sku.toLowerCase()));
  const slugs = new Set(existing.map((p) => p.slug.toLowerCase()));
  const errors: CsvError[] = [];
  for (const { row, product } of rows) {
    const slug = slugify(product.slug || product.name);
    if (!slug) errors.push({ row, message: "Product needs a valid slug (letters or numbers)." });
    if (skus.has(product.sku.toLowerCase())) errors.push({ row, message: `SKU ${product.sku} already exists or is repeated.` });
    if (slugs.has(slug)) errors.push({ row, message: `Product link ${slug} already exists or is repeated. Set a unique slug.` });
    skus.add(product.sku.toLowerCase()); slugs.add(slug);
  }
  return errors;
}
export function parseProductCsv(
  csv: string,
  categoryList: { slug: string; name: string }[] = categories,
): CsvPreview {
  const rows: CsvRow[] = []; const errors: CsvError[] = [];
  if (new TextEncoder().encode(csv).length > 5 * 1024 * 1024) return { rows, errors: [{ row: 0, message: "CSV must be 5 MB or smaller." }] };
  const parsed = Papa.parse<Record<string, string>>(csv.replace(/^\uFEFF/, ""), {
    header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim().toLowerCase(),
  });
  for (const error of parsed.errors) errors.push({ row: error.row === undefined ? 0 : error.row + 2, message: error.message });
  const headers = parsed.meta.fields ?? [];
  for (const key of required) if (!headers.includes(key)) errors.push({ row: 1, message: `Missing column: ${key}` });
  if (parsed.data.length === 0) errors.push({ row: 0, message: "CSV contains no products." });
  if (parsed.data.length > 500) errors.push({ row: 0, message: "Import up to 500 products at a time." });
  if (errors.length) return { rows, errors };
  parsed.data.forEach((data, index) => {
    const row = index + 2;
    const text = (key: string) => (data[key] ?? "").trim();
    const number = (key: string, fallback: number) => text(key) ? Number(text(key)) : fallback;
    const categoryText = text("category").toLowerCase();
    const category = categoryList.find((c) => c.slug === categoryText || c.name.toLowerCase() === categoryText);
    if (!category) errors.push({ row, message: "Unknown category. Use a category from the category list." });
    const featured = text("featured").toLowerCase();
    if (!["", "true", "false", "yes", "no", "1", "0"].includes(featured)) errors.push({ row, message: "Featured must be true or false." });
    const images = imageList(text("images"));
    if (images.some((image) => !imageValid(image))) errors.push({ row, message: "Images must be HTTPS links or existing /images/ files, separated by |." });
    const result = productInput.safeParse({
      name: text("name"), sku: text("sku"), category: category?.slug ?? categoryText,
      brand: text("brand"), description: text("description"), price: number("price", ["true", "yes", "1"].includes(text("price_on_request").toLowerCase()) ? 0 : NaN),
      priceOnRequest: ["true", "yes", "1"].includes(text("price_on_request").toLowerCase()),
      salePrice: text("sale_price") ? Number(text("sale_price")) : null,
      gstRate: number("gst_rate", 18),
      stock: number("stock", 0), images, sizes: list(text("sizes")),
      colour: list(text("colours") || text("colour") || text("colors")).join(", "),
      material: text("material"), features: list(text("features")), featured: ["true", "yes", "1"].includes(featured),
      addedDays: 0, sold: 0, ...(text("slug") ? { slug: text("slug") } : {}),
    });
    if (result.success) rows.push({ row, product: result.data });
    else result.error.issues.forEach((issue) => errors.push({ row, message: `${issue.path.join(".")}: ${issue.message}` }));
  });
  errors.push(...findImportDuplicates(rows, []));
  return { rows, errors };
}

export function productCsvTemplate(): string {
  return Papa.unparse({ fields: csvColumns, data: [[
    "Steel Toe Safety Shoes", "HST-SHOES-001", "safety-shoes", "Safety Brand",
    "Steel toe safety footwear with an anti-slip sole.", "1200", "/images/shoes.jpg", "1000", "18", "25",
    "6|7|8|9|10", "Black|Brown", "Leather", "Steel toe|Anti-slip sole", "true", "steel-toe-safety-shoes",
  ]] });
}

export function categoryCsv(
  categoryList: { slug: string; name: string }[] = categories,
): string {
  return Papa.unparse(categoryList.map(({ slug, name }) => ({ category: slug, name })));
}
