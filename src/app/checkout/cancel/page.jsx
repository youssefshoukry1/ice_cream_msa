import Link from "next/link";

export const metadata = {title: "Testzahlung abgebrochen | Löffelwerk", robots: {index: false}};

export default function CheckoutCancel() {
  return (
    <main className="content checkoutReturn">
      <h1>Testzahlung abgebrochen.</h1>
      <p>Deine Sorten sind weiterhin im Warenkorb.</p>
      <Link className="primary" href="/#sorten">Zurück zum Shop</Link>
    </main>
  );
}
