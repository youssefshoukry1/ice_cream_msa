import {sanity} from "./sanity.mjs";

const publishedProducts = '*[_type == "product" && slug.current in $ids]';
const pricingFields = '"id": slug.current, name, priceCents, available';

export async function getStorefrontProducts(ids, revalidate) {
  const products = await sanity.fetch(
    `${publishedProducts}{${pricingFields}, description, sizeMl, "imageUrl": image.asset->url,
      "ingredients": select(foodDetailsVerified == true => ingredients),
      "allergens": select(foodDetailsVerified == true => allergens)
    }`,
    {ids},
    {next: {revalidate}},
  );
  const byId = new Map();
  for (const product of products) {
    const valid = Number.isSafeInteger(product.priceCents) && product.priceCents > 0 &&
      Number.isSafeInteger(product.sizeMl) && product.sizeMl > 0;
    byId.set(product.id, valid && !byId.has(product.id) ? product : null);
  }
  return Object.fromEntries(byId);
}

export function getQuoteProducts(ids) {
  return sanity.fetch(
    `${publishedProducts}{${pricingFields}}`,
    {ids},
    {cache: "no-store"},
  );
}
