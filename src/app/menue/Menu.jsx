"use client";
import Link from "next/link";
import {TasteFinder,OrderFaq,StoreFooter} from "../StoreSections";
import {useEffect,useRef,useState} from "react";
import {creamBonus,flavorCount,previewAvailable,resolveSelection} from "../../lib/menu-config.mjs";
import styles from "./menu.module.css";
import {useScrollReveals} from "../useScrollReveals";

const money = cents => (cents/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const storage = "eistaxi-menu-preview-cart-v1";
const errors = {MINIMUM_NOT_MET:"Der Mindestbestellwert beträgt 14,00 €.", OUTSIDE_DELIVERY_AREA:"Bitte verwende die Test-PLZ 22846.",
  INVALID_ADDRESS:"Bitte gib eine fünfstellige PLZ ein.", QUOTE_CHANGED:"Der Preis hat sich geändert. Bitte erneut berechnen.",
  PRODUCT_UNAVAILABLE:"Eine Auswahl ist nicht mehr verfügbar. Bitte prüfe den Warenkorb."};

function Photo({product,width=640}) {
  return product.image && <img src={product.image+"?w="+width+"&auto=format"} width={width} height={width} alt={product.name} loading="lazy"/>;
}
function Choose({label,value,onChange,children}) {
  return <label>{label}<select value={value} onChange={e=>onChange(e.target.value)}>{children}</select></label>;
}
function Product({p,products,add}) {
  const [variant,setVariant]=useState(p.variants?.[0]?._key || "");
  const [option,setOption]=useState("");
  const [flavors,setFlavors]=useState([]);
  const [extras,setExtras]=useState({});
  const [noCream,setNoCream]=useState(false);
  const availableFlavors=products.filter(f=>f.primary==="eissorten" && previewAvailable(f));
  const portion=p.variants?.find(v=>v._key===variant);
  const chosen=Array.from({length:flavorCount(p,portion)},(_,i)=>flavors[i] || availableFlavors[0]?.key || "");
  const selection={product:p.key,variant,option,noCream,flavors:chosen,extras:Object.entries(extras)
    .filter(([,v])=>v).sort().map(([group,v])=>({group,variant:v}))};
  const price=resolveSelection(products,selection);
  const scoop=products.find(item=>item.key==="extras-01");
  return <div className={styles.detail}><Photo product={p} width={960}/><div>
    <Link href={"/menue/"+p.primary}>← Zur Kollektion</Link><h1>{p.name}</h1>
    <p>{p.description}</p><p>{[...(p.marks||[]),p.note].filter(Boolean).join(" · ")}</p>
    <details><summary>Zutatenhinweise · Nummern der Speisekarte</summary>
      <p>1 Soja / Sojaspuren, 2 mit Lactose, 3 mit Ei, 4 mit Haselnüssen, 5 mit Gluten, 9 mit Koffein,
      11 mit Sulfiten, 13 mit Alkohol, 14 mit Farbstoff, 15 mit Walnüssen, 16 mit Cashewkerne,
      17 mit Pistazien, 18 mit Erdnüssen, 19 mit Mandeln, 20 mit Paranüssen, 24 mit Süßungsmittel.</p>
      {p.description?.includes(",12]") && <p>Für die Nummer 12 fehlt die Erklärung in der gedruckten Karte.</p>}
    </details>
    {portion && <Choose label="Portion" value={variant} onChange={setVariant}>{p.variants.map(v=><option key={v._key} value={v._key}>{v.label} · {money(v.priceCents)}</option>)}</Choose>}
    {p.options?.length>0 && <Choose label="Zubereitung" value={option} onChange={setOption}><option value="">Standard</option>{p.options.map(v=><option key={v._key} value={v._key}>{v.label} (+{money(v.priceCents)})</option>)}</Choose>}
    {chosen.map((v,i)=><Choose key={i} label={"Sorte · Kugel "+(i+1)} value={v} onChange={value=>setFlavors(chosen.map((f,j)=>i===j?value:f))}>{availableFlavors.map(f=><option key={f.key} value={f.key}>{f.name}</option>)}</Choose>)}
    {creamBonus(p) && <label><input type="checkbox" checked={noCream} onChange={e=>setNoCream(e.target.checked)}/> Ohne Sahne · eine Kugel zusätzlich</label>}
    {p.extraGroups.map(id=>{const g=products.find(x=>x.key===id);return g && <Choose key={id} label={g.name} value={extras[id]||""} onChange={v=>setExtras({...extras,[id]:v})}><option value="">Keine</option>{g.variants?.map(v=><option key={v._key} value={v._key}>{v.label} (+{money(v.priceCents)})</option>)}</Choose>})}
    {portion ? <button className="primary" disabled={!price} onClick={()=>add(selection)}>{price?"In den Warenkorb · "+money(price.priceCents):"Derzeit nicht verfügbar"}</button> :
      scoop && previewAvailable(p) && <button className="primary" onClick={()=>add({product:scoop.key,variant:scoop.variants[0]._key,flavors:[p.key]})}>Eine Kugel · {money(scoop.variants[0].priceCents)}</button>}
  </div></div>;
}
function RelatedProducts({product,products,collections}) {
  const section=useRef(null);
  useScrollReveals(section);
  const candidates=products.filter(p=>p.key!==product.key && p.image && previewAvailable(p) && p.variants?.length);
  const same=candidates.filter(p=>p.primary===product.primary || p.others?.includes(product.primary));
  const related=same.slice(0,2);
  const usedCollections=new Set([product.primary]);
  for(const p of candidates) {
    if(related.length===4) break;
    if(!usedCollections.has(p.primary) && !related.includes(p)) {related.push(p);usedCollections.add(p.primary);}
  }
  for(const p of candidates) {if(related.length===4) break;if(!related.includes(p)) related.push(p);}
  if(!related.length) return null;
  return <section ref={section} className={styles.related} aria-labelledby="related-title">
    <div className={styles.relatedHeading} data-reveal="rise"><div><p className="eyebrow">Noch ein Lieblingsmoment</p><h2 id="related-title">Das passt zu deinem Eis.</h2></div>
      <Link className={styles.collectionLink} href={"/menue/"+product.primary}>Kollektion entdecken <span aria-hidden="true">→</span></Link></div>
    <div className={styles.relatedGrid}>{related.map(p=><article key={p.key} className={styles.relatedCard} data-reveal="rise">
      <Link className={styles.relatedPhoto} href={"/menue/produkt/"+p.slug} tabIndex={-1} aria-hidden="true"><Photo product={p}/></Link>
      <span className={styles.collectionBadge}>{collections.find(c=>c.slug===p.primary)?.name || "Speisekarte"}</span>
      <h3><Link href={"/menue/produkt/"+p.slug}>{p.name}</Link></h3>
      <div className={styles.relatedAction}><strong>{p.variants.length>1?"ab ":""}{money(Math.min(...p.variants.map(v=>v.priceCents)))}</strong>
        <Link className={"primary "+styles.relatedButton} href={"/menue/produkt/"+p.slug}>Ansehen <span className="ctaArrow" aria-hidden="true">→</span></Link></div>
    </article>)}</div>
    <svg className={styles.relatedWave} viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 30Q100 0 200 30T400 30T600 30T800 30T1000 30T1200 30V60H0Z"/></svg>
  </section>;
}
function Cart({cart,products,change}) {
  const [postal,setPostal]=useState("22846"),[result,setResult]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const attempt=useRef(null);
  const input={catalog:"eistaxi-preview",items:cart,country:"DE",postalCode:postal};
  const signature=JSON.stringify(input), quote=result?.signature===signature ? result.quote:null;
  async function submit() {
    setBusy(true);setError("");
    try {
      if (attempt.current?.signature!==signature) attempt.current={signature,id:crypto.randomUUID()};
      const response=await fetch(quote?"/api/checkout/session":"/api/cart/quote",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(quote?{...input,attemptId:attempt.current.id,expectedTotalCents:quote.totalCents}:input)});
      const data=await response.json();
      if (!response.ok) {setResult(null);attempt.current=null;throw new Error(errors[data.error]||"Der Vorgang ist fehlgeschlagen. Bitte erneut versuchen.")}
      if (quote) {
        try {sessionStorage.setItem("eistaxi-preview-attempt",JSON.stringify({id:attempt.current.id,cart:JSON.stringify(cart)}))} catch {}
        window.location.assign(data.url);
      } else setResult({signature,quote:data});
    } catch(e){setError(e.message)} finally {setBusy(false)}
  }
  return <section className={styles.cart}><h1>Warenkorb</h1>{!cart.length && <p>Dein Warenkorb ist leer. <Link href="/menue">Zum Menü →</Link></p>}
    {cart.map((line,i)=>{const p=resolveSelection(products,line.selection);return <div className={styles.line} key={i}><strong>{p?.name||"Auswahl nicht verfügbar"}</strong>
      <div><button disabled={busy} aria-label="Menge verringern" onClick={()=>change(i,-1)}>−</button> {line.quantity} <button disabled={busy} aria-label="Menge erhöhen" onClick={()=>change(i,1)}>+</button>
      <button disabled={busy} onClick={()=>change(i,-line.quantity)}>Entfernen</button></div>{p && money(p.priceCents*line.quantity)}</div>})}
    {cart.length>0 && <><p>Mindestbestellwert 14,00 € · Lieferung 2,00 €</p><label>Test-Postleitzahl<input disabled={busy} value={postal} onChange={e=>setPostal(e.target.value)} inputMode="numeric" maxLength={5}/></label>
    {quote && <p>Warenwert {money(quote.subtotalCents)} + Lieferung {money(quote.shippingCents)} <strong> = {money(quote.totalCents)}</strong></p>}
    <button disabled={busy} className="primary" onClick={submit}>{busy?"Bitte warten …":quote?"Weiter zu Stripe (Test)":"Lieferung berechnen"}</button></>}
    <p role="status">{error}</p></section>;
}
export default function Menu({menu:{collections,products},product,collection,cartPage}) {
  const [cart,setCart]=useState([]),[ready,setReady]=useState(false),[message,setMessage]=useState("");
  useEffect(()=>{try{const data=JSON.parse(localStorage.getItem(storage)||"[]");if(Array.isArray(data))setCart(data.filter(x=>x?.selection && Number.isInteger(x.quantity) && x.quantity>0 && x.quantity<=99).slice(0,20))}catch{}setReady(true)},[]);
  function save(next){setCart(next);try{localStorage.setItem(storage,JSON.stringify(next))}catch{}}
  function add(selection){
    if(!ready)return;
    const name=resolveSelection(products,selection)?.name;
    if(!name)return;
    const i=cart.findIndex(x=>resolveSelection(products,x.selection)?.name===name);
    if(i<0 && cart.length>=20){setMessage("Maximal 20 Positionen pro Bestellung.");return}
    save(i<0?[...cart,{selection,quantity:1}]:cart.map((x,j)=>i===j?{...x,quantity:Math.min(99,x.quantity+1)}:x));
    setMessage(name+" · im Warenkorb");
  }
  const listedProducts=collection ? products.filter(p=>p.primary===collection.slug||p.others?.includes(collection.slug)) : [];
  if (collection?.slug==="eissorten") listedProducts.sort((a,b)=>Number(a.primary!=="eissorten")-Number(b.primary!=="eissorten"));
  return <>
    <header><div className="navwrap"><Link className="logo" href="/">Eis-Taxi.</Link>
      <nav aria-label="Hauptnavigation"><Link href="/menue">Speisekarte</Link><Link href="/#idee">Unsere Idee</Link><Link href="/#lieferung">Lieferung</Link></nav>
      <Link className="cartbtn" href="/menue/warenkorb">Warenkorb <b>{cart.reduce((sum,x)=>sum+x.quantity,0)}</b></Link>
    </div></header>
    <main className={styles.menu+(product && !cartPage ? " "+styles.productPage : "")}>
    <nav aria-label="Menükollektionen">{collections.map(c=><Link aria-current={collection?.slug===c.slug?"page":product?.primary===c.slug?"location":undefined} key={c.slug} href={"/menue/"+c.slug}>{c.name}</Link>)}</nav>
    {cartPage?<Cart cart={cart} products={products} change={(i,n)=>save(cart.map((x,j)=>i===j?{...x,quantity:Math.min(99,x.quantity+n)}:x).filter(x=>x.quantity>0))}/>:
      product?<Product p={product} products={products} add={add}/>:<section className={styles.collectionSection}><h1>{collection.name}</h1><div className={styles.cards}>{listedProducts.map(p=><Link key={p.key} href={"/menue/produkt/"+p.slug}><Photo product={p}/><h2>{p.name}</h2><span>{p.variants?.length?((p.variants.length>1?"ab ":"")+money(Math.min(...p.variants.map(v=>v.priceCents)))):p.note}</span></Link>)}</div></section>}
    <p className={styles.cartMessage} aria-live="polite">{message} {message && <Link href="/menue/warenkorb">Zum Warenkorb →</Link>}</p>
    {product && !cartPage && <div className={styles.relatedBackdrop}><div className={styles.biscuitDivider} aria-hidden="true"/><RelatedProducts key={product.key} product={product} products={products} collections={collections}/></div>}
    </main>
    {product && !cartPage && <><div className={styles.biscuitBottom} aria-hidden="true"><div className={styles.biscuitDivider}/></div><TasteFinder key={product.key} products={products}/><OrderFaq/><StoreFooter/></>}
    </>;
}
