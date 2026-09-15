export function readCart(storageValue) {
  try {
    const value = JSON.parse(storageValue || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function reconcileCart(lines, products, fallbackProducts) {
  const fallbackById = new Map(fallbackProducts.map((product) => [product._id, product]));
  const productById = new Map(products.map((product) => [product._id, product]));
  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const reconciled = new Map();

  for (const line of Array.isArray(lines) ? lines : []) {
    const fallback = fallbackById.get(line.productId);
    const product = productById.get(line.productId) || productBySlug.get(fallback?.slug);
    const requested = Number(line.quantity);
    if (!product || !Number.isInteger(requested) || requested < 1 || product.stock < 1) continue;
    const quantity = Math.min(requested, product.stock);
    reconciled.set(product._id, Math.min((reconciled.get(product._id) || 0) + quantity, product.stock));
  }

  return [...reconciled].map(([productId, quantity]) => ({ productId, quantity }));
}
