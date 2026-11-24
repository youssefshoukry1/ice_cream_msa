import HomeStorefront from "./HomeStorefront";
import {flavors} from "../lib/catalog-flavors.mjs";
import {getStorefrontProducts} from "../lib/products.mjs";

export const revalidate = 60;

export default async function Home() {
  let products = {};
  try {
    products = await getStorefrontProducts(flavors.map(flavor => flavor.id), revalidate);
  } catch (error) {
    console.error("Sanity catalog request failed", error.statusCode ?? error.name);
  }
  return <HomeStorefront products={products} />;
}
