import {maxQuantity} from "./cart.mjs";

// Test fixtures only. Confirm shipping, dispatch, and tax policy before accepting live orders.
export const sandboxRules = {
  mode: "sandbox",
  currency: "EUR",
  country: "DE",
  postalCodes: ["10115", "10117"],
  shippingCents: 690,
  minimumSubtotalCents: 1300,
  taxIncluded: true,
  productTaxBps: 1000,
  shippingTaxBps: 1000,
};

export function validateDeliveryDestination(country, postalCode, rules = sandboxRules) {
  if (typeof country !== "string" || typeof postalCode !== "string") return {error: "INVALID_ADDRESS"};
  const destination = {country: country.trim().toUpperCase(), postalCode: postalCode.trim()};
  if (!/^[A-Z]{2}$/.test(destination.country) || !/^\d{5}$/.test(destination.postalCode)) {
    return {error: "INVALID_ADDRESS"};
  }
  if (destination.country !== rules.country || !rules.postalCodes.includes(destination.postalCode)) {
    return {error: "OUTSIDE_DELIVERY_AREA"};
  }
  return {destination};
}

export function validateQuoteItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) return false;
  const ids = new Set();
  for (const item of items) {
    if (typeof item?.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id) ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > maxQuantity ||
        ids.has(item.id)) return false;
    ids.add(item.id);
  }
  return true;
}

function taxCents(amount, basisPoints, inclusive) {
  const denominator = 10000 + (inclusive ? basisPoints : 0);
  return Math.floor((amount * basisPoints + Math.floor(denominator / 2)) / denominator);
}

export function calculateQuote(items, products, rules = sandboxRules) {
  const productsById = new Map();
  for (const product of products) {
    // Multiple published documents for one ID are ambiguous and cannot be priced.
    productsById.set(product.id, productsById.has(product.id) ? null : product);
  }

  const lines = [];
  let subtotalCents = 0;
  let productTaxCents = 0;
  for (const {id, quantity} of items) {
    const product = productsById.get(id);
    if (product?.available !== true || !Number.isSafeInteger(product.priceCents) ||
        product.priceCents < 1 || product.priceCents > 10000000) {
      return {error: "PRODUCT_UNAVAILABLE", productId: id};
    }
    const lineCents = product.priceCents * quantity;
    lines.push({id, name: product.name, quantity, unitPriceCents: product.priceCents, lineCents});
    subtotalCents += lineCents;
    productTaxCents += taxCents(lineCents, rules.productTaxBps, rules.taxIncluded);
  }
  if (subtotalCents < rules.minimumSubtotalCents) {
    return {error: "MINIMUM_NOT_MET", subtotalCents, minimumSubtotalCents: rules.minimumSubtotalCents};
  }

  const shippingTaxCents = taxCents(rules.shippingCents, rules.shippingTaxBps, rules.taxIncluded);
  const includedOrAddedTax = productTaxCents + shippingTaxCents;
  return {
    mode: rules.mode,
    currency: rules.currency,
    lines,
    subtotalCents,
    shippingCents: rules.shippingCents,
    taxIncluded: rules.taxIncluded,
    taxCents: includedOrAddedTax,
    totalCents: subtotalCents + rules.shippingCents + (rules.taxIncluded ? 0 : includedOrAddedTax),
  };
}
