import {useRef, useState} from "react";

const money = new Intl.NumberFormat("de-DE", {style: "currency", currency: "EUR"});

function format(cents) {
  return money.format(cents / 100);
}

function errorMessage(result) {
  switch (result.error) {
    case "INVALID_ADDRESS":
      return "Bitte gib eine fünfstellige Postleitzahl ein.";
    case "OUTSIDE_DELIVERY_AREA":
      return "Diese Postleitzahl liegt außerhalb des Test-Liefergebiets.";
    case "PRODUCT_UNAVAILABLE":
      return "Mindestens eine Sorte ist derzeit nicht verfügbar. Passe deinen Warenkorb an und berechne den Versand erneut.";
    case "MINIMUM_NOT_MET":
      return `Für den Testversand beträgt der Mindestbestellwert ${format(result.minimumSubtotalCents)}.`;
    case "QUOTE_CHANGED":
      return "Die Preise haben sich geändert. Bitte berechne den Versand erneut.";
    case "CHECKOUT_NOT_CONFIGURED":
      return "Stripe Sandbox ist für diese Vorschau noch nicht eingerichtet.";
    case "CHECKOUT_PAUSED":
      return "Der Checkout ist vorübergehend pausiert. Dein Warenkorb bleibt erhalten.";
    default:
      return "Der Vorgang konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut.";
  }
}

export default function DeliveryQuote({items}) {
  const [postalCode, setPostalCode] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const checkoutAttempt = useRef(null);
  const checkoutInFlight = useRef(false);
  const hasQuote = Boolean(result && !result.error);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    setCheckoutError(null);
    checkoutAttempt.current = null;
    try {
      const response = await fetch("/api/cart/quote", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({items, country: "DE", postalCode}),
      });
      setResult(await response.json());
    } catch {
      setResult({error: "QUOTE_UNAVAILABLE"});
    } finally {
      setPending(false);
    }
  }

  async function startCheckout() {
    if (checkoutInFlight.current || !result || result.error) return;
    checkoutInFlight.current = true;
    setStartingCheckout(true);
    setCheckoutError(null);
    try {
      checkoutAttempt.current ??= crypto.randomUUID();
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          items,
          country: "DE",
          postalCode,
          expectedTotalCents: result.totalCents,
          attemptId: checkoutAttempt.current,
        }),
      });
      const checkout = await response.json();
      if (response.ok && checkout.url) {
        window.location.assign(checkout.url);
        return;
      }
      if (checkout.error === "QUOTE_CHANGED") setResult(null);
      setCheckoutError(checkout);
    } catch {
      setCheckoutError({error: "CHECKOUT_UNAVAILABLE"});
    }
    setStartingCheckout(false);
    checkoutInFlight.current = false;
  }

  return (
    <section className="deliveryQuote" aria-labelledby="delivery-quote-title">
      <h3 id="delivery-quote-title">Kühlversand testen</h3>
      <p className="quantity" id="delivery-quote-hint">Versandvorschau mit Testwerten für Deutschland. Test-Postleitzahlen: 10115 oder 10117.</p>
      <form id="delivery-quote-form" className="deliveryQuoteForm" onSubmit={submit}>
        <label htmlFor="delivery-zipcode">Postleitzahl</label>
        <input id="delivery-zipcode" value={postalCode} onChange={event => {
          setPostalCode(event.target.value);
          setResult(null);
          setCheckoutError(null);
        }} inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="off"
          aria-describedby="delivery-quote-hint" required disabled={pending || startingCheckout} />
      </form>
      <div aria-live="polite" aria-atomic="true">
        {result?.error && <p className="cartNotice">{errorMessage(result)}</p>}
        {hasQuote && <dl className="deliveryQuoteTotals">
          <div><dt>Warenwert</dt><dd>{format(result.subtotalCents)}</dd></div>
          <div><dt>Kühlversand</dt><dd>{format(result.shippingCents)}</dd></div>
          <div><dt>{result.taxIncluded ? "Enthaltene Teststeuer" : "Teststeuer"}</dt><dd>{format(result.taxCents)}</dd></div>
          <div><dt>Gesamt (Test)</dt><dd>{format(result.totalCents)}</dd></div>
        </dl>}
        {checkoutError && <p className="cartNotice">{errorMessage(checkoutError)}</p>}
      </div>
      {hasQuote && <p className="quantity">Verwende bei Stripe dieselbe Test-Postleitzahl.</p>}
      <p className="quantity">Designvorschau · Bestellungen sind noch nicht möglich.</p>
      {hasQuote ? (
        <button type="button" className="primary" disabled={startingCheckout} onClick={startCheckout}>
          {startingCheckout ? "Stripe wird geöffnet …" : "Weiter zu Stripe (Test)"}
        </button>
      ) : (
        <button type="submit" form="delivery-quote-form" className="primary" disabled={pending}>
          {pending ? "Wird berechnet …" : "Versand berechnen"}
        </button>
      )}
    </section>
  );
}
