import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import catalogue from "@/lib/manoj-catalogue.json";

describe("PDF catalogue", () => {
  it("includes every prepared product photo exactly once", () => {
    const keys = catalogue.flatMap((product) => product.sources.map((source) => source.key));
    expect(catalogue).toHaveLength(100);
    expect(keys).toHaveLength(108);
    expect(new Set(keys).size).toBe(108);
    const photos = Object.fromEntries(readdirSync("public/images/catalogue").map((f) => [`/${f}`, true]));
    for (const key of keys) {
      expect(Object.keys(photos).filter((path) => path.endsWith(`-${key}.webp`))).toHaveLength(1);
    }
  });

  it("uses price on request without inventing stock", () => {
    for (const product of catalogue) {
      expect(product.priceOnRequest).toBe(true);
      expect(product.stock).toBe(0);
    }
  });

  it("groups helmet colours without merging different brands", () => {
    const karam = catalogue.find((product) => product.slug === "karam-safety-helmet");
    const solido = catalogue.find((product) => product.slug === "solido-safety-helmet");
    expect(karam?.colours).toEqual(["Yellow", "White", "Blue"]);
    expect(karam?.sources).toHaveLength(3);
    expect(solido?.colours).toEqual(["White", "Yellow"]);
    expect(solido?.brand).toBe("Solido");
    expect(karam?.brand).toBe("Karam");
  });

  it("preserves the listed dustbin size options", () => {
    expect(catalogue.find((product) => product.slug === "wheeled-dustbin")?.sizes).toEqual(["120 L", "660 L", "1100 L"]);
  });
});