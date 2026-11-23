import { describe, expect, it } from "vitest";
import { productInput, type ProductInput } from "@/lib/products.functions";

const valid: ProductInput = {
  name: "Test Safety Helmet",
  sku: "TEST-HAT-001",
  category: "head-protection",
  brand: "Test Brand",
  description: "A helmet used to verify product validation.",
  price: 1000,
  salePrice: 800,
  images: ["test-image.jpg"],
  stock: 10,
  sizes: ["M", "L"],
  material: "HDPE",
  colour: "Yellow",
  features: ["Adjustable strap"],
  addedDays: 0,
  sold: 0,
  featured: false,
};

describe("Admin product validation", () => {
  it("rejects a sale price above the regular price", () => {
    expect(productInput.safeParse({ ...valid, price: 1000, salePrice: 1001 }).success).toBe(false);
  });

  it("requires at least one product photo", () => {
    expect(productInput.safeParse({ ...valid, images: [] }).success).toBe(false);
  });

  it("accepts a valid product with a sale price", () => {
    expect(productInput.safeParse(valid).success).toBe(true);
  });

  it("allows products that do not need a size", () => {
    expect(productInput.safeParse({ ...valid, sizes: [] }).success).toBe(true);
  });

  it("accepts multiple colour names for a product", () => {
    const parsed = productInput.parse({ ...valid, colour: "Red, Yellow, Blue" });
    expect(parsed.colour).toBe("Red, Yellow, Blue");
  });
});
