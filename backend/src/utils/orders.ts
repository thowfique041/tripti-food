export const orderStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export function canChangeOrderStatus(order, nextStatus) {
  const onlinePayment = order?.payment === "bkash" || order?.payment === "nagad";
  return !onlinePayment || order.paymentVerified || nextStatus === "cancelled";
}

export function restockOperations(items = []) {
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const usedDiscount = Boolean(item.discount?.type);
    return { updateOne: { filter: { _id: item.product }, update: [{ $set: {
      stock: { $add: [{ $ifNull: ["$stock", 0] }, quantity] },
      ...(usedDiscount ? { "discount.quantityUsed": { $max: [0, { $subtract: [{ $ifNull: ["$discount.quantityUsed", 0] }, quantity] }] } } : {}),
    } }] } };
  });
}
