"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import HeroHover from "./HeroHover";
import ScoopHeadline from "./ScoopHeadline";
import DeliveryQuote from "./DeliveryQuote";
import { useScrollReveals } from "./useScrollReveals";
import { canBuy, cartKey, changeQuantity, legacyCartKey, maxQuantity, restoreCart } from "../lib/cart.mjs";

import { flavors } from "../lib/catalog-flavors.mjs";

const money = (cents) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
function packInfo(flavor) {
  const size = flavor.sizeMl ?? 500;
  return flavor.price == null ? `${size} ml` : `${size} ml · ${money(flavor.price * 1000 / size)}/l`;
}
const unavailable = "Derzeit nicht verfügbar";
function Icon({name}) {
  const paths = { bag: <><path d="M4 8h16l1 13H3L4 8Z"/><path d="M8 9V7a4 4 0 018 0v2"/></>, arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>, spoon: <><ellipse cx="15" cy="7.5" rx="4.2" ry="6" transform="rotate(34 15 7.5)"/><path d="m12 12-8 10"/></>, menu: <path d="M3 7h18M3 12h18M3 17h18"/>, box: <><path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4m-9 4v10"/></> };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export default function HomeStorefront({ products }) {
  const catalog = useMemo(() => flavors.map(flavor => {
    const product = products[flavor.id];
    return {
      ...flavor,
      name: product?.name || flavor.name,
      note: product?.description || flavor.note,
      price: product?.priceCents,
      sizeMl: product?.sizeMl,
      imageUrl: product?.imageUrl,
      ingredients: product?.ingredients,
      allergens: product?.allergens,
      available: product?.available === true,
    };
  }), [products]);
  const main = useRef(null);
  useScrollReveals(main);
  const [slide, setSlide] = useState(0);
  const [recommendedId, setRecommendedId] = useState(flavors[0].id);
  const recommendation = catalog.find(flavor => flavor.id === recommendedId);
  const [filter, setFilter] = useState("Alle");
  const [cart, setCart] = useState({});
  const [ready, setReady] = useState(false);
  const [removedItems, setRemovedItems] = useState(0);
  const [openQuestion, setOpenQuestion] = useState(null);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef(null);
  const item = catalog[slide];
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = localStorage.getItem(cartKey) ?? localStorage.getItem(legacyCartKey);
      const {items, removed} = restoreCart(JSON.parse(saved ?? "{}"), catalog);
      setCart(items);
      setRemovedItems(removed);
    } catch {}
    setReady(true);
  }, [catalog]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      localStorage.removeItem(legacyCartKey);
    } catch {}
  }, [cart, ready]);
  useEffect(() => {
    if (panel && !dialog.current.open) dialog.current.showModal();
    if (!panel && dialog.current.open) dialog.current.close();
  }, [panel]);
  const cartProducts = catalog.filter(flavor => cart[flavor.id]);
  const quoteItems = cartProducts.map(({id}) => ({id, quantity: cart[id].quantity}));
  const count = cartProducts.reduce((sum, flavor) => sum + cart[flavor.id].quantity, 0);
  const subtotal = cartProducts.reduce((sum, flavor) => canBuy(flavor) ? sum + cart[flavor.id].quantity * flavor.price : sum, 0);
  const priceChanged = cartProducts.filter(flavor =>
    canBuy(flavor) && cart[flavor.id].priceCents != null && cart[flavor.id].priceCents !== flavor.price
  );
  function change(flavor, delta) {
    setCart(previous => changeQuantity(previous, flavor, delta));
  }
  function acknowledgePrices() {
    setCart(previous => {
      const updated = {...previous};
      for (const flavor of priceChanged) {
        if (previous[flavor.id]) updated[flavor.id] = {...previous[flavor.id], priceCents: flavor.price};
      }
      return updated;
    });
  }
  function add(flavor) {
    if (!ready || !canBuy(flavor)) return;
    if (cart[flavor.id]?.quantity === maxQuantity) {
      setNotice(`Maximale Menge für ${flavor.name} erreicht.`);
    } else {
      change(flavor, 1);
      setNotice(flavor.name + " liegt im Warenkorb.");
    }
    setPanel("cart");
  }
  const product = catalog.find(f => f.id === panel);
  const nav = <><a href="#sorten" onClick={()=>setPanel(null)}>Eissorten</a><a href="#idee" onClick={()=>setPanel(null)}>Unsere Idee</a><a href="#versand" onClick={()=>setPanel(null)}>Versand &amp; Fragen</a></>;
  return <>
    <a className="skip" href="#inhalt">Zum Inhalt</a>
    <header><div className="navwrap"><a className="logo" href="#inhalt" aria-label="Löffelwerk Startseite">Löffelwerk<span>.</span></a><nav aria-label="Hauptnavigation">{nav}</nav><div className="tools"><button className="cartbtn" aria-label={`Warenkorb, ${count} Artikel`} onClick={()=>setPanel("cart")}><Icon name="bag"/><span>Warenkorb</span><b>{count}</b></button><button className="menubtn" aria-label="Menü öffnen" onClick={()=>setPanel("menu")}><Icon name="menu"/></button></div></div></header>
    <HeroHover />
    <main id="inhalt" ref={main}>
      <section className="hero" aria-label="Eis im Mittelpunkt">
        <div className="intro"><div className="eyebrow"><span className="dash"/>Sorte im Fokus</div><h1>{item.headline}<br/><i>{item.finish}</i></h1><p>{item.note} Entdecke unsere vier Sorten für deinen nächsten Eis-Moment.</p><a className="primary" href="#sorten">Sorten entdecken <Icon name="arrow"/></a></div>
        <div className="heroart" style={{background:item.color}}><Image key={item.id} src={'/images/'+item.id+'.webp'} width={768} height={768} priority alt={item.name+" im Löffelwerk-Becher mit Eiskugel"}/><div className="photocontrol"><span>{String(slide+1).padStart(2,"0")} / 04</span><button aria-label="Vorherige Sorte" onClick={()=>setSlide((slide+3)%4)}>←</button><button aria-label="Nächste Sorte" onClick={()=>setSlide((slide+1)%4)}>→</button></div></div>
      </section>
      <a className="delivery" data-reveal="fade" href="/versand"><Icon name="box"/> Alles rund um den Kühlversand <span aria-hidden="true">↗</span></a>
      <section className="catalog content" id="sorten"><div className="cathead" data-reveal="rise"><h2>Unsere Auswahl<span>.</span></h2><div className="filters" aria-label="Eissorten filtern">{["Alle","Nussig","Fruchtig","Klassisch"].map(k=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{k}</button>)}</div></div>
      <div className="grid" data-reveal="cards">{catalog.filter(f=>filter==="Alle"||f.kind===filter).map(f=><article key={f.id}><button className="pack" aria-label={f.name+" ansehen"} onClick={()=>setPanel(f.id)}>
        <Image src={f.imageUrl || `/images/${f.id}-becher.webp`} alt={f.name+" im Eisbecher"} width={627} height={627}/>
        {(!f.imageUrl || f.imageUrl.includes(`/${f.artworkHash}-`)) && f.layers.map(layer => (
          <Image key={layer} className="packIngredient" src={`/images/${f.id}-${layer}.webp`}
            alt="" width={f.ingredient.width} height={f.ingredient.height} sizes="(max-width: 860px) 30vw, 15vw"
            style={{
              left: (f.ingredient.left / 627 * 100) + "%",
              top: (f.ingredient.top / 627 * 100) + "%",
              width: (f.ingredient.width / 627 * 100) + "%",
              "--ingredient-lift": (layer === "schalen" || layer === "stuecke") ? "-16px" : "-6px",
            }} />
        ))}
      </button><h3><button onClick={()=>setPanel(f.id)}>{f.name}</button></h3><p className="quantity">{packInfo(f)}</p><div className="buy">{f.price != null && <strong>{money(f.price)}</strong>}{canBuy(f) ? <button disabled={!ready} onClick={()=>add(f)}>In den Warenkorb <span>+</span></button> : <strong>{unavailable}</strong>}</div></article>)}</div></section>
      <section id="idee" className="idea"><div className="content ideaInner" data-reveal="rise"><div className="eyebrow"><Icon name="spoon"/> Unsere Idee</div><h2>Der Geschmack<br/>macht den Anfang.</h2><p>Erst die Sorte, dann der Löffel. Bei Löffelwerk findest du deinen Favoriten nach Geschmack – von fein-nussiger Pistazie bis zur fruchtigen Erdbeere.<br/><Link className="sectionLink" href="/ueber-uns">Über uns →</Link></p></div></section>
      <section id="sortenfinder" className="content flavorFinder" aria-labelledby="finder-title"
        style={{ "--flavor-accent": recommendation.color }}>
        <div>
          <h2 id="finder-title" data-reveal="rise">Welche Sorte passt zu dir?</h2>
          <fieldset className="tasteChoices" data-reveal="fade">
            <legend>Worauf hast du heute Lust?</legend>
            {catalog.map(flavor => (
              <label key={flavor.id}>
                <input type="radio" name="geschmack" checked={recommendation.id === flavor.id}
                  onChange={() => setRecommendedId(flavor.id)} />
                <span>{flavor.preference}</span>
              </label>
            ))}
          </fieldset>
        </div>
        <div className="flavorMatch" data-reveal="photo">
          <Image src={'/images/' + recommendation.id + '.webp'} alt={recommendation.name + " im Löffelwerk-Becher"}
            width={640} height={640} sizes="(max-width: 700px) 88vw, 32vw" />
          <div className="matchCaption">
            <div aria-live="polite" aria-atomic="true">
              <h3>{recommendation.name}</h3>
              <p>{recommendation.note}</p>
            </div>
            <button className="primary" type="button" onClick={() => setPanel(recommendation.id)}>
              Sorte ansehen <Icon name="arrow" />
            </button>
          </div>
        </div>
      </section>
      <section id="erdbeerpause" className="content strawberryFeature" aria-labelledby="erdbeer-title">
        <div className="strawberryPanel">
          <Image className="campaignPhoto" data-reveal="photo" src="/images/erdbeerpause.webp" alt="Eine Frau genießt Erdbeereis aus einem rosa Löffelwerk-Becher." width={1200} height={1200} sizes="(max-width: 700px) 92vw, (max-width: 1500px) 47vw, 680px"/>
          <div className="campaignCopy">
            <ScoopHeadline />
            <p>Ein Platz in der Sonne, ein Löffel in der Hand und ein Becher Erdbeereis ganz für dich.</p>
            <button type="button" className="primary" onClick={() => setPanel("erdbeere")}>Erdbeere entdecken <Icon name="arrow"/></button>
          </div>
        </div>
      </section>
      <section className="deliveryGuide" id="kuehlversand" aria-labelledby="delivery-title">
        <div className="content deliveryGuideInner">
          <div>
            <h2 id="delivery-title" data-reveal="rise">So kommt dein Eis zu dir.</h2>
            <ol className="deliverySteps" data-reveal="rise">
              <li><h3>Sorten wählen</h3><p>Stell deine Lieblingssorten im Warenkorb zusammen.</p></li>
              <li><h3>Gekühlt unterwegs</h3><p>Für den Versand ist eine isolierte Box vorgesehen. Details zur Kühlung folgen zum Verkaufsstart.</p></li>
              <li><h3>Auspacken &amp; genießen</h3><p>Öffne die Box bei der Ankunft und lege die gefrorenen Becher direkt ins Gefrierfach.</p></li>
            </ol>
            <Link className="primary" href="/versand">Versand &amp; Lieferung ansehen <Icon name="arrow"/></Link>
          </div>
          <figure data-reveal="photo">
            <Image src="/images/kuehlbox.webp" alt="Geöffnete Musterbox mit Isolierung und vier Löffelwerk-Eisbechern" width={1200} height={1200} sizes="(max-width: 700px) 92vw, (max-width: 1450px) 44vw, 640px"/>
            <figcaption>Verpackungsentwurf für die Shopvorschau</figcaption>
          </figure>
        </div>
      </section>
      <section className="content faq" id="versand" data-reveal="fade" aria-labelledby="faq-title">
        <h2 id="faq-title">Fragen zur<br/>Bestellung<span>.</span></h2>
        <div>
          {[
            ["versandkosten", "Was kostet der Versand?", "Die Versandkosten geben wir vor Verkaufsstart bekannt."],
            ["allergene", "Wo finde ich Zutaten und Allergene?", "Öffne eine Sorte, um bestätigte Angaben zu Zutaten und Allergenen zu sehen."],
            ["bestellen", "Kann ich schon bestellen?", "Du kannst die Beispielsorten in deinen Warenkorb legen. Diese Designvorschau nimmt noch keine Bestellungen oder Zahlungen an."]
          ].map(([id, question, answer]) => {
            const expanded = openQuestion === id;
            return (
              <div className="faqItem" key={id}>
                <h3>
                  <button type="button" className="faqToggle" aria-expanded={expanded} aria-controls={`answer-${id}`}
                    onClick={() => setOpenQuestion(current => current === id ? null : id)}>
                    <span>{question}</span><span className="faqIndicator" aria-hidden="true">+</span>
                  </button>
                </h3>
                <div id={`answer-${id}`} className="faqAnswer" aria-hidden={!expanded}>
                  <div><p>{answer}</p></div>
                </div>
              </div>
            );
          })}
          <Link className="sectionLink" href="/versand">Versand &amp; Lieferung →</Link>
        </div>
      </section>
    </main><footer><div className="content foot"><a className="logo" href="#inhalt">Löffelwerk.</a><div className="footGroup"><b>Sortiment</b><a href="#sorten">Eissorten</a><Link href="/ueber-uns">Über uns</Link></div><div className="footGroup"><b>Service</b><Link href="/kontakt">Kontakt</Link><Link href="/versand">Versand &amp; Lieferung</Link></div><div className="footGroup"><b>Rechtliches</b><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutz</Link></div><small>Designvorschau · Beispielsorten und Preise</small></div></footer>
    <span role="status" className="sr">{notice}</span>
    <dialog ref={dialog} onCancel={()=>setPanel(null)} onClose={()=>setPanel(null)} onClick={e=>{if(e.target===e.currentTarget)setPanel(null)}} aria-labelledby="panel-title">
      <div className="sheet"><div className="dialogHead"><h2 id="panel-title">{product?.name || (panel==="menu"?"Menü":"Warenkorb")}</h2><button className="close" aria-label="Schließen" onClick={()=>setPanel(null)}>×</button></div>
      {panel==="menu" && <div className="menuLinks">{nav}</div>}
      {product && <><Image className="detailimg" src={product.imageUrl || '/images/'+product.id+'.webp'} alt={product.name} width={500} height={500}/><p>{product.note}</p><p>{packInfo(product)}</p>{product.ingredients && product.allergens ? <div className="productFoodDetails">
        <p><strong>Zutaten:</strong> {product.ingredients}</p>
        <p><strong>Allergene:</strong> {product.allergens}</p>
      </div> : <p className="quantity">Bestätigte Angaben zu Zutaten und Allergenen folgen vor Verkaufsstart.</p>}{canBuy(product) ? <button className="primary" disabled={!ready} onClick={()=>add(product)}>In den Warenkorb · {money(product.price)}</button> : <p><strong>{unavailable}</strong></p>}</>}
      {panel==="cart" && <>
        {removedItems > 0 && <p className="cartNotice" role="status">
          Nicht mehr angebotene Sorten wurden aus deinem gespeicherten Warenkorb entfernt.
        </p>}
        {count === 0 ? <>
          <p>Dein Warenkorb ist leer.</p>
          <button className="primary" onClick={() => {
            setPanel(null);
            document.getElementById("sorten").scrollIntoView();
          }}>Sorten entdecken <Icon name="arrow" /></button>
        </> : <>
          {cartProducts.map(flavor => {
            const {quantity, priceCents} = cart[flavor.id];
            const available = canBuy(flavor);
            const changed = available && priceCents != null && priceCents !== flavor.price;
            return (
              <div className="line" key={flavor.id}>
                <Image src={flavor.imageUrl || `/images/${flavor.id}.webp`} width={60} height={60} alt="" />
                <div className="cartLineDetails">
                  <b>{flavor.name}</b>
                  <small>{flavor.sizeMl ?? 500} ml · {available ? money(flavor.price) : unavailable}</small>
                  {changed && <small className="cartNotice">Preis geändert · vorher {money(priceCents)}</small>}
                  {!available && <small className="cartNotice">Nicht in der Zwischensumme enthalten.</small>}
                  <button className="cartRemove" aria-label={flavor.name + " entfernen"}
                    onClick={() => change(flavor, -maxQuantity)}>Entfernen</button>
                </div>
                <div className="step">
                  <button aria-label={flavor.name + " verringern"} onClick={() => change(flavor, -1)}>−</button>
                  {quantity}
                  <button disabled={!available || quantity >= maxQuantity} aria-label={flavor.name + " erhöhen"}
                    onClick={() => change(flavor, 1)}>+</button>
                </div>
              </div>
            );
          })}
          {priceChanged.length > 0 && <button className="cartPriceConfirm" onClick={acknowledgePrices}>
            Preisänderungen bestätigen
          </button>}
          <p className="total"><b>Zwischensumme</b><b>{money(subtotal)}</b></p>
          <DeliveryQuote key={JSON.stringify(quoteItems)} items={quoteItems} />
        </>}
      </>}
      </div></dialog></>;
}




