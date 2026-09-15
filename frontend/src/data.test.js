import { describe, expect, it } from "vitest";
import { defaultSettings, fallbackProducts } from "./data";

describe("fallback catalogue", () => {
  it("has unique IDs and valid purchasable products", () => {
    expect(new Set(fallbackProducts.map((product) => product._id)).size).toBe(fallbackProducts.length);
    for (const product of fallbackProducts) {
      expect(product.name.trim().length).toBeGreaterThan(1);
      expect(product.price).toBeGreaterThanOrEqual(0);
      expect(product.stock).toBeGreaterThanOrEqual(0);
      expect(product.image).toMatch(/^\/assets\//);
    }
  });

  it("contains valid default delivery settings", () => {
    expect(defaultSettings.email).toBe("");
    expect(defaultSettings.phone).toMatch(/^01[3-9]\d{8}$/);
    expect(defaultSettings.whatsapp).toMatch(/^8801[3-9]\d{8}$/);
    expect(defaultSettings.deliveryDhaka).toBeGreaterThanOrEqual(0);
    expect(defaultSettings.deliveryOutside).toBeGreaterThanOrEqual(0);
  });
});
