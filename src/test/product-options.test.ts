import { describe, expect, it } from "vitest";
import { addCartLine, cartLineKey, colourOptions } from "@/lib/product-options";

describe("Product size and colour options", () => {
  it("supports multiple colours on one product", () => {
    expect(colourOptions({ colour: "Red, Yellow, Blue" })).toEqual(["Red", "Yellow", "Blue"]);
  });
  it("does not offer colours when none are provided", () => {
    expect(colourOptions({ colour: "" })).toEqual([]);
  });
  it("keeps different colours separate in the cart", () => {
    expect(addCartLine([{ id: "helmet", qty: 1, colour: "Red" }], { id: "helmet", qty: 2, colour: "Yellow" })).toHaveLength(2);
  });
  it("keeps different sizes separate in the cart", () => {
    expect(addCartLine([{ id: "shoes", qty: 1, size: "6" }], { id: "shoes", qty: 1, size: "7" })).toHaveLength(2);
  });
  it("combines quantities only for the same size and colour", () => {
    expect(addCartLine([{ id: "gloves", qty: 1, size: "M", colour: "Red" }], { id: "gloves", qty: 2, size: "M", colour: "Red" })).toEqual([{ id: "gloves", qty: 3, size: "M", colour: "Red" }]);
  });
  it("keeps existing carts without a colour compatible", () => {
    expect(cartLineKey({ id: "shoes", size: "6" })).toBe(cartLineKey({ id: "shoes", size: "6", colour: undefined }));
  });
});