import "server-only";
import {createHash} from "node:crypto";
import {sanity} from "./sanity.mjs";
import {checkoutReturnStatus, sandboxFlow, sessionDelivery} from "./stripe-checkout.mjs";

const paymentEvents = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
export const sandboxSessionId = /^cs_test_[A-Za-z0-9]+$/;
const invoiceId = /^in_[A-Za-z0-9]+$/;

function stripeId(object) {
  return typeof object === "string" ? object : object?.id;
}

function orderId(sessionId) {
  return `order.${createHash("sha256").update(sessionId).digest("hex")}`;
}

export async function privateOrdersClient() {
  const dataset = process.env.SANITY_ORDERS_DATASET?.trim();
  const token = process.env.SANITY_ORDERS_TOKEN?.trim();
  if (!dataset || !token || dataset === sanity.config().dataset) {
    throw new Error("A separate private orders dataset and token are required");
  }
  const client = sanity.withConfig({dataset, token, useCdn: false});
  const datasets = await client.datasets.list();
  if (!datasets.some(entry => entry.name === dataset && entry.aclMode === "private")) {
    throw new Error("The orders dataset is unavailable or is not private");
  }
  return client;
}

export async function hasRecordedOrder(sessionId) {
  if (!sandboxSessionId.test(sessionId)) return false;
  const client = await privateOrdersClient();
  return client.fetch('defined(*[_id == $id && _type == "order"][0]._id)', {id: orderId(sessionId)}, {cache: "no-store"});
}

export async function recordStripeOrder(event, stripe, openOrders = privateOrdersClient) {
  if (event.livemode !== false) return "ignored";
  if (event.type === "invoice.paid") return recordInvoicePayment(event, stripe, openOrders);

  const sessionId = event.data?.object?.id;
  if (!paymentEvents.has(event.type) || typeof sessionId !== "string" ||
      !sandboxSessionId.test(sessionId)) return "ignored";

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return savePaidSession(session, event.created, stripe, openOrders);
}

async function recordInvoicePayment(event, stripe, openOrders) {
  const snapshot = event.data?.object;
  if (snapshot?.metadata?.flow !== sandboxFlow || !invoiceId.test(snapshot.id ?? "")) return "ignored";

  const invoice = await stripe.invoices.retrieve(snapshot.id);
  if (invoice.livemode !== false || invoice.status !== "paid" ||
      invoice.metadata?.flow !== sandboxFlow || !invoice.metadata.checkout_attempt) return "review";

  const payments = await stripe.invoicePayments.list({invoice: invoice.id, status: "paid", limit: 2});
  if (payments.has_more || payments.data.length > 1) return "review";
  if (payments.data.length === 0) throw new Error("Invoice payment is not available yet");
  const payment = payments.data[0];
  const paymentIntent = stripeId(payment.payment?.payment_intent);
  if (!paymentIntent || payment.livemode !== false || payment.currency !== "eur" ||
      payment.amount_paid !== invoice.amount_paid) return "review";

  const sessions = await stripe.checkout.sessions.list({payment_intent: paymentIntent, limit: 2});
  const matches = sessions.data.filter(session => session.metadata?.flow === sandboxFlow &&
    session.metadata?.checkout_attempt === invoice.metadata.checkout_attempt &&
    stripeId(session.payment_intent) === paymentIntent);
  if (sessions.has_more || matches.length > 1) return "review";
  if (matches.length === 0 || checkoutReturnStatus(matches[0]) === "pending") {
    throw new Error("Invoice Checkout Session is not ready yet");
  }
  return savePaidSession(matches[0], invoice.status_transitions?.paid_at ?? event.created, stripe, openOrders, invoice);
}

async function savePaidSession(session, paidAt, stripe, openOrders, invoice) {
  const sessionId = session.id;
  if (typeof sessionId !== "string" || !sandboxSessionId.test(sessionId)) return "ignored";
  const verified = checkoutReturnStatus(session);
  if (verified === "unknown" || verified === "pending") return "ignored";
  if (verified !== "paid") return "review";

  const shipping = sessionDelivery(session);
  const {address, name} = shipping;
  const paymentIntent = stripeId(session.payment_intent);
  const shippingCents = session.shipping_cost?.amount_total;
  if (!name || !address.line1 || !address.city || !paymentIntent ||
      !Number.isSafeInteger(shippingCents) || shippingCents < 0) return "review";

  const {data, has_more: hasMore} = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price.product"],
  });
  if (hasMore || data.length === 0 || data.some(line => !line.description ||
      !Number.isSafeInteger(line.quantity) || line.quantity < 1 ||
      !Number.isSafeInteger(line.price?.unit_amount) || line.price.unit_amount < 1 ||
      line.currency !== "eur" || line.amount_total !== line.price.unit_amount * line.quantity)) return "review";

  const lines = data.map(line => ({
    _key: line.id,
    productId: line.price.product?.metadata?.product_id ?? null,
    name: line.description,
    quantity: line.quantity,
    unitPriceCents: line.price.unit_amount,
    totalCents: line.amount_total,
  }));
  const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);
  if (subtotalCents !== session.amount_subtotal || subtotalCents + shippingCents !== session.amount_total) return "review";

  const linkedInvoiceId = stripeId(session.invoice);
  if (!invoice && invoiceId.test(linkedInvoiceId ?? "")) invoice = await stripe.invoices.retrieve(linkedInvoiceId);
  const invoicePaid = invoice?.status === "paid";
  const invoiceMatches = invoicePaid && invoice.livemode === false &&
    invoice.metadata?.flow === sandboxFlow && !!session.metadata.checkout_attempt &&
    invoice.metadata.checkout_attempt === session.metadata.checkout_attempt &&
    (!linkedInvoiceId || linkedInvoiceId === invoice.id) &&
    invoice.amount_paid === session.amount_total && invoice.total === session.amount_total &&
    invoice.currency === session.currency;

  const orders = await openOrders();
  const order = {
    _id: orderId(sessionId),
    _type: "order",
    status: "paid",
    paidAt: new Date(paidAt * 1000).toISOString(),
    stripeSessionId: sessionId,
    stripePaymentIntentId: paymentIntent,
    currency: session.currency.toUpperCase(),
    lines,
    subtotalCents,
    shippingCents,
    totalCents: session.amount_total,
    contactEmail: session.customer_details?.email ?? null,
    shipping: {
      name,
      line1: address.line1,
      line2: address.line2 ?? null,
      postalCode: address.postal_code,
      city: address.city,
      country: address.country,
    },
  };
  if (invoiceMatches) {
    const reference = {stripeId: invoice.id, number: invoice.number ?? null};
    await orders.transaction().createIfNotExists(order)
      .patch(order._id, patch => patch.setIfMissing({invoice: reference}))
      .commit({returnDocuments: false});
  } else {
    await orders.createIfNotExists(order, {returnDocuments: false});
  }
  return invoicePaid && !invoiceMatches ? "review" : "recorded";
}
