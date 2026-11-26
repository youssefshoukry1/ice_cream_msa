import Link from "next/link";
import MenuCartReceipt from "./MenuCartReceipt";
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
  let menuAttempt;
  if (typeof id === "string" && sandboxSessionId.test(id)) {
    try {
      const stripe = stripeSandbox();
      if (stripe) {
        const session = await stripe.checkout.sessions.retrieve(id);
        status = checkoutReturnStatus(session);
        if (session.metadata?.catalog === "eistaxi-preview") menuAttempt=session.metadata.checkout_attempt;
      }
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
      {menuAttempt && ["paid","recorded"].includes(status) && <MenuCartReceipt attempt={menuAttempt}/>}
      <Link className="primary" href={menuAttempt?"/menue":"/#sorten"}>Zurück zum Shop</Link>
    </main>
  );
}
