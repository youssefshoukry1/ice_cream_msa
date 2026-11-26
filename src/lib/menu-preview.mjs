import "server-only";
import {createHash} from "node:crypto";
import {sanity} from "./sanity.mjs";
import {calculateQuote, validateDeliveryDestination, validateQuoteItems} from "./order-pricing.mjs";
import {menuRules, resolveSelection} from "./menu-config.mjs";

export function previewEnabled() {
  return process.env.VERCEL_ENV === "production" ? process.env.EISTAXI_TEST_DEMO === "true" : Boolean(process.env.SANITY_MENU_PREVIEW_TOKEN);
}

export async function readMenu() {
  if (!previewEnabled()) throw new Error("Menu preview unavailable");
  const client = process.env.VERCEL_ENV === "production" ? sanity :
    sanity.withConfig({perspective:"drafts", token:process.env.SANITY_MENU_PREVIEW_TOKEN});
  const menu = await client.fetch(`{
    "collections": *[_type=="menuCollection" && _id match "eistaxi-2026-*"] | order(position asc){name,"slug":slug.current},
    "products": *[_type=="menuProduct" && _id match "eistaxi-2026-*"] | order(position asc){
      _id,name,"slug":slug.current,description,variants,options,marks,available,"note":availabilityNote,
      "image":image.asset->url,"primary":primaryCollection->slug.current,
      "others":otherCollections[]->slug.current,"extraGroups":extraGroups[]._ref
    }
  }`, {}, {cache:"no-store"});
  const key = id => id.replace(/^(drafts\.)?eistaxi-2026-/, "");
  return {...menu, products:menu.products.map(p => ({...p,key:key(p._id),extraGroups:(p.extraGroups??[]).map(key)}))};
}

export async function quoteMenu(input) {
  if (!previewEnabled()) return {error:"PREVIEW_UNAVAILABLE"};
  const delivery = validateDeliveryDestination(input.country,input.postalCode,menuRules);
  if (delivery.error) return delivery;
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 20) return {error:"INVALID_CART"};
  const {products} = await readMenu();
  const priced = [], items = [];
  for (const line of input.items) {
    const product = resolveSelection(products,line?.selection);
    if (!product) return {error:"PRODUCT_UNAVAILABLE"};
    const id = product.productKey+"-"+createHash("sha256").update(product.name).digest("hex").slice(0,16);
    priced.push({...product,id});
    items.push({id,quantity:line.quantity});
  }
  if (!validateQuoteItems(items)) return {error:"INVALID_CART"};
  const quote = calculateQuote(items,priced,menuRules);
  return quote.error ? quote : {...quote,menuPreview:true,destination:delivery.destination};
}
