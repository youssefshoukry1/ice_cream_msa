"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import HeroHover from "./HeroHover";
import { useScrollReveals } from "./useScrollReveals";

const flavors = [
  { id: "pistazie", ingredient: { left: 58, top: 497, width: 256, height: 107 }, preference: "Nussig", name: "Pistazie", kind: "Nussig", note: "Fein geröstet und herrlich cremig.", headline: "Ein Löffel", finish: "Pistazie.", color: "#dce9b5", price: 690 },
  { id: "erdbeere", ingredient: { left: 435, top: 428, width: 152, height: 150 }, preference: "Fruchtig", name: "Erdbeere", kind: "Fruchtig", note: "Fruchtig, frisch und sommerlich.", headline: "Ein Löffel", finish: "Sommer.", color: "#f4c0ce", price: 650 },
  { id: "vanille", ingredient: { left: 230, top: 467, width: 357, height: 136 }, preference: "Sanft & süß", name: "Vanille", kind: "Klassisch", note: "Sanfte Vanille und feine Süße.", headline: "Ein Löffel", finish: "Vanille.", color: "#ffe5a3", price: 650 },
  { id: "schokolade", ingredient: { left: 327, top: 460, width: 270, height: 139 }, preference: "Intensiv & schokoladig", name: "Schokolade", kind: "Klassisch", note: "Dunkler Kakao und voller Geschmack.", headline: "Ein Löffel", finish: "Schoko.", color: "#d9ebf5", price: 690 },
];
const money = (cents) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
const key = "loeffelwerk-preview-cart-v1";
function Icon({name}) {
  const paths = { bag: <><path d="M4 8h16l1 13H3L4 8Z"/><path d="M8 9V7a4 4 0 018 0v2"/></>, arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>, spoon: <><ellipse cx="15" cy="7.5" rx="4.2" ry="6" transform="rotate(34 15 7.5)"/><path d="m12 12-8 10"/></>, menu: <path d="M3 7h18M3 12h18M3 17h18"/>, box: <><path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4m-9 4v10"/></> };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export default function Home() {
  const main = useRef(null);
  useScrollReveals(main);
  const [slide, setSlide] = useState(0);
  const [recommendation, setRecommendation] = useState(flavors[0]);
  const [filter, setFilter] = useState("Alle");
  const [cart, setCart] = useState({});
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef(null);
  const item = flavors[slide];
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      setCart(Object.fromEntries(flavors.filter(f => Number.isInteger(saved?.[f.id]) && saved[f.id] > 0).map(f => [f.id, Math.min(99, saved[f.id])])));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(key, JSON.stringify(cart)); } catch {} } }, [cart, ready]);
  useEffect(() => {
    if (panel && !dialog.current.open) dialog.current.showModal();
    if (!panel && dialog.current.open) dialog.current.close();
  }, [panel]);
  const count = Object.values(cart).reduce((a,b) => a+b,0);
  function change(id, delta) {
    setCart(previous => ({...previous, [id]: Math.max(0, Math.min(99,(previous[id] || 0) + delta))}));
  }
  function add(f) { change(f.id,1); setNotice(f.name + " liegt im Warenkorb."); setPanel("cart"); }
  const product = flavors.find(f => f.id === panel);
  const nav = <><a href="#sorten" onClick={()=>setPanel(null)}>Eissorten</a><a href="#idee" onClick={()=>setPanel(null)}>Unsere Idee</a><a href="#versand" onClick={()=>setPanel(null)}>Versand &amp; Fragen</a></>;
  return <>
    <a className="skip" href="#inhalt">Zum Inhalt</a>
    <header><div className="navwrap"><a className="logo" href="#inhalt" aria-label="Löffelwerk Startseite">Löffelwerk<span>.</span></a><nav aria-label="Hauptnavigation">{nav}</nav><div className="tools"><button className="cartbtn" onClick={()=>setPanel("cart")}><Icon name="bag"/><span>Warenkorb</span><b>{count}</b></button><button className="menubtn" aria-label="Menü öffnen" onClick={()=>setPanel("menu")}><Icon name="menu"/></button></div></div></header>
    <HeroHover />
    <main id="inhalt" ref={main}>
      <section className="hero" aria-label="Eis im Mittelpunkt">
        <div className="intro"><div className="eyebrow"><span className="dash"/>Sorte im Fokus</div><h1>{item.headline}<br/><i>{item.finish}</i></h1><p>{item.note} Entdecke unsere vier Sorten für deinen nächsten Eis-Moment.</p><a className="primary" href="#sorten">Sorten entdecken <Icon name="arrow"/></a></div>
        <div className="heroart" style={{background:item.color}}><Image key={item.id} src={'/images/'+item.id+'.webp'} width={768} height={768} priority alt={item.name+" im Löffelwerk-Becher mit Eiskugel"}/><div className="photocontrol"><span>{String(slide+1).padStart(2,"0")} / 04</span><button aria-label="Vorherige Sorte" onClick={()=>setSlide((slide+3)%4)}>←</button><button aria-label="Nächste Sorte" onClick={()=>setSlide((slide+1)%4)}>→</button></div></div>
      </section>
      <a className="delivery" data-reveal="fade" href="/versand"><Icon name="box"/> Alles rund um den Kühlversand <span aria-hidden="true">↗</span></a>
      <section className="catalog content" id="sorten"><div className="cathead" data-reveal="rise"><h2>Unsere Auswahl<span>.</span></h2><div className="filters" aria-label="Eissorten filtern">{["Alle","Nussig","Fruchtig","Klassisch"].map(k=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{k}</button>)}</div></div>
      <div className="grid" data-reveal="cards">{flavors.filter(f=>filter==="Alle"||f.kind===filter).map(f=><article key={f.id}><button className="pack" aria-label={f.name+" ansehen"} onClick={()=>setPanel(f.id)}>
        <Image src={`/images/${f.id}-becher.webp`} alt={f.name+" im Eisbecher"} width={627} height={627}/>
        <Image className="packIngredient" src={`/images/${f.id}-${f.id === "erdbeere" ? "frucht" : "zutat"}.webp`}
          alt="" width={f.ingredient.width} height={f.ingredient.height} sizes="(max-width: 860px) 30vw, 15vw"
          style={{left: (f.ingredient.left / 627 * 100) + "%", top: (f.ingredient.top / 627 * 100) + "%", width: (f.ingredient.width / 627 * 100) + "%"}}/>
      </button><h3><button onClick={()=>setPanel(f.id)}>{f.name}</button></h3><p className="quantity">500 ml <span>·</span> {money(f.price*2)}/l</p><div className="buy"><strong>{money(f.price)}</strong><button onClick={()=>add(f)}>In den Warenkorb <span>+</span></button></div></article>)}</div></section>
      <section id="idee" className="idea"><div className="content ideaInner" data-reveal="rise"><div className="eyebrow"><Icon name="spoon"/> Unsere Idee</div><h2>Der Geschmack<br/>macht den Anfang.</h2><p>Erst die Sorte, dann der Löffel. Bei Löffelwerk findest du deinen Favoriten nach Geschmack – von fein-nussiger Pistazie bis zur fruchtigen Erdbeere.<br/><Link className="sectionLink" href="/ueber-uns">Über uns →</Link></p></div></section>
      <section id="sortenfinder" className="content flavorFinder" aria-labelledby="finder-title"
        style={{ "--flavor-accent": recommendation.color }}>
        <div>
          <h2 id="finder-title" data-reveal="rise">Welche Sorte passt zu dir?</h2>
          <fieldset className="tasteChoices" data-reveal="fade">
            <legend>Worauf hast du heute Lust?</legend>
            {flavors.map(flavor => (
              <label key={flavor.id}>
                <input type="radio" name="geschmack" checked={recommendation.id === flavor.id}
                  onChange={() => setRecommendation(flavor)} />
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
          <div className="campaignCopy" data-reveal="rise">
            <h2 id="erdbeer-title">Zeit für eine Erdbeerpause.</h2>
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
      <section className="content faq" id="versand" data-reveal="fade"><h2>Fragen zur<br/>Bestellung<span>.</span></h2><div>{[["Was kostet der Versand?","Die Versandkosten geben wir vor Verkaufsstart bekannt."],["Wo finde ich Zutaten und Allergene?","Die verbindlichen Angaben zu Zutaten und Allergenen folgen vor dem Verkaufsstart auf den jeweiligen Produktseiten."],["Kann ich schon bestellen?","Du kannst die Beispielsorten in deinen Warenkorb legen. Diese Designvorschau nimmt noch keine Bestellungen oder Zahlungen an."]].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}<Link className="sectionLink" href="/versand">Versand &amp; Lieferung →</Link></div></section>
    </main><footer><div className="content foot"><a className="logo" href="#inhalt">Löffelwerk.</a><div className="footGroup"><b>Sortiment</b><a href="#sorten">Eissorten</a><Link href="/ueber-uns">Über uns</Link></div><div className="footGroup"><b>Service</b><Link href="/kontakt">Kontakt</Link><Link href="/versand">Versand &amp; Lieferung</Link></div><div className="footGroup"><b>Rechtliches</b><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutz</Link></div><small>Designvorschau · Beispielsorten und Preise</small></div></footer>
    <span role="status" className="sr">{notice}</span>
    <dialog ref={dialog} onCancel={()=>setPanel(null)} onClose={()=>setPanel(null)} onClick={e=>{if(e.target===e.currentTarget)setPanel(null)}} aria-labelledby="panel-title">
      <div className="sheet"><div className="dialogHead"><h2 id="panel-title">{product?.name || (panel==="menu"?"Menü":"Warenkorb")}</h2><button className="close" aria-label="Schließen" onClick={()=>setPanel(null)}>×</button></div>
      {panel==="menu" && <div className="menuLinks">{nav}</div>}
      {product && <><Image className="detailimg" src={'/images/'+product.id+'.webp'} alt={product.name} width={500} height={500}/><p>{product.note}</p><p>500 ml · {money(product.price*2)}/l</p><p className="quantity">Zutaten und Allergene werden vor Verkaufsstart ergänzt.</p><button className="primary" onClick={()=>add(product)}>In den Warenkorb · {money(product.price)}</button></>}
      {panel==="cart" && <>{count===0?<p>Dein Warenkorb ist leer.</p>:<>{flavors.filter(f=>cart[f.id]>0).map(f=><div className="line" key={f.id}><Image src={'/images/'+f.id+'.webp'} width={60} height={60} alt=""/><div><b>{f.name}</b><small>500 ml · {money(f.price)}</small></div><div className="step"><button aria-label={f.name+" verringern"} onClick={()=>change(f.id,-1)}>−</button>{cart[f.id]}<button disabled={cart[f.id]>=99} aria-label={f.name+" erhöhen"} onClick={()=>change(f.id,1)}>+</button></div></div>)}<p className="total"><b>Zwischensumme</b><b>{money(flavors.reduce((s,f)=>s+(cart[f.id]||0)*f.price,0))}</b></p><p className="quantity">Designvorschau · Bestellungen sind noch nicht möglich.</p></>}<button className="primary" onClick={()=>{setPanel(null);document.getElementById("sorten").scrollIntoView()}}>Sorten entdecken <Icon name="arrow"/></button></>}
      </div></dialog></>;
}



