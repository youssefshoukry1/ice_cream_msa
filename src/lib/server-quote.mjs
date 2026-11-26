import "server-only";
import {quoteMenu} from "./menu-preview.mjs";
import {getQuoteProducts} from "./products.mjs";
import {calculateQuote, validateDeliveryDestination, validateQuoteItems} from "./order-pricing.mjs";

export async function quoteOrder(input) {
  if (input?.catalog === "eistaxi-preview") return quoteMenu(input);
  const delivery = validateDeliveryDestination(input?.country, input?.postalCode);
  if (delivery.error) return delivery;
  if (!validateQuoteItems(input.items)) return {error: "INVALID_CART"};

  const items = input.items.map(({id, quantity}) => ({id, quantity}));
  const products = await getQuoteProducts(items.map(item => item.id));
  const result = calculateQuote(items, products);
  return result.error ? result : {...result, destination: delivery.destination};
}
