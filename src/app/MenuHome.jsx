"use client";

import Link from "next/link";
import {TasteFinder,OrderFaq,StoreFooter} from "./StoreSections";
import {useRef, useState} from "react";
import {useScrollReveals} from "./useScrollReveals";
import HeroHover from "./HeroHover";
import ScoopHeadline from "./ScoopHeadline";
import {previewAvailable} from "../lib/menu-config.mjs";
import styles from "./MenuHome.module.css";

const heroKeys = ["desserts-18", "desserts-27", "desserts-04", "desserts-17"];
const picks = [
  ["desserts-15", "Spaghetti Eis"], ["drinks-02", "Shakes & Getränke"],
  ["extras-08", "Extras"], ["desserts-02", "Kinderbecher"],
];
const euro = new Intl.NumberFormat("de-DE", {style:"currency", currency:"EUR"});
const detail = product => product ? "/menue/produkt/" + product.slug : "/menue";

function Photo({product, eager = false}) {
  return product?.image && <img src={product.image + "?w=960&auto=format"} alt={product.name}
    width={960} height={960} loading={eager ? "eager" : "lazy"}/>;
}

export default function MenuHome({products}) {
  const friendsSection = useRef(null);
  useScrollReveals(friendsSection);
  const [slide, setSlide] = useState(0);
  const [filter, setFilter] = useState("Alle");
  const byKey = new Map(products.filter(p => p.image && p.slug && previewAvailable(p)).map(p => [p.key,p]));
  const slides = heroKeys.map(key => byKey.get(key)).filter(Boolean);
  const hero = slides[slide % slides.length];
  const sundae = products.find(p => p.key === "desserts-19" && p.image && p.slug);
  const guide = byKey.get("desserts-27");
  const deliveryFeature = byKey.get("drinks-01");

  return <>
    <header><div className="navwrap"><Link className="logo" href="/">Eis-Taxi.</Link>
      <nav aria-label="Hauptnavigation"><Link href="/menue">Speisekarte</Link><a href="#idee">Unsere Idee</a><a href="#lieferung">Lieferung</a></nav>
      <Link className="cartbtn" href="/menue/warenkorb">Warenkorb</Link></div></header>
    {hero && <HeroHover />}
    <main id="inhalt">
      {hero && <section className="hero" aria-label="Becher im Fokus">
        <div className="intro"><div className="eyebrow"><span className="dash"/> Becher im Fokus</div>
          <h1 className={styles.headline}>{hero.name}.</h1><p>{hero.description}</p>
          <Link className="primary" href={detail(hero)}>Becher entdecken <span className="ctaArrow" aria-hidden="true">→</span></Link></div>
        <div className={"heroart "+styles.art}><Photo product={hero} eager/>
          {slides.length > 1 && <div className="photocontrol"><span>{slide + 1} / {slides.length}</span>
            <button aria-label="Vorheriger Becher" onClick={()=>setSlide((slide+slides.length-1)%slides.length)}>←</button>
            <button aria-label="Nächster Becher" onClick={()=>setSlide((slide+1)%slides.length)}>→</button></div>}</div>
      </section>}
      <a className="delivery" href="#lieferung">Lieferung in Norderstedt · Mindestbestellwert 14,00 € · Liefergebühr 2,00 €</a>
      <section className="catalog content" id="sorten">
        <div className="cathead"><h2>Unsere Auswahl.</h2><div className="filters" aria-label="Auswahl filtern">
          {["Alle",...picks.filter(([key])=>byKey.has(key)).map(([,label])=>label)].map(label=><button key={label} aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label}</button>)}</div></div>
        <div className="grid">{picks.filter(([,tag])=>filter==="Alle"||filter===tag).map(([key])=>{
          const p = byKey.get(key);
          if (!p) return null;
          const prices = p.variants?.map(v=>v.priceCents) ?? [];
          return <article className={styles.productCard} key={key}><Link className={"pack "+styles.pack} href={detail(p)}><Photo product={p}/></Link>
            <h3><Link href={detail(p)}>{p.name}</Link></h3><div className="buy">
              {prices.length>0 && <strong>{prices.length>1?"ab ":""}{euro.format(Math.min(...prices)/100)}</strong>}
              <Link className={"primary "+styles.portion} href={detail(p)}>Portion ansehen <span className="ctaArrow" aria-hidden="true">→</span></Link></div></article>;
        })}</div><Link className="sectionLink" href="/menue">Alle Kollektionen →</Link>
      </section>
      <div className={styles.meltingEdge} aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" focusable="false">
          <path d="M0 0H1440V18C1405 18 1400 55 1360 55C1320 55 1325 15 1280 15C1235 15 1240 72 1190 72C1140 72 1145 22 1100 22C1055 22 1055 47 1010 47C965 47 970 12 925 12C880 12 890 78 835 78C780 78 790 20 740 20C690 20 695 52 650 52C605 52 610 14 565 14C520 14 525 68 475 68C425 68 430 24 380 24C330 24 335 48 290 48C245 48 250 12 205 12C160 12 165 74 110 74C55 74 65 20 0 20Z"/>
        </svg>
      </div>
      <section id="idee" className={"idea "+styles.biscuitSection}><div className="content ideaInner"><div className="eyebrow">Unsere Idee</div>
        <h2>Der Geschmack macht den Anfang.</h2><p>Vanilleeis durch die Presse, Erdbeersauce darüber und weiße Raspelschokolade zum Schluss.
          {" "}<Link className="sectionLink" href={detail(guide)}>Spaghetti Eis entdecken →</Link></p></div></section>
      <TasteFinder products={products}/>
      {sundae && <section id="erdbeerpause" className={"content strawberryFeature "+styles.berrySection} aria-labelledby="erdbeer-title">
        <div className="strawberryPanel">
          <img className="campaignPhoto" src="/images/erdbeerpause-eis-taxi.webp"
            alt="Eine Frau genießt einen Erdbeer Becher auf einer sonnigen Terrasse." width={1024} height={1024} loading="lazy"/>
          <div className="campaignCopy">
            <ScoopHeadline/>
            <p>Vanilleeis, frische Erdbeeren, Sahne und hausgemachte Erdbeersauce.</p>
            {!previewAvailable(sundae) && <p>Nur in der Erdbeersaison erhältlich.</p>}
            <Link className="primary" href={detail(sundae)}>Erdbeer Becher entdecken <span className="ctaArrow" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>}
      <section id="lieferung" className={"content "+styles.split+" "+styles.waveSection+" "+styles.matchaWave}><div><h2>So kommt dein Eis zu dir.</h2>
        <p>Produkt und Größe wählen, die Lieferung prüfen und die Bestellung im Warenkorb ansehen.</p>
        <Link className="primary" href={deliveryFeature ? "/menue/getraenke" : "/menue"}>{deliveryFeature ? "Getränke entdecken" : "Menü entdecken"} <span className="ctaArrow" aria-hidden="true">→</span></Link></div>
        <Photo product={deliveryFeature}/></section>
      <div className={styles.friendsSection}>
      <section ref={friendsSection} id="lieblingsmomente"
        className={"content "+styles.friends} aria-labelledby="friends-title">
        <div className={styles.friendsCopy} data-reveal="rise">
          <h2 id="friends-title">Ein Tisch.<br/>Viele Lieblingsmomente.</h2>
          <p>Für die kleine Pause zusammen: Jeder findet seinen Lieblingsbecher.</p>
          <Link className="primary" href="/menue/eisbecher">Lieblingsbecher entdecken <span className="ctaArrow" aria-hidden="true">→</span></Link>
        </div>
        <img className={styles.friendsPhoto} data-reveal="photo" src="/images/eis-taxi-friends-v4.webp"
          alt="Eine Frau und zwei Männer genießen Cookies Becher, Eisschokolade und Früchte Becher an einem kleinen Cafétisch im Freien."
          width={1400} height={1400} loading="lazy"/>
      </section>
      </div>
      <OrderFaq/>
    </main>
    <StoreFooter/>
  </>;
}
