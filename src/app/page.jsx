import HomeStorefront from "./HomeStorefront";
import {previewEnabled, readMenu} from "../lib/menu-preview.mjs";
import MenuHome from "./MenuHome";
import {flavors} from "../lib/catalog-flavors.mjs";
import {getStorefrontProducts} from "../lib/products.mjs";

export const revalidate = 60;

export default async function Home() {
  if (previewEnabled()) {
    const {products} = await readMenu();
    return <MenuHome products={products}/>;
  }
  let products = {};
  try {
    products = await getStorefrontProducts(flavors.map(flavor => flavor.id), revalidate);
  } catch (error) {
    console.error("Sanity catalog request failed", error.statusCode ?? error.name);
  }
  return <HomeStorefront products={products} />;
}
