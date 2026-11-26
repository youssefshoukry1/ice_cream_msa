"use client";
import Link from "next/link";
import {useState} from "react";
import styles from "./MenuHome.module.css";
const tastes = [
  ["desserts-01", "Sanft & süß", "#ffda84", "#34190c"],
  ["drinks-04", "Kaffee", "#513025", "#fff8eb"],
  ["desserts-05", "Schokoladig", "#ba8364", "#34190c"],
  ["extras-05", "Fruchtig", "#e7838b", "#34190c"],
];

const detail = product => product ? "/menue/produkt/" + product.slug : "/menue";
function Photo({product}) {
  return product?.image ? <img src={product.image+"?w=960&auto=format"} width={960} height={960} alt={product.name} loading="lazy"/> : null;
}
export function TasteFinder({products}) {
  const byKey=new Map(products.map(p=>[p.key,p]));
  const [taste,setTaste]=useState("desserts-01");
  const match=byKey.get(taste);
  return (<section id="geschmacksfinder" className={"content "+styles.split+" "+styles.waveSection}><div><div className="eyebrow">Geschmacksfinder</div><h2>Worauf hast du Lust?</h2>
        <div className={`filters ${styles.tasteFilters}`}>
          {tastes.filter(([key])=>byKey.has(key)).map(([key,label,background,color])=>(
            <button key={key} style={{"--taste-background":background,"--taste-color":color}}
              aria-pressed={taste===key} onClick={()=>setTaste(key)}>{label}</button>
          ))}
        </div>
        {match && <><h3>{match.name}</h3><Link className="sectionLink" href={detail(match)}>Auswahl ansehen →</Link></>}</div><Photo product={match}/></section>);
}
export function OrderFaq() {
  const [question,setQuestion]=useState(null);
  return (<section className="content faq"><h2>Fragen zur Bestellung.</h2><div>
        {[["Was kostet die Lieferung?","2,00 € bei einem Mindestbestellwert von 14,00 €."],
          ["Wo finde ich Zutaten und Allergene?","Auf der jeweiligen Produktseite findest du die Beschreibung und die Zutatenhinweise mit den Nummern der Speisekarte."],
          ["Kann ich Größe und Eissorten auswählen?","Je nach Produkt kannst du auf der Produktseite die Portion und die angebotenen Eissorten oder Extras auswählen, bevor du es in den Warenkorb legst."],
          ["Wie teste ich die Bestellung?","Verwende im Testshop die Postleitzahl 22846. Die Website ist aktuell eine Menüvorschau mit Testbestellungen."]].map(([label,answer],i)=>
          <div className="faqItem" key={label}>
            <h3><button type="button" className="faqToggle" id={`menu-faq-${i}`} aria-controls={`menu-answer-${i}`} aria-expanded={question===i} onClick={()=>setQuestion(question===i?null:i)}>
              <span>{label}</span><span className={"faqIndicator "+styles.faqIcon} aria-hidden="true"/>
            </button></h3>
            <div className="faqAnswer" id={`menu-answer-${i}`} role="region" aria-labelledby={`menu-faq-${i}`} aria-hidden={question!==i}>
              <div><p>{answer}</p></div>
            </div>
          </div>)}</div></section>);
}
export function StoreFooter() {
  return (<footer><div className="content foot"><Link className="logo" href="/">Eis-Taxi.</Link>
      <Link href="/menue">Speisekarte</Link><Link href="/menue/warenkorb">Warenkorb</Link><small>Menüvorschau · Testbestellungen</small></div></footer>);
}
