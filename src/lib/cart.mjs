export const cartKey = "loeffelwerk-preview-cart-v2";
export const legacyCartKey = "loeffelwerk-preview-cart-v1";
export const maxQuantity = 99;

export function canBuy(product) {
  return product.available !== false && Number.isSafeInteger(product.price) && product.price > 0;
}

export function restoreCart(saved, catalog) {
  const items = {};
  let removed = 0;
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {items, removed};

  const products = new Map(catalog.map(product => [product.id, product]));
  for (const [id, entry] of Object.entries(saved)) {
    const quantity = typeof entry === "number" ? entry : entry?.quantity;
    if (!Number.isSafeInteger(quantity) || quantity < 1) continue;

    const product = products.get(id);
    if (!product) {
      removed++;
      continue;
    }
    const savedPrice = entry?.priceCents;
    items[id] = {
      quantity: Math.min(maxQuantity, quantity),
      priceCents: Number.isSafeInteger(savedPrice) && savedPrice > 0 ? savedPrice : product.price ?? null,
    };
  }
  return {items, removed};
}

export function changeQuantity(items, product, delta) {
  if (delta > 0 && !canBuy(product)) return items;
  const previous = items[product.id];
  const quantity = Math.max(0, Math.min(maxQuantity, (previous?.quantity ?? 0) + delta));
  if (quantity === previous?.quantity) return items;
  const next = {...items};
  if (quantity === 0) {
    delete next[product.id];
  } else {
    next[product.id] = {quantity, priceCents: previous?.priceCents ?? product.price ?? null};
  }
  return next;
}
