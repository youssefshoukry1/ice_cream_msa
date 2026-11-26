import "server-only";
import Stripe from "stripe";
import {menuRules} from "./menu-config.mjs";
import {validateDeliveryDestination} from "./order-pricing.mjs";

export const sandboxFlow = "loeffelwerk-sandbox";

export function allowedCheckoutOrigin(requestOrigin) {
  const environment = process.env.VERCEL_ENV;
  if (!requestOrigin) return null;
  if (environment === "production") return process.env.EISTAXI_TEST_DEMO === "true" &&
    requestOrigin === process.env.CHECKOUT_ORIGIN ? requestOrigin : null;

  const origins = [];
  if (process.env.CHECKOUT_ORIGIN) {
    try {
      origins.push(new URL(process.env.CHECKOUT_ORIGIN).origin);
    } catch {
      return null;
    }
  }
  if (environment === "preview") {
    for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
      if (host) origins.push(`https://${host}`);
    }
  } else if (!process.env.VERCEL && origins.length === 0) {
    origins.push("http://localhost:3000");
  }
  return origins.includes(requestOrigin) ? requestOrigin : null;
}

export function stripeSandbox() {
  if (process.env.VERCEL_ENV === "production" && process.env.EISTAXI_TEST_DEMO !== "true") return null;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!/^sk_test_[A-Za-z0-9]+$/.test(key ?? "")) return null;
  return new Stripe(key, {timeout: 12000, maxNetworkRetries: 1});
}

export async function createSandboxSession(stripe, quote, attemptId, origin) {
  if (quote.mode !== "sandbox" || !quote.taxIncluded ||
      quote.totalCents !== quote.subtotalCents + quote.shippingCents) {
    throw new Error("Unsupported checkout quote");
  }
  const currency = quote.currency.toLowerCase();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "de",
    allowed_payment_method_types: ["card"],
    adaptive_pricing: {enabled: false},
    billing_address_collection: "required",
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: quote.menuPreview ? "Eis-Taxi · Testrechnung" : "Löffelwerk · Testrechnung",
        metadata: {flow: sandboxFlow, checkout_attempt: attemptId},
      },
    },
    line_items: quote.lines.map(line => ({
      quantity: line.quantity,
      price_data: {
        currency,
        unit_amount: line.unitPriceCents,
        product_data: {name: line.name, metadata: {product_id: line.id}},
      },
    })),
    shipping_address_collection: {allowed_countries: [quote.destination.country]},
    custom_text: {
      shipping_address: {message: `Verwende die geprüfte Test-Postleitzahl ${quote.destination.postalCode}.`},
    },
    shipping_options: [{
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: "Kühlversand (Test)",
        fixed_amount: {amount: quote.shippingCents, currency},
      },
    }],
    metadata: {
      flow: sandboxFlow,
      ...(quote.menuPreview ? {catalog:"eistaxi-preview"} : {}),
      checkout_attempt: attemptId,
      delivery_country: quote.destination.country,
      delivery_postal_code: quote.destination.postalCode,
      total_cents: String(quote.totalCents),
    },
    success_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: quote.menuPreview ? `${origin}/menue/warenkorb` : `${origin}/checkout/cancel`,
  }, {idempotencyKey: `${sandboxFlow}:${attemptId}`});

  const shippingPending = !session.shipping_cost && session.amount_total === quote.subtotalCents;
  if (session.livemode !== false || !session.url || session.currency !== currency ||
      session.amount_subtotal !== quote.subtotalCents || (!shippingPending && session.amount_total !== quote.totalCents)) {
    throw new Error("Unexpected Stripe Checkout response");
  }
  return session.url;
}

export function sessionDelivery(session) {
  return session.collected_information?.shipping_details ?? session.shipping_details;
}

export function checkoutReturnStatus(session) {
  if (session.livemode !== false || session.metadata?.flow !== sandboxFlow) return "unknown";
  if (session.status !== "complete" || session.payment_status !== "paid") return "pending";
  if (session.currency !== "eur" || !Number.isSafeInteger(session.amount_total) ||
      String(session.amount_total) !== session.metadata.total_cents) return "amount";
  const address = sessionDelivery(session)?.address;
  const delivery = validateDeliveryDestination(address?.country, address?.postal_code,
    session.metadata?.catalog === "eistaxi-preview" ? menuRules : undefined);
  if (delivery.error || delivery.destination.country !== session.metadata.delivery_country ||
      delivery.destination.postalCode !== session.metadata.delivery_postal_code) return "address";
  return "paid";
}
