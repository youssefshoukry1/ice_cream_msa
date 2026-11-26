export const menuRules = {
  mode: "sandbox", currency: "EUR", country: "DE", postalCodes: ["22846"],
  shippingCents: 200, minimumSubtotalCents: 1400, taxIncluded: true,
  productTaxBps: 1000, shippingTaxBps: 1000,
};

export function flavorCount(product, variant) {
  if (!variant) return 0;
  if (product.key === "drinks-02") return variant._key === "v1" ? 4 : 2;
  return ["desserts-01", "desserts-02", "extras-01"].includes(product.key) ? 1 : 0;
}

export function creamBonus(product) {
  return (product.key.startsWith("desserts-") && product.primary !== "kinderbecher") ||
    ["drinks-03", "drinks-04"].includes(product.key);
}

export function previewAvailable(product) {
  return product.available || !product.note || product.note === "immer verfügbar";
}

export function resolveSelection(products, selection) {
  if (!selection || typeof selection !== "object") return null;
  const product = products.find(p => p.key === selection.product);
  if (!product || !previewAvailable(product)) return null;
  const variant = product.variants?.find(v => v._key === selection.variant);
  if (!variant) return null;
  const labels = [product.name, variant.label];
  let priceCents = variant.priceCents;
  if (!Number.isSafeInteger(priceCents) || priceCents < 1) return null;
  if (selection.option) {
    const option = product.options?.find(v => v._key === selection.option);
    if (!option || !Number.isSafeInteger(option.priceCents) || option.priceCents < 0) return null;
    labels.push(option.label);
    priceCents += option.priceCents;
  }
  const flavors = selection.flavors ?? [];
  if (!Array.isArray(flavors) || flavors.length !== flavorCount(product, variant)) return null;
  for (const key of flavors) {
    const flavor = products.find(p => p.key === key && p.primary === "eissorten");
    if (!flavor || !previewAvailable(flavor)) return null;
    labels.push(flavor.name);
  }
  if (selection.noCream) {
    if (selection.noCream !== true || !creamBonus(product)) return null;
    labels.push("ohne Sahne, +1 Kugel");
  }
  const extras = selection.extras ?? [];
  if (!Array.isArray(extras) || extras.length > 8 || new Set(extras.map(e=>e?.group)).size !== extras.length) return null;
  for (const extra of extras) {
    if (!product.extraGroups?.includes(extra?.group)) return null;
    const group = products.find(p => p.key === extra.group && previewAvailable(p));
    const portion = group?.variants?.find(v => v._key === extra.variant);
    if (!portion || !Number.isSafeInteger(portion.priceCents) || portion.priceCents < 0) return null;
    priceCents += portion.priceCents;
    labels.push(group.name + " " + portion.label);
  }
  return {name:labels.join(" · "), priceCents, available:true, productKey:product.key};
}
