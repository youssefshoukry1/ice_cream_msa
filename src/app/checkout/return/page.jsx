import Link from "next/link";
import {checkoutReturnStatus, stripeSandbox} from "../../../lib/stripe-checkout.mjs";
import {hasRecordedOrder, sandboxSessionId} from "../../../lib/orders.mjs";

export const dynamic = "force-dynamic";
export const metadata = {title: "Testzahlung | Löffelwerk", robots: {index: false}};

const messages = {
  paid: ["Testzahlung bestätigt.", "Die Erfassung der Testbestellung ist noch nicht bestätigt. Lade diese Seite später erneut."],
  recorded: ["Testbestellung erfasst.", "Die Testzahlung wurde bestätigt und die Testbestellung erfasst."],
  pending: ["Testzahlung noch offen.", "Stripe hat den Zahlungseingang noch nicht bestätigt."],
  address: ["Testzahlung mit abweichender Lieferadresse.", "Die bei Stripe angegebene Lieferadresse passt nicht zur geprüften Test-Postleitzahl. Diese Testzahlung wird nicht zur Lieferung freigegeben."],
  amount: ["Testzahlung mit abweichendem Betrag.", "Der von Stripe gemeldete Betrag passt nicht zum geprüften Testbetrag."],
  unknown: ["Testzahlung nicht gefunden.", "Der Zahlungsstatus konnte mit diesem Link nicht überprüft werden."],
};

export default async function CheckoutReturn({searchParams}) {
  const {session_id: id} = await searchParams;
  let status = "unknown";
  if (typeof id === "string" && sandboxSessionId.test(id)) {
    try {
      const stripe = stripeSandbox();
      if (stripe) status = checkoutReturnStatus(await stripe.checkout.sessions.retrieve(id));
      if (status === "paid" && await hasRecordedOrder(id)) status = "recorded";
    } catch {
      // Keep the last verified status when either service is unavailable.
    }
  }
  const [title, message] = messages[status];
  return (
    <main className="content checkoutReturn">
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="primary" href="/#sorten">Zurück zum Shop</Link>
    </main>
  );
}
