import {notFound} from "next/navigation";
import {previewEnabled,readMenu} from "../../../lib/menu-preview.mjs";
import Menu from "../Menu";

export const dynamic = "force-dynamic";
export const metadata = {title:"Eis-Taxi · Menüvorschau", robots:{index:false,follow:false}};

export default async function Page({params}) {
  if (!previewEnabled()) notFound();
  const menu = await readMenu();
  const segments = (await params).path ?? [];
  const [section,slug] = segments;
  const product = section === "produkt" && menu.products.find(p=>p.slug===slug);
  const collection = menu.collections.find(c=>c.slug===(section || "eisbecher"));
  if (segments.length > 2 || (slug && !product) || (!product && !collection && section !== "warenkorb")) notFound();
  return <Menu key={segments.join("/")} menu={menu} product={product || null}
    collection={collection || null} cartPage={section==="warenkorb"} />;
}
