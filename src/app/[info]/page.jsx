import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

const pages = {
  "ueber-uns": {
    title: "Unsere Idee",
    lead: "Vier Sorten, vier Geschmacksrichtungen. Bei Löffelwerk beginnt die Auswahl mit dem, worauf du gerade Lust hast.",
    image: "pistazie",
    sections: [
      ["Nach Geschmack entdecken", "Nussig, fruchtig oder klassisch? Mit den Filtern findest du passende Becher. In der Sortenübersicht siehst du Füllmenge, Becherpreis und Preis pro Liter auf einen Blick."],
      ["Über Löffelwerk", "Löffelwerk ist der Markenentwurf für diesen Eis-Shop. Die Geschichte der Manufaktur und Einblicke in die Herstellung folgen mit der Vorstellung der Marke."],
    ],
  },
  versand: {
    title: "Versand und Lieferung",
    lead: "Der Shop befindet sich in der Vorschau. Aktuell werden keine Bestellungen versendet.",
    sections: [
      ["Liefergebiet und Versandtage", "Die belieferten Postleitzahlen und möglichen Zustelltage werden vor Verkaufsstart veröffentlicht."],
      ["Mindestbestellung und Versandkosten", "Der Mindestbestellwert und die Kosten für den Kühlversand stehen noch nicht fest. Der Vorschau-Warenkorb zeigt die Zwischensumme der ausgewählten Becher."],
      ["Wenn eine Lieferung angetaut ist", "Die Kontaktstelle für Lieferprobleme und der Ablauf für eine Reklamation werden mit dem Versandservice bekannt gegeben."],
    ],
  },
  kontakt: {
    title: "Kontakt",
    lead: "Die Kontaktdaten des Shopbetreibers werden zum Verkaufsstart ergänzt.",
    sections: [["Fragen zum Versand", "Den aktuellen Planungsstand zu Liefergebiet, Versandkosten und Zustellung findest du unter Versand und Lieferung."]],
  },
  impressum: {
    title: "Impressum",
    lead: "Vorschau · Die Angaben zum Betreiber stehen noch aus.",
    sections: [["Anbieterangaben", "Firmenname, Anschrift und die weiteren zutreffenden Anbieterangaben werden vom Betreiber vor Veröffentlichung des Shops ergänzt."]],
  },
  datenschutz: {
    title: "Datenschutz",
    lead: "Informationen zur lokalen Shopvorschau.",
    sections: [
      ["Warenkorb auf diesem Gerät", "Die Vorschau speichert die ausgewählten Sorten und Mengen im lokalen Speicher deines Browsers. Dadurch bleibt dein Warenkorb nach dem Neuladen erhalten. Über die Website-Daten deines Browsers kannst du den Eintrag entfernen."],
      ["Verantwortlicher und Kontakt", "Die vollständigen Datenschutzinformationen zum späteren Shop einschließlich der Angaben zum Verantwortlichen werden vor Verkaufsstart ergänzt."],
    ],
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pages).map(info => ({ info }));
}

export async function generateMetadata({ params }) {
  const { info } = await params;
  return { title: pages[info] ? pages[info].title + " · Löffelwerk" : "Löffelwerk" };
}

export default async function InformationPage({ params }) {
  const { info } = await params;
  const page = pages[info];
  if (!page) notFound();

  return (
    <>
      <header>
        <div className="navwrap">
          <Link className="logo" href="/">Löffelwerk<span>.</span></Link>
          <Link href="/#sorten">Zu den Eissorten →</Link>
        </div>
      </header>
      <main className="content infoPage">
        <Link href="/" className="backLink">← Startseite</Link>
        <h1>{page.title}</h1>
        <p className="infoLead">{page.lead}</p>
        <div className={page.image ? "infoBody illustrated" : "infoBody"}>
          <div>
            {page.sections.map(([title, body]) => (
              <section key={title}><h2>{title}</h2><p>{body}</p></section>
            ))}
            {info === "kontakt" && <Link href="/versand">Versand und Lieferung →</Link>}
          </div>
          {page.image && <Image src="/images/pistazie.webp" alt="Pistazieneis im Löffelwerk-Becher" width={500} height={500}/>}
        </div>
      </main>
      <footer><div className="content infoFooter">
        {Object.entries(pages).map(([slug, entry]) => <Link key={slug} href={"/" + slug} aria-current={info === slug ? "page" : undefined}>{entry.title}</Link>)}
      </div></footer>
    </>
  );
}
