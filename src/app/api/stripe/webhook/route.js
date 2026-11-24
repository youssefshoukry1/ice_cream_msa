import {recordStripeOrder} from "../../../../lib/orders.mjs";
import {stripeSandbox} from "../../../../lib/stripe-checkout.mjs";

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({error: "INVALID_SIGNATURE"}, {status: 400});

  const stripe = stripeSandbox();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret?.startsWith("whsec_")) return Response.json({error: "WEBHOOK_NOT_CONFIGURED"}, {status: 503});

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return Response.json({error: "INVALID_SIGNATURE"}, {status: 400});
  }

  try {
    const outcome = await recordStripeOrder(event, stripe);
    if (outcome === "review") console.warn("Stripe Sandbox order requires review before fulfillment");
    return Response.json({received: true, outcome});
  } catch {
    // Leave failed writes retryable without logging customer or payment details.
    console.error("Stripe Sandbox order recording failed");
    return Response.json({error: "ORDER_RECORDING_FAILED"}, {status: 503});
  }
}
