import { describe, expect, it } from "vitest";
import Papa from "papaparse";
import { parseProductCsv, productCsvTemplate, findImportDuplicates } from "@/lib/product-csv";

function csv(overrides: Record<string, string> = {}) {
  return Papa.unparse([{ name: "Safety shoes", sku: "SH-01", category: "safety-shoes", brand: "Safety Brand", description: "Anti-slip safety footwear.", price: "1200", images: "https://example.com/shoe.jpg|https://example.com/shoe-side.jpg", sizes: "6|7|8", colours: "Black|Brown", ...overrides }]);
}
describe("CSV safety product import", () => {
  it("preserves product prices and multiple images", () => {
    const result = parseProductCsv(csv({ sale_price: "1000" }));
    expect(result.errors).toEqual([]);
    expect(result.rows[0]?.product.price).toBe(1200);
    expect(result.rows[0]?.product.salePrice).toBe(1000);
    expect(result.rows[0]?.product.images).toEqual(["https://example.com/shoe.jpg", "https://example.com/shoe-side.jpg"]);
  });
  it("preserves optional sizes and multiple colour choices", () => {
    expect(parseProductCsv(csv()).rows[0]?.product.sizes).toEqual(["6", "7", "8"]);
    expect(parseProductCsv(csv()).rows[0]?.product.colour).toBe("Black, Brown");
    expect(parseProductCsv(csv({ sizes: "", colours: "" })).rows[0]?.product.sizes).toEqual([]);
  });
  it("parses quoted descriptions and comma-separated colours", () => {
    expect(parseProductCsv(csv({ description: "Strong, reliable shoes\nfor industrial use", colours: "Red, Yellow, Blue" })).rows[0]?.product.colour).toBe("Red, Yellow, Blue");
  });
  it("rejects invalid prices, missing images and unknown categories", () => {
    for (const input of [{ price: "-1" }, { price: "abc" }, { images: "" }, { category: "unknown" }, { sale_price: "1201" }]) expect(parseProductCsv(csv(input)).errors.length).toBeGreaterThan(0);
  });
  it("rejects unsafe image links", () => {
    expect(parseProductCsv(csv({ images: "javascript:alert(1)" })).errors.length).toBeGreaterThan(0);
  });
  it("rejects existing products instead of overwriting them", () => {
    const { rows } = parseProductCsv(csv());
    expect(findImportDuplicates(rows, [{ sku: "SH-01", slug: "safety-shoes" }])).toHaveLength(2);
  });
  it("rejects repeated SKU and slug within a file", () => {
    const source = csv();
    expect(parseProductCsv(source + "\r\n" + source.split("\r\n").slice(1).join("\r\n")).errors).toHaveLength(2);
  });
  it("requires columns and at least one product", () => {
    expect(parseProductCsv("name,price\nShoes,1200").errors.length).toBeGreaterThan(0);
    expect(parseProductCsv("name,sku,category,brand,description,price,images").errors.length).toBeGreaterThan(0);
  });
  it("accepts the downloadable product template", () => {
    expect(parseProductCsv(productCsvTemplate()).errors).toEqual([]);
  });
  it("limits imports to 500 products and 5 MB", () => {
    const parsed = Papa.parse<Record<string, string>>(csv(), { header: true });
    const row = parsed.data[0];
    if (!row) throw new Error("Missing test product");
    expect(parseProductCsv(Papa.unparse(Array.from({ length: 501 }, () => row))).errors).toContainEqual({ row: 0, message: "Import up to 500 products at a time." });
    expect(parseProductCsv("a".repeat(5 * 1024 * 1024 + 1)).errors).toContainEqual({ row: 0, message: "CSV must be 5 MB or smaller." });
  });
});