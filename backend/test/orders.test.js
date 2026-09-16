import test from "node:test";
import assert from "node:assert/strict";
import { canChangeOrderStatus, orderStatuses, restockOperations } from "../src/utils/orders.js";

test("accepted order statuses remain explicit", () => {
  assert.deepEqual(orderStatuses, ["pending", "confirmed", "shipped", "delivered", "cancelled"]);
});

test("cancellation restores stock and only restores used discount quota", () => {
  const operations = restockOperations([
    { product: "product-a", quantity: 2, discount: { type: "percentage" } },
    { product: "product-b", quantity: 1, discount: { type: null } },
  ]);
  const discounted = operations[0].updateOne.update[0].$set;
  const regular = operations[1].updateOne.update[0].$set;
  assert.ok(discounted.stock);
  assert.ok(discounted["discount.quantityUsed"]);
  assert.ok(regular.stock);
  assert.equal(regular["discount.quantityUsed"], undefined);
});

test("unverified online payments can only be cancelled", () => {
  const online = { payment: "bkash", paymentVerified: false };
  assert.equal(canChangeOrderStatus(online, "cancelled"), true);
  assert.equal(canChangeOrderStatus(online, "confirmed"), false);
  assert.equal(canChangeOrderStatus({ ...online, paymentVerified: true }, "confirmed"), true);
  assert.equal(canChangeOrderStatus({ payment: "cod", paymentVerified: false }, "confirmed"), true);
});
