import { describe, expect, it } from "vitest";
import { readCart, reconcileCart } from "./cart";

const fallback = [{ _id: "demo-1", slug: "honey", stock: 5 }];
const products = [{ _id: "507f1f77bcf86cd799439011", slug: "honey", stock: 3 }];

describe("cart persistence", () => {
  it("survives malformed browser storage", () => {
    expect(readCart("not json")).toEqual([]);
    expect(readCart("{}" )).toEqual([]);
  });

  it("migrates demo IDs to database IDs and clamps stock", () => {
    expect(reconcileCart([{ productId: "demo-1", quantity: 5 }], products, fallback)).toEqual([
      { productId: "507f1f77bcf86cd799439011", quantity: 3 },
    ]);
  });

  it("drops stale products and invalid quantities", () => {
    expect(reconcileCart([{ productId: "missing", quantity: 1 }], products, fallback)).toEqual([]);
    expect(reconcileCart([{ productId: "demo-1", quantity: "NaN" }], products, fallback)).toEqual([]);
  });
});
